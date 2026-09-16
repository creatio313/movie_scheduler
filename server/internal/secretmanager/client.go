package secretmanager

import (
	"bytes"
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"
)

const (
	servicePrincipalTokenURL = "https://secure.sakura.ad.jp/cloud/api/iam/1.0/service-principals/oauth2/token"
)

// SecretClient is a client for Sakura Cloud Secret Manager
type SecretClient struct {
	vaultID    string
	secretName string
	zone       string
	token      string
}

// シークレットマネージャのクライアントを作成する
func NewSecretClient(vaultID, secretName, zone string) (*SecretClient, error) {
	if vaultID == "" {
		return nil, fmt.Errorf("SAKURA_VAULT_IDは必須項目です。")
	}

	if secretName == "" {
		secretName = "movie_schedule_db_password"
	}

	if zone == "" {
		zone = "is1c"
	}

	// サービスプリンシパルキーを用いてアクセストークンを発行する
	token, err := issueAccessTokenWithServicePrincipal()
	if err != nil {
		return nil, fmt.Errorf("アクセストークンの発行に失敗しました：%w", err)
	}

	return &SecretClient{
		vaultID:    vaultID,
		secretName: secretName,
		zone:       zone,
		token:      token,
	}, nil
}

/*
**
サービスプリンシパルを用いてアクセストークンを発行する関数
*/
func issueAccessTokenWithServicePrincipal() (string, error) {
	resourceID := strings.TrimSpace(os.Getenv("SAKURA_SERVICE_PRINCIPAL_RESOURCE_ID"))
	keyID := strings.TrimSpace(os.Getenv("SAKURA_SERVICE_PRINCIPAL_KEY_ID"))
	privateKeyPEM := strings.TrimSpace(os.Getenv("SAKURA_SERVICE_PRINCIPAL_PRIVATE_KEY"))

	// サービスプリンシパルの情報が揃っているか確認する
	if resourceID == "" || keyID == "" || privateKeyPEM == "" {
		return "", fmt.Errorf("SAKURA_SERVICE_PRINCIPAL_RESOURCE_ID, SAKURA_SERVICE_PRINCIPAL_KEY_ID, および SAKURA_SERVICE_PRINCIPAL_PRIVATE_KEY (秘密鍵の内容）は必須項目です。")
	}

	// 環境変数から取得した秘密鍵データで署名付きJWTを作成する
	jwtToken, err := createSignedJWT(resourceID, keyID, privateKeyPEM)
	if err != nil {
		return "", err
	}

	form := url.Values{}
	form.Set("grant_type", "urn:ietf:params:oauth:grant-type:jwt-bearer")
	form.Set("assertion", jwtToken)

	req, err := http.NewRequestWithContext(context.Background(), http.MethodPost, servicePrincipalTokenURL, strings.NewReader(form.Encode()))
	if err != nil {
		return "", fmt.Errorf("アクセストークン要求の作成に失敗しました：%w", err)
	}
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("アクセストークンの取得に失敗しました：%w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("トークンレスポンスの読み取りに失敗しました：%w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("トークンAPIがステータス%dを返却しました：%s", resp.StatusCode, string(respBody))
	}

	var tokenResp struct {
		AccessToken string `json:"access_token"`
		// 他のフィールドが必要であればここに追加
		/** 全体例：{
		  "access_token": "******************************************************",
		  "token_type": "Bearer",
		  "token_expired_at": "2025-08-20T07:48:44.697659+00:00",
		  "expires_in": 3600
		*/
	}
	if err := json.Unmarshal(respBody, &tokenResp); err != nil {
		return "", fmt.Errorf("トークン取得応答の解析に失敗しました：%w", err)
	}
	if tokenResp.AccessToken == "" {
		return "", fmt.Errorf("トークン取得応答にaccess tokenが含まれていません。")
	}

	return "Bearer " + tokenResp.AccessToken, nil
}
func createSignedJWT(resourceID, keyID, privateKeyPEM string) (string, error) {
	now := time.Now().Unix()

	header := map[string]string{
		"alg": "RS256",
		"kid": keyID,
		"typ": "JWT",
	}
	payload := map[string]interface{}{
		"aud": servicePrincipalTokenURL,
		"exp": now + 300,
		"iat": now,
		"iss": resourceID,
		"sub": resourceID,
	}

	headerJSON, err := json.Marshal(header)
	if err != nil {
		return "", fmt.Errorf("JWTヘッダーのエンコードに失敗しました：%w", err)
	}
	payloadJSON, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("JWTペイロードのエンコードに失敗しました：%w", err)
	}

	encodedHeader := base64.RawURLEncoding.EncodeToString(headerJSON)
	encodedPayload := base64.RawURLEncoding.EncodeToString(payloadJSON)
	signingInput := encodedHeader + "." + encodedPayload

	privateKey, err := parseRSAPrivateKey(privateKeyPEM)
	if err != nil {
		return "", err
	}

	h := sha256.Sum256([]byte(signingInput))
	signature, err := rsa.SignPKCS1v15(rand.Reader, privateKey, crypto.SHA256, h[:])
	if err != nil {
		return "", fmt.Errorf("JWT署名に失敗しました：%w", err)
	}

	encodedSignature := base64.RawURLEncoding.EncodeToString(signature)
	return signingInput + "." + encodedSignature, nil
}

