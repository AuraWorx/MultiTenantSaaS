#!/bin/bash

# Define variables
APP_NAME="auraai"
APP_DIR="$(pwd)"
LOG_FILE="$APP_DIR/auraai-app.log"
PID_FILE="$APP_DIR/auraai-app.pid"
SERVICE_FILE="/etc/systemd/system/auraai.service"

# Default to background mode but allow override
MODE="background"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --systemd)
      MODE="systemd"
      shift
      ;;
    --background)
      MODE="background"
      shift
      ;;
    --help)
      echo "Usage: ./stop-auraai.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --background    Stop app running in background (default)"
      echo "  --systemd       Stop systemd service"
      echo "  --help          Show this help message"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

echo -e "🛑 AuraAI Shutdown Process"
echo -e "----------------------------------------"

# Function to stop background process
stop_background() {
  # Check if PID file exists
  if [ ! -f "$PID_FILE" ]; then
    echo -e "❓ PID file not found. Application may not be running."
    return 1
  fi

  # Get the PID
  PID=$(cat $PID_FILE)

  # Check if process is still running
  if ps -p $PID > /dev/null; then
    echo -e "⏳ Stopping AuraAI application (PID: $PID)..."
    echo "Stopping AuraAI application (PID: $PID) - $(date)" >> $LOG_FILE
    
    # Send SIGTERM for graceful shutdown
    kill $PID
    
    # Wait for process to terminate with a progress indicator
    echo -ne "⏳ Waiting for graceful shutdown"
    for i in {1..5}; do
      echo -n "."
      sleep 1
      # Check if it's still running
      if ! ps -p $PID > /dev/null; then
        echo -e "\n✅ Application stopped gracefully!"
        break
      fi
    done
    
    # Force kill if still running
    if ps -p $PID > /dev/null; then
      echo -e "\n⚠️ Application still running. Forcing shutdown..."
      echo "Forcing shutdown - $(date)" >> $LOG_FILE
      kill -9 $PID
      sleep 1
      
      if ! ps -p $PID > /dev/null; then
        echo -e "✅ Application stopped forcefully."
      else
        echo -e "❌ Failed to stop the application. You may need to manually kill the process."
        return 1
      fi
    fi
    
    echo "Application stopped - $(date)" >> $LOG_FILE
  else
    echo -e "ℹ️ Process with PID $PID not found. Application may have already stopped."
    echo "Process with PID $PID not found - $(date)" >> $LOG_FILE
  fi

  # Remove PID file
  rm -f $PID_FILE
  return 0
}

# Function to stop systemd service
stop_systemd() {
  echo -e "⏳ Stopping AuraAI systemd service..."
  
  # Check if service exists
  if ! sudo systemctl list-unit-files | grep -q "auraai.service"; then
    echo "❌ AuraAI systemd service not found."
    return 1
  fi
  
  # Check if service is running
  if ! sudo systemctl is-active --quiet auraai.service; then
    echo "ℹ️ AuraAI service is not running."
    return 0
  fi
  
  # Stop the service
  sudo systemctl stop auraai.service
  
  # Check if it stopped
  if sudo systemctl is-active --quiet auraai.service; then
    echo "❌ Failed to stop AuraAI service."
    return 1
  else
    echo "✅ AuraAI service stopped successfully."
    return 0
  fi
}

# Stop based on mode
if [ "$MODE" = "systemd" ]; then
  stop_systemd
elif [ "$MODE" = "background" ]; then
  stop_background
fi

echo -e "✅ Shutdown process complete."