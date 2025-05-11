#!/bin/bash

# Ensure the script stops on first error
set -e

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️ DATABASE_URL not set. Using the default database URL."
  
  # Get database URL from environment or set a default for local development
  export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_governance"
  
  echo "Using DATABASE_URL: $DATABASE_URL"
  echo "If this is incorrect, please set the DATABASE_URL environment variable before running this script."
  echo "For example: DATABASE_URL='postgresql://user:password@localhost:5432/database' ./seed-db.sh"
  
  # Give the user a chance to abort
  echo "Continue with this database URL? (y/n)"
  read -r continue_with_db
  
  if [[ ! "$continue_with_db" =~ ^[Yy]$ ]]; then
    echo "Aborted. Please set the DATABASE_URL environment variable and try again."
    exit 1
  fi
fi

echo "⏳ Running database seed script..."

# Detect if running locally or on Replit
if [ -z "$REPL_ID" ]; then
  echo "Running in local environment, using node with pg client..."
  
  # Check if pg module is installed
  if ! npm list pg >/dev/null 2>&1; then
    echo "Installing pg module temporarily..."
    npm install --no-save pg
  fi
  
  node local-seed.js
else
  echo "Running in Replit environment, using tsx with neon client..."
  npx tsx scripts/seed.ts
fi

echo "✅ Seed script execution completed."

# Optional: run the application after seeding
echo "Would you like to start the application now? (y/n)"
read -r start_app

if [[ "$start_app" =~ ^[Yy]$ ]]; then
  echo "Starting application..."
  npm run dev
else
  echo "You can start the application with 'npm run dev' when ready."
fi