// 秘密鍵を解析して読み込むだけの関数（PKCS#1およびPKCS#8形式に対応）
func parseRSAPrivateKey(privateKeyPEM string) (*rsa.PrivateKey, error) {
	normalized := strings.ReplaceAll(privateKeyPEM, "\\n", "\n")
	block, _ := pem.Decode([]byte(normalized))
	if block == nil {
		return nil, fmt.Errorf("サービスプリンシパルキーのPEMデコードに失敗しました。")
	}

	if key, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return key, nil
	}

	parsedKey, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("秘密鍵の解析に失敗しました：%w", err)
	}

	rsaKey, ok := parsedKey.(*rsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("秘密鍵がRSA形式ではありません。")
	}

	return rsaKey, nil
}

func (sc *SecretClient) FetchDatabasePassword() (string, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	apiURL := fmt.Sprintf("https://secure.sakura.ad.jp/cloud/zone/%s/api/cloud/1.1/secretmanager/vaults/%s/secrets/unveil", sc.zone, sc.vaultID)

	// リクエストボディ作成
	body := map[string]interface{}{
		"Secret": map[string]interface{}{
			"Name": sc.secretName,
		},
	}
	bodyBytes, err := json.Marshal(body)
	if err != nil {
		return "", fmt.Errorf("シークレット取得要求のリクエストボディ作成に失敗しました：%w", err)
	}

	client := &http.Client{Timeout: 10 * time.Second}
	statusCode, respBody, err := sc.fetchDatabasePasswordWithToken(ctx, client, apiURL, bodyBytes)
	if err != nil {
		return "", err
	}

	if statusCode == http.StatusUnauthorized || statusCode == http.StatusForbidden {
		newToken, err := issueAccessTokenWithServicePrincipal()
		if err != nil {
			return "", fmt.Errorf("アクセストークン再発行に失敗しました：%w", err)
		}
		sc.token = newToken

		statusCode, respBody, err = sc.fetchDatabasePasswordWithToken(ctx, client, apiURL, bodyBytes)
		if err != nil {
			return "", err
		}
	}

	if statusCode != http.StatusOK {
		return "", fmt.Errorf("シークレットマネージャAPIがステータス%dを返却しました：%s", statusCode, string(respBody))
	}

	var apiResp struct {
		Secret struct {
			Name    string `json:"Name"`
			Version int    `json:"Version"`
			Value   string `json:"Value"`
		} `json:"Secret"`
	}
	if err := json.Unmarshal(respBody, &apiResp); err != nil {
		return "", fmt.Errorf("シークレットマネージャAPIの応答解析に失敗しました：%w", err)
	}

	password := strings.TrimSpace(apiResp.Secret.Value)
	if password == "" {
		return "", fmt.Errorf("シークレットの値が空です。")
	}

	return password, nil
}

func (sc *SecretClient) fetchDatabasePasswordWithToken(ctx context.Context, client *http.Client, apiURL string, bodyBytes []byte) (int, []byte, error) {
	req, err := http.NewRequestWithContext(ctx, "POST", apiURL, bytes.NewReader(bodyBytes))
	if err != nil {
		return 0, nil, fmt.Errorf("シークレット取得要求HTTPリクエスト作成に失敗しました：%w", err)
	}

	// ヘッダー設定
	req.Header.Set("Authorization", sc.token)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("X-Requested-With", "XMLHttpRequest")

	resp, err := client.Do(req)
	if err != nil {
		return 0, nil, fmt.Errorf("シークレットマネージャAPIへの取得要求送信に失敗しました：%w", err)
	}
	defer resp.Body.Close()

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return 0, nil, fmt.Errorf("応答の読み取りに失敗しました：%w", err)
	}

	return resp.StatusCode, respBody, nil
}
