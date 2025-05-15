#!/bin/bash

# Ensure the script stops on first error
set -e

# Define log file and database connection
LOG_FILE="./auraai-app.log"

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
export NODE_ENV=production
echo "Setting NODE_ENV=production" >> $LOG_FILE
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

# Start the application with nohup to keep it running after terminal closes
echo "Starting AuraAI application..." | tee -a $LOG_FILE
nohup npm run start >> $LOG_FILE 2>&1 &

# Save the process ID so we can stop it later if needed
echo $! > ./auraai-app.pid
echo "✅ Application started with PID $(cat ./auraai-app.pid)" | tee -a $LOG_FILE
echo "✅ Application logs are being written to $LOG_FILE" | tee -a $LOG_FILE

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
echo -e "\n✨ AuraAI application is now running in background mode."
echo "🔄 PID: $(cat ./auraai-app.pid)"
echo "📝 Logs: $LOG_FILE"
echo "👀 To monitor logs in real-time, run: tail -f $LOG_FILE"
echo "🛑 To stop the application, run: ./stop-auraai.sh"