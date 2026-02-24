package secretmanager

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"

	sm "github.com/sacloud/secretmanager-api-go"
	v1 "github.com/sacloud/secretmanager-api-go/apis/v1"
	"github.com/sacloud/saclient-go"
)

// DatabaseSecret represents the database secret stored in Secret Manager
type DatabaseSecret struct {
	DatabaseName string `json:"database_name"`
	Host         string `json:"host"`
	Port         int    `json:"port"`
	Username     string `json:"username"`
	Password     string `json:"password"`
}

// SecretClient is a client for Sakura Cloud Secret Manager
type SecretClient struct {
	vaultID    string
	secretName string
	client     *v1.Client
}

// NewSecretClient creates a new Secret Manager client
func NewSecretClient(vaultID, secretName string) (*SecretClient, error) {
	if vaultID == "" {
		return nil, fmt.Errorf("vault ID is required")
	}

	if secretName == "" {
		secretName = "database_secret_value"
	}

	// Initialize saclient for authentication
	var saClient saclient.Client
	fs := saClient.FlagSet(flag.ContinueOnError)
	// Ignore flag parse errors if command line arguments are not provided
	_ = fs.Parse(os.Args[1:])
	saClient.SetEnviron(os.Environ())
	saClient.SetWith(saclient.WithFavouringBearerAuthentication())

	// Create Secret Manager API client
	client, err := sm.NewClient(&saClient)
	if err != nil {
		return nil, fmt.Errorf("failed to create Secret Manager client: %w", err)
	}

	return &SecretClient{
		vaultID:    vaultID,
		secretName: secretName,
		client:     client,
	}, nil
}

// FetchDatabaseSecret fetches the database secret from Secret Manager
func (sc *SecretClient) FetchDatabaseSecret() (*DatabaseSecret, error) {
	ctx := context.Background()

	// Create secret operator for the vault
	secretOp := sm.NewSecretOp(sc.client, sc.vaultID)

	// Unveil (fetch and decrypt) the secret
	unveilRes, err := secretOp.Unveil(ctx, v1.Unveil{
		Name: sc.secretName,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to fetch secret: %w", err)
	}

	// Parse the secret value as JSON
	var dbSecret DatabaseSecret
	if err := json.Unmarshal([]byte(unveilRes.Value), &dbSecret); err != nil {
		return nil, fmt.Errorf("failed to parse secret value: invalid format")
	}

	return &dbSecret, nil
}

