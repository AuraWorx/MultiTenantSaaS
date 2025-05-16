#!/bin/bash

echo "=== Setting up local database ==="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "DATABASE_URL is not set, using default local PostgreSQL connection"
    export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/auraai"
    echo "Using DATABASE_URL: $DATABASE_URL"
fi

# Create the database schema
echo -e "\n=== Creating database schema... ==="
npx drizzle-kit push

# Seed the database
echo -e "\n=== Seeding database with sample data... ==="
npx tsx scripts/seed.ts

echo -e "\n=== Database setup completed ==="
echo "You can now start the application with: npm run dev"