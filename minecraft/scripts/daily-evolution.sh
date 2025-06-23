#!/bin/bash

# Daily Evolution Cycle + Server Restart
# Simple script for daily evolution and server restart

# Get script directory and change to it
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Run evolution cycle
echo "$(date): Starting evolution cycle..."
NODE_ENV=production node auto-minecraft-evolution.js --once

if [ $? -eq 0 ]; then
    echo "$(date): Evolution cycle completed successfully"
    
    # Restart server for new entity spawning
    echo "$(date): Restarting server..."
    
    # Stop server
    screen -S minecraft -p 0 -X stuff "stop$(printf \\r)"
    sleep 15
    
    # Start server
    cd /opt/minecraft_forge_server
    screen -dmS minecraft java -Xmx4G -Xms2G -jar forge-1.20.1-*.jar nogui
    
    echo "$(date): Server restarted"
else
    echo "$(date): Evolution cycle failed"
    exit 1
fi 