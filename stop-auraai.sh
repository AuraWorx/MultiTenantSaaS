#!/bin/bash

# Define log file
LOG_FILE="./auraai-app.log"
PID_FILE="./auraai-app.pid"

echo -e "🛑 AuraAI Shutdown Process"
echo -e "----------------------------------------"

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
  echo -e "❓ PID file not found. Application may not be running."
  exit 1
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
    fi
  fi
  
  echo "Application stopped - $(date)" >> $LOG_FILE
else
  echo -e "ℹ️ Process with PID $PID not found. Application may have already stopped."
  echo "Process with PID $PID not found - $(date)" >> $LOG_FILE
fi

# Remove PID file
rm -f $PID_FILE
echo -e "✅ Shutdown process complete."