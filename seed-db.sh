#!/bin/bash

# Ensure the script stops on first error
set -e

echo "⏳ Running database seed script..."
npx tsx scripts/seed.ts

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