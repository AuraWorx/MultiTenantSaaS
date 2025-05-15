#!/bin/bash

# Ensure the script stops on first error
set -e

# Define variables
APP_NAME="auraai"
APP_DIR="$(pwd)"
LOG_FILE="$APP_DIR/auraai-app.log"
PID_FILE="$APP_DIR/auraai-app.pid"
SERVICE_FILE="/etc/systemd/system/auraai.service"
RUN_MODE="background" # Options: background, systemd

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --systemd)
      RUN_MODE="systemd"
      shift
      ;;
    --background)
      RUN_MODE="background"
      shift
      ;;
    --help)
      echo "Usage: ./start-auraai.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --background    Run app in background with nohup (default)"
      echo "  --systemd       Set up and start as a systemd service"
      echo "  --help          Show this help message"
      exit 0
      ;;
    *)
      shift
      ;;
  esac
done

# Use DATABASE_URL from environment if set, otherwise use default
if [ -z "$DATABASE_URL" ]; then
  # Default database URL for AuraAI
  export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_governance"
  echo "DATABASE_URL not set. Using default database URL: $DATABASE_URL"
else
  echo "Using DATABASE_URL from environment: $DATABASE_URL"
fi

# Create log file or clear it if it exists
touch $LOG_FILE
echo "Starting AuraAI application - $(date)" > $LOG_FILE
echo "----------------------------------------" >> $LOG_FILE

# Check if PostgreSQL is running
if systemctl is-active --quiet postgresql; then
  echo "PostgreSQL is running." | tee -a $LOG_FILE
else
  echo "PostgreSQL is not running. Starting PostgreSQL..." | tee -a $LOG_FILE
  sudo systemctl start postgresql >> $LOG_FILE 2>&1
  
  if [ $? -ne 0 ]; then
    echo "Failed to start PostgreSQL. Make sure it's installed." | tee -a $LOG_FILE
    exit 1
  fi
  
  echo "PostgreSQL started successfully." | tee -a $LOG_FILE
fi

# Set environment variables
export NODE_ENV=development
echo "Setting NODE_ENV=development" >> $LOG_FILE
echo "Using DATABASE_URL=$DATABASE_URL" >> $LOG_FILE

# Set GitHub API key if available
if [ ! -z "$GITHUB_API_KEY" ]; then
  echo "Using provided GITHUB_API_KEY" >> $LOG_FILE
else
  echo "Warning: GITHUB_API_KEY not set. GitHub scanning features may be limited." | tee -a $LOG_FILE
fi

echo "⏳ Database setup and seeding starting..." | tee -a $LOG_FILE

# First, run the schema migration with Drizzle
echo "Running database schema migration..." | tee -a $LOG_FILE
npm run db:push >> $LOG_FILE 2>&1

if [ $? -ne 0 ]; then
  echo "❌ Database schema migration failed. Check the logs for details." | tee -a $LOG_FILE
  exit 1
else
  echo "✅ Database schema migration completed successfully." | tee -a $LOG_FILE
fi

# Now run the seeder script to populate the database
echo "Running database seeding script..." | tee -a $LOG_FILE

# Detect if running locally (we are)
echo "Running in local environment, using node with pg client..." >> $LOG_FILE

# Check if pg module is installed
if ! npm list pg >/dev/null 2>&1; then
  echo "Installing pg module temporarily..." >> $LOG_FILE
  npm install --no-save pg >> $LOG_FILE 2>&1
fi

# Try standard seeder first, if it fails, try fallback seeder
if node local-seed.js >> $LOG_FILE 2>&1; then
  echo "✅ Standard seeder ran successfully." | tee -a $LOG_FILE
else
  echo "⚠️ Standard seeder failed, trying fallback seeder..." | tee -a $LOG_FILE
  if node --experimental-modules scripts/fallback-seed.js >> $LOG_FILE 2>&1; then
    echo "✅ Fallback seeder ran successfully." | tee -a $LOG_FILE
  else
    echo "❌ All seeding attempts failed. Check the logs for details." | tee -a $LOG_FILE
    exit 1
  fi
