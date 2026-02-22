package response

import (
	"encoding/json"
	"net/http"
)

// RespondJSON は指定されたステータスコードとペイロードでJSON形式でレスポンスを返します
func RespondJSON(w http.ResponseWriter, status int, payload interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if payload != nil {
		json.NewEncoder(w).Encode(payload)
	}
}
