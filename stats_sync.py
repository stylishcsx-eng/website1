#!/usr/bin/env python3
"""
CSStats Parser & Sync for shadowzm
Reads csstats.dat and syncs player stats to website

Usage: python3 /home/stats_sync.py
"""

import struct
import requests
import os

# ============ CONFIGURATION ============
WEBSITE_URL = "http://82.22.174.126:8085"
SECRET = "shadowzm-ban-secret-2024"
CSSTATS_FILE = "/var/lib/pterodactyl/volumes/d968fb39-3234-47f5-9341-d3149d0c8739/cstrike/addons/amxmodx/data/csstats.dat"
# =======================================

def read_string(data, offset):
    """Read null-terminated string from binary data"""
    end = data.find(b'\x00', offset)
    if end == -1:
        return "", offset
    string = data[offset:end].decode('utf-8', errors='ignore')
    return string, end + 1

def parse_csstats(filepath):
    """Parse csstats.dat binary file"""
    players = []
    
    try:
        with open(filepath, 'rb') as f:
            data = f.read()
    except FileNotFoundError:
        print(f"Error: File not found: {filepath}")
        return []
    
    if len(data) < 4:
        print("Error: File too small")
        return []
    
    offset = 0
    
    # Try to parse the file
    # CSStats format varies by version, trying common format
    while offset < len(data) - 50:
        try:
            # Read player name
            name, offset = read_string(data, offset)
            if not name or len(name) < 1:
                offset += 1
                continue
            
            # Read steamid/uniqueid
            steamid, offset = read_string(data, offset)
            if not steamid:
                continue
            
            # Skip if not a valid steamid format
            if not steamid.startswith("STEAM_") and not steamid.startswith("VALVE_"):
                # Might be IP-based, try to continue
                if "." not in steamid and len(steamid) < 5:
                    continue
            
            # Read stats (typically 7 integers: tks, damage, deaths, kills, shots, hits, hs)
            if offset + 28 > len(data):
                break
                
            stats = struct.unpack('<7i', data[offset:offset+28])
            offset += 28
            
            tks, damage, deaths, kills, shots, hits, headshots = stats
            
            # Skip invalid entries
            if kills < 0 or deaths < 0 or kills > 1000000:
                continue
            
            # Skip players with no activity
            if kills == 0 and deaths == 0:
                continue
            
            players.append({
                'nickname': name,
                'steamid': steamid,
                'kills': kills,
                'deaths': deaths,
                'headshots': headshots
            })
            
        except Exception as e:
            offset += 1
            continue
    
    # Sort by kills
    players.sort(key=lambda x: x['kills'], reverse=True)
    return players[:100]  # Top 100

def sync_to_website(players):
    """Sync players to website API"""
    synced = 0
    failed = 0
    
    for player in players:
        try:
            response = requests.post(
                f"{WEBSITE_URL}/api/players/webhook",
                json={
                    "secret": SECRET,
                    "nickname": player['nickname'],
                    "steamid": player['steamid'],
                    "kills": player['kills'],
                    "deaths": player['deaths'],
                    "headshots": player['headshots']
                },
                timeout=10
            )
            if response.status_code == 200:
                print(f"✓ {player['nickname']}: {player['kills']} kills")
                synced += 1
            else:
                print(f"✗ {player['nickname']}: HTTP {response.status_code}")
                failed += 1
        except Exception as e:
            print(f"✗ {player['nickname']}: {e}")
            failed += 1
    
    return synced, failed

def main():
    print("=== CSStats Sync ===")
    print(f"Reading: {CSSTATS_FILE}")
    
    players = parse_csstats(CSSTATS_FILE)
    
    if not players:
        print("No players found in stats file.")
        print("\nAlternative: Add players manually with:")
        print(f'curl -X POST "{WEBSITE_URL}/api/players/webhook" -H "Content-Type: application/json" -d \'{{"secret":"{SECRET}","nickname":"PlayerName","steamid":"STEAM_0:1:123","kills":100,"deaths":50,"headshots":30}}\'')
        return
    
    print(f"Found {len(players)} players")
    print("\nSyncing to website...")
    
    synced, failed = sync_to_website(players)
    
    print(f"\n=== Complete ===")
    print(f"Synced: {synced}")
    print(f"Failed: {failed}")

if __name__ == "__main__":
    main()
