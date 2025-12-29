#!/bin/bash
# ============================================
# Auto Ban Sync Script for shadowzm
# Watches AMX Mod X logs and sends bans to website
# ============================================

# Configuration
WEBSITE_URL="http://82.22.174.126:8085"
SECRET="shadowzm-ban-secret-2024"
LOG_DIR="/var/lib/pterodactyl/volumes/d968fb39-3234-47f5-9341-d3149d0c8739/cstrike/addons/amxmodx/logs"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=== shadowzm Auto Ban Sync ===${NC}"
echo "Website: $WEBSITE_URL"
echo "Log dir: $LOG_DIR"
echo ""

# Function to send ban to website
send_ban() {
    local player="$1"
    local steamid="$2"
    local reason="$3"
    local admin="$4"
    local duration="$5"
    
    echo -e "${YELLOW}[BAN DETECTED]${NC}"
    echo "  Player: $player"
    echo "  SteamID: $steamid"
    echo "  Reason: $reason"
    echo "  Admin: $admin"
    echo "  Duration: $duration"
    
    response=$(curl -s -X POST "$WEBSITE_URL/api/bans/webhook" \
        -H "Content-Type: application/json" \
        -d "{
            \"secret\": \"$SECRET\",
            \"player_nickname\": \"$player\",
            \"steamid\": \"$steamid\",
            \"reason\": \"$reason\",
            \"admin_name\": \"$admin\",
            \"duration\": \"$duration\"
        }")
    
    if echo "$response" | grep -q "message"; then
        echo -e "${GREEN}  ✓ Synced to website${NC}"
    else
        echo -e "${RED}  ✗ Failed to sync: $response${NC}"
    fi
    echo ""
}

# Check if inotifywait is available
if ! command -v inotifywait &> /dev/null; then
    echo -e "${RED}Error: inotifywait not found. Install with: apt install inotify-tools${NC}"
    exit 1
fi

# Check if log directory exists
if [ ! -d "$LOG_DIR" ]; then
    echo -e "${RED}Error: Log directory not found: $LOG_DIR${NC}"
    exit 1
fi

echo -e "${GREEN}Watching for ban events...${NC}"
echo "(Press Ctrl+C to stop)"
echo ""

# Watch log files for ban patterns
# AMX Mod X typically logs bans like: 
# [ADMIN] "AdminName" banned "PlayerName" (STEAM_0:1:12345) reason: "Cheating" duration: "Permanent"

tail -F "$LOG_DIR"/*.log 2>/dev/null | while read line; do
    # Pattern 1: AMX Ban style
    if echo "$line" | grep -qi "banned"; then
        # Try to extract info from common ban patterns
        
        # Pattern: Ban: "Player" (STEAM_X:X:X) by "Admin" - Reason - Duration
        if [[ "$line" =~ [Bb]an.*\"([^\"]+)\".*\(([^)]+)\).*by.*\"([^\"]+)\".*-[[:space:]]*(.+)[[:space:]]*-[[:space:]]*(.+) ]]; then
            send_ban "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}" "${BASH_REMATCH[4]}" "${BASH_REMATCH[3]}" "${BASH_REMATCH[5]}"
        
        # Pattern: "Admin" banned "Player" (STEAM_X:X:X) reason: "X" duration: "X"
        elif [[ "$line" =~ \"([^\"]+)\"[[:space:]]*banned[[:space:]]*\"([^\"]+)\"[[:space:]]*\(([^)]+)\).*reason:[[:space:]]*\"([^\"]+)\".*duration:[[:space:]]*\"([^\"]+)\" ]]; then
            send_ban "${BASH_REMATCH[2]}" "${BASH_REMATCH[3]}" "${BASH_REMATCH[4]}" "${BASH_REMATCH[1]}" "${BASH_REMATCH[5]}"
        
        # Pattern: Simple - Player STEAM_X:X:X banned
        elif [[ "$line" =~ ([^[:space:]]+)[[:space:]]*(STEAM_[0-9]:[0-9]:[0-9]+)[[:space:]]*banned ]]; then
            send_ban "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}" "Banned from server" "Server" "Permanent"
        fi
    fi
done