fi

echo "✅ Database setup complete!" | tee -a $LOG_FILE

# Function to create a systemd service file
create_systemd_service() {
  echo "Creating systemd service file..." | tee -a $LOG_FILE
  
  # Create service file with proper environment variables
  cat > /tmp/auraai.service << EOF
[Unit]
Description=AuraAI Governance Platform
After=network.target postgresql.service

[Service]
Type=simple
User=$(whoami)
WorkingDirectory=$APP_DIR
Environment="NODE_ENV=production"
Environment="DATABASE_URL=$DATABASE_URL"
Environment="GITHUB_API_KEY=$GITHUB_API_KEY"
Environment="OPENAI_API_KEY=$OPENAI_API_KEY"
ExecStart=$(which npm) run dev
Restart=on-failure
RestartSec=10
StandardOutput=append:$LOG_FILE
StandardError=append:$LOG_FILE

[Install]
WantedBy=multi-user.target
EOF

  # Move service file to systemd directory (requires sudo)
  sudo mv /tmp/auraai.service $SERVICE_FILE
  
  # Reload systemd to recognize the new service
  sudo systemctl daemon-reload
  echo "✅ Systemd service created" | tee -a $LOG_FILE
}

# Function to start service as systemd
start_systemd() {
  echo "Starting AuraAI application as a systemd service..." | tee -a $LOG_FILE
  create_systemd_service
  sudo systemctl enable auraai.service
  sudo systemctl start auraai.service
  
  # Check if service started successfully
  if sudo systemctl is-active --quiet auraai.service; then
    echo "✅ AuraAI service started successfully" | tee -a $LOG_FILE
  else
    echo "❌ Failed to start AuraAI service" | tee -a $LOG_FILE
    echo "Check logs with: sudo journalctl -u auraai.service" | tee -a $LOG_FILE
    exit 1
  fi
}

# Function to start service in background
start_background() {
  echo "Starting AuraAI application in background mode..." | tee -a $LOG_FILE
  nohup npm run dev >> $LOG_FILE 2>&1 &
  
  # Save the process ID so we can stop it later if needed
  echo $! > $PID_FILE
  echo "✅ Application started with PID $(cat $PID_FILE)" | tee -a $LOG_FILE
  echo "✅ Application logs are being written to $LOG_FILE" | tee -a $LOG_FILE
}

# Start the application based on selected mode
if [ "$RUN_MODE" = "systemd" ]; then
  start_systemd
elif [ "$RUN_MODE" = "background" ]; then
  start_background
fi

# Print login credentials for reference
echo -e "\nSample Login Credentials:" | tee -a $LOG_FILE
echo "----------------------------------" | tee -a $LOG_FILE
echo "Admin User:" | tee -a $LOG_FILE
echo "  Username: admin" | tee -a $LOG_FILE
echo "  Password: adminpassword" | tee -a $LOG_FILE
echo "" | tee -a $LOG_FILE
echo "Demo User:" | tee -a $LOG_FILE
echo "  Username: demo_user" | tee -a $LOG_FILE
echo "  Password: demopassword" | tee -a $LOG_FILE
echo "----------------------------------" | tee -a $LOG_FILE

# Output summary to terminal
echo -e "\n✨ AuraAI application is now running."
if [ "$RUN_MODE" = "systemd" ]; then
  echo "🔄 Service: auraai.service"
  echo "📝 View service status: sudo systemctl status auraai.service"
  echo "📝 View logs: sudo journalctl -u auraai.service"
  echo "🛑 To stop the service: sudo systemctl stop auraai.service"
else
  echo "🔄 PID: $(cat $PID_FILE)"
  echo "📝 Logs: $LOG_FILE"
  echo "👀 To monitor logs in real-time, run: tail -f $LOG_FILE"
  echo "🛑 To stop the application, run: ./stop-auraai.sh"
fi