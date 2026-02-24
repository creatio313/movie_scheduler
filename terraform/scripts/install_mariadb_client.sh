#!/bin/bash
#
# @sacloud-once
# @sacloud-name "Maria DB client for Ubuntu"
# @sacloud-desc Maria DB client の最新安定版をインストールします。
#
# @sacloud-require-archive distro-ubuntu

_motd() {
LOG=$(ls /root/.sacloud-api/notes/*log)
case $1 in
  start)
  echo -e "\n#-- Startup-script is \\033[0;32mrunning\\033[0;39m. --#\n\nPlease check the log file: ${LOG}\n" > /etc/motd
  ;;
  fail)
  echo -e "\n#-- Startup-script \\033[0;31mfailed\\033[0;39m. --#\n\nPlease check the log file: ${LOG}\n" > /etc/motd
  exit 1
  ;;
  end)
  cp -f /dev/null /etc/motd
  ;;
esac
}

_motd start
set -eux
trap '_motd fail' ERR

# Naviage to root directory.
cd /root

# Install Maria DB client.
apt-get update && apt-get upgrade -y
apt-get install -y mariadb-client || apt-get install -y mariadb-client

# Configure DB-side NIC.
DB_IF="eth1"
DB_IP_CIDR="192.168.100.11/24"

ip link show "${DB_IF}" > /dev/null
ip link set "${DB_IF}" up

if ! ip -4 addr show dev "${DB_IF}" | grep -q "${DB_IP_CIDR}"; then
  ip addr add "${DB_IP_CIDR}" dev "${DB_IF}"
fi

cat > /etc/netplan/60-db-nic.yaml <<EOF
network:
  version: 2
  ethernets:
    ${DB_IF}:
      dhcp4: false
      addresses:
        - ${DB_IP_CIDR}
EOF

netplan generate
netplan apply

# Complete!
_motd end