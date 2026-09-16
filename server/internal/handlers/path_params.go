package handlers

import (
	"fmt"
	"strconv"
)

func parsePathID(value string) (int, error) {
	id, err := strconv.Atoi(value)
	if err != nil || id <= 0 {
		return 0, fmt.Errorf("invalid numeric path ID")
	}
	return id, nil
}
