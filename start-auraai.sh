#!/bin/bash

# Define log file and database connection
LOG_FILE="./auraai-app.log"

# Use DATABASE_URL from environment if set, otherwise use default
if [ -z "$DATABASE_URL" ]; then
  DB_URL="postgresql://postgres:postgres@localhost:5432/auraai"
  echo "DATABASE_URL not set. Using default database URL: $DB_URL"
else
  DB_URL="$DATABASE_URL"
  echo "Using DATABASE_URL from environment: $DB_URL"
fi

# Create log file or clear it if it exists
touch $LOG_FILE
echo "Starting AuraAI application - $(date)" > $LOG_FILE
echo "----------------------------------------" >> $LOG_FILE

# Check if PostgreSQL is running
if systemctl is-active --quiet postgresql; then
  echo "PostgreSQL is running." >> $LOG_FILE
else
  echo "PostgreSQL is not running. Starting PostgreSQL..." >> $LOG_FILE
  sudo systemctl start postgresql >> $LOG_FILE 2>&1
  
  if [ $? -ne 0 ]; then
    echo "Failed to start PostgreSQL. Make sure it's installed." >> $LOG_FILE
    exit 1
  fi
  
  echo "PostgreSQL started successfully." >> $LOG_FILE
fi

# Export environment variables
export DATABASE_URL=$DB_URL
export NODE_ENV=production

echo "Setting DATABASE_URL=$DB_URL" >> $LOG_FILE
echo "Setting NODE_ENV=production" >> $LOG_FILE

# Navigate to the application directory (change this path to where your app is located)
# APP_DIR="/path/to/your/auraai-app"
# cd $APP_DIR

# Database migration and seeding
echo "Running database seeding script..." >> $LOG_FILE
npm run db:push >> $LOG_FILE 2>&1

# Check if seeding was successful
if [ $? -ne 0 ]; then
  echo "Database seeding failed. See log for details." >> $LOG_FILE
  # Attempt fallback seed script
  echo "Attempting fallback seed..." >> $LOG_FILE
  ./seed-db.sh >> $LOG_FILE 2>&1
else
  echo "Database seeding completed successfully." >> $LOG_FILE
fi

# Start the application with nohup to keep it running after terminal closes
echo "Starting AuraAI application..." >> $LOG_FILE
nohup npm run start >> $LOG_FILE 2>&1 &

# Save the process ID so we can stop it later if needed
echo $! > ./auraai-app.pid
echo "Application started with PID $(cat ./auraai-app.pid)" >> $LOG_FILE
echo "Application logs are being written to $LOG_FILE" >> $LOG_FILE
echo "To stop the application, run: kill $(cat ./auraai-app.pid)" >> $LOG_FILE

# Output summary to terminal
echo "AuraAI application started in background mode."
echo "PID: $(cat ./auraai-app.pid)"
echo "Logs: $LOG_FILE"
echo "To monitor logs in real-time, run: tail -f $LOG_FILE"