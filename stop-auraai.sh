#!/bin/bash

# Define log file
LOG_FILE="./auraai-app.log"
PID_FILE="./auraai-app.pid"

# Check if PID file exists
if [ ! -f "$PID_FILE" ]; then
  echo "PID file not found. Application may not be running."
  exit 1
fi

# Get the PID
PID=$(cat $PID_FILE)

# Check if process is still running
if ps -p $PID > /dev/null; then
  echo "Stopping AuraAI application (PID: $PID)..."
  echo "Stopping AuraAI application (PID: $PID) - $(date)" >> $LOG_FILE
  
  # Send SIGTERM to gracefully shut down
  kill $PID
  
  # Wait for process to terminate
  sleep 2
  
  # Check if it's still running
  if ps -p $PID > /dev/null; then
    echo "Application still running. Forcing shutdown..."
    echo "Forcing shutdown - $(date)" >> $LOG_FILE
    kill -9 $PID
  fi
  
  echo "Application stopped successfully."
  echo "Application stopped - $(date)" >> $LOG_FILE
else
  echo "Process with PID $PID not found. Application may have already stopped."
  echo "Process with PID $PID not found - $(date)" >> $LOG_FILE
fi

# Remove PID file
rm -f $PID_FILE