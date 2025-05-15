# AuraAI Deployment Guide for Ubuntu 24

This guide explains how to deploy the AuraAI application as a background service on Ubuntu 24.

## Prerequisites

1. Ubuntu 24 or compatible Linux distribution
2. PostgreSQL database
3. Node.js and npm (v18 or higher)
4. Git to clone the repository

## Deployment Scripts

The repository contains two scripts for managing the AuraAI application:

1. `start-auraai.sh` - Starts the application as a background service
2. `stop-auraai.sh` - Stops the running application

### Setting Up the Environment

Before running the application, ensure PostgreSQL is installed and running:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

Create a database for the application:

```bash
sudo -u postgres psql -c "CREATE DATABASE ai_governance;"
sudo -u postgres psql -c "CREATE USER auraaiuser WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ai_governance TO auraaiuser;"
```

### Starting the Application

The start script handles:
- PostgreSQL service verification
- Database connection setup
- Database schema migration with Drizzle
- Complete data seeding with sample organizations, users, and AI systems
- Running the application in the background
- Logging all output to a file

To start the application:

```bash
# Option 1: Use default database connection
./start-auraai.sh

# Option 2: Specify a custom database URL
DATABASE_URL="postgresql://auraaiuser:your_password@localhost:5432/ai_governance" ./start-auraai.sh

# Option 3: Include GitHub API key for repository scanning features
GITHUB_API_KEY="your_github_api_key" ./start-auraai.sh

# Option 4: Combine both custom database and GitHub API key
DATABASE_URL="postgresql://auraaiuser:your_password@localhost:5432/ai_governance" GITHUB_API_KEY="your_github_api_key" ./start-auraai.sh
```

The script will:
1. Create or clear a log file at `./auraai-app.log`
2. Verify PostgreSQL is running and start it if necessary
3. Set environment variables (DATABASE_URL, NODE_ENV, and GITHUB_API_KEY if provided)
4. Run database schema migration with `npm run db:push`
5. Run complete data seeding with `local-seed.js` (or fallback to `scripts/fallback-seed.js` if needed)
6. Start the application with `npm run start` in background mode
7. Save the process ID to `./auraai-app.pid`
8. Display sample login credentials for the application

Once started, the application will continue running even if you close your terminal session.

### Monitoring the Application

To check if the application is running:

```bash
ps -p $(cat ./auraai-app.pid)
```

To view the logs in real-time:

```bash
tail -f ./auraai-app.log
```

### Stopping the Application

To stop the application, use the provided stop script:

```bash
./stop-auraai.sh
```

This script will:
1. Check if the application is running using the saved PID
2. Send a graceful shutdown signal (SIGTERM)
3. Force shutdown if necessary after a timeout
4. Remove the PID file

## Troubleshooting

### Database Connection Issues

If you encounter database connection problems:

1. Verify PostgreSQL is running: `systemctl status postgresql`
2. Check your database credentials
3. Make sure the database exists: `sudo -u postgres psql -c "\l"`
4. Try connecting manually: `psql -U auraaiuser -d auraai`

### Application Won't Start

If the application fails to start:

1. Check the logs: `cat ./auraai-app.log`
2. Verify Node.js is installed correctly: `node --version`
3. Make sure npm dependencies are installed: `npm install`
4. Check for port conflicts: `netstat -tuln | grep 3000`

### Application Crashed

If the application crashes:

1. Check the logs: `cat ./auraai-app.log`
2. Try starting in foreground mode for debugging: `npm run start`
3. Verify all environment variables are set correctly
4. Make sure the database is properly seeded