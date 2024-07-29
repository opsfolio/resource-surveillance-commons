#!/bin/bash

# strict bash
set -euo pipefail

# Color definitions using tput
BRIGHT_YELLOW=$(tput setaf 3; tput bold)
BRIGHT_WHITE=$(tput setaf 7; tput bold)
CYAN=$(tput setaf 6)
DIM=$(tput dim)
RESET=$(tput sgr0)

# Function to handle cleanup on exit
cleanup() {
    echo -e "\nStopping processes..."
    if [[ -n "$WATCH_PID" ]]; then
        echo "Stopping background watch (PID $WATCH_PID)..."
        kill "$WATCH_PID"
    fi
    if [[ -n "$SQLPAGE_PID" ]]; then
        echo "Stopping SQL page server (PID $SQLPAGE_PID)..."
        kill "$SQLPAGE_PID"
    fi
    echo "All processes stopped."
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

# Start the background watch process
../../support/bin/watch-and-reload-sql-into-rssd.sh &
WATCH_PID=$!
echo "${DIM}Background watch started with PID $WATCH_PID.${RESET}"

# Start the SQL page server in the foreground
echo "${CYAN}Starting SQL page server on port 9000...${RESET}"
./surveilr sqlpage --port 9000 &
echo "${BRIGHT_YELLOW}http://localhost:9000/fhir/index.sql${RESET}"
SQLPAGE_PID=$!
wait $SQLPAGE_PID

# Cleanup when SQL page server exits
cleanup
