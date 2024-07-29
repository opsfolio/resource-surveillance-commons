#!/bin/bash

# strict bash
set -euo pipefail

# Color definitions using tput
BRIGHT_YELLOW=$(tput setaf 3; tput bold)
BRIGHT_WHITE=$(tput setaf 7; tput bold)
CYAN=$(tput setaf 6)
DIM=$(tput dim)
RESET=$(tput sgr0)

# Default values
port=9000
command="surveilr"

# Parse command-line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --port)
            port="$2"
            shift
            shift
            ;;
        --standalone)
            command="sqlpage"
            shift
            ;;
        *)
            echo -e "${BRIGHT_WHITE}Unknown option: $1${RESET}"
            exit 1
            ;;
    esac
done

# Set default database path if not provided
DB=${SURVEILR_STATEDB_FS_PATH:-resource-surveillance.sqlite.db}

# Function to handle cleanup on exit
cleanup() {
    echo -e "\nStopping processes..."
    if [[ -n "${WATCH_PID:-}" ]]; then
        echo "Stopping background watch (PID $WATCH_PID)..."
        kill "$WATCH_PID"
    fi
    if [[ -n "${SQLPAGE_PID:-}" ]]; then
        echo "Stopping SQL page server (PID $SQLPAGE_PID)..."
        kill "$SQLPAGE_PID"
    fi
    echo "All processes stopped."
}

# Trap SIGINT (Ctrl+C) and call cleanup
trap cleanup SIGINT

# Get the directory of the current script
SCRIPT_DIR="$(dirname "$(realpath "${BASH_SOURCE[0]}")")"

# Start the background watch process
"$SCRIPT_DIR/watch-and-reload-sql-into-rssd.sh" &
WATCH_PID=$!
echo -e "${DIM}Background watch started with PID $WATCH_PID.${RESET}"

# Start the server in the foreground
if [ "$command" == "surveilr" ]; then
    echo -e "${CYAN}Starting surveilr built-in SQLPage server on port $port...${RESET}"
    ./surveilr sqlpage --port "$port" &
    echo -e "${BRIGHT_YELLOW}http://localhost:$port/fhir/index.sql${RESET}"
elif [ "$command" == "sqlpage" ]; then
    echo -e "${CYAN}Starting standalone SQLPage server on port $port...${RESET}"
    SQLPAGE_PORT="$port" SQLPAGE_DATABASE_URL="sqlite://${DB}?mode=rwc" sqlpage &
    echo -e "${BRIGHT_YELLOW}SQLPage server running with database: $DB${RESET}"
else
    echo -e "${BRIGHT_WHITE}Unknown command: $command${RESET}"
    cleanup
    exit 1
fi

SQLPAGE_PID=$!
wait $SQLPAGE_PID

# Cleanup when the server exits
cleanup
