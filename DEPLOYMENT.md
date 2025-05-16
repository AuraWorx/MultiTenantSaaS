# AuraAI Deployment Guide for Ubuntu 24

This guide explains how to deploy the AuraAI application on Ubuntu 24, either as a background process or as a systemd service.

## Prerequisites

1. Ubuntu 24 or compatible Linux distribution
2. PostgreSQL database
3. Node.js and npm (v18 or higher)
4. Git to clone the repository

## Deployment Scripts

The repository contains three scripts for managing the AuraAI application:

1. `start-auraai.sh` - Starts the application (as background process or systemd service)
2. `stop-auraai.sh` - Stops the running application
3. `setup-local-db.sh` - Sets up the local database schema and seeds with sample data

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

### Setting Up the Database

Before running the application, you need to set up the database schema and seed it with sample data. You can use the `setup-local-db.sh` script:

```bash
# Option 1: Use default database connection
./setup-local-db.sh

# Option 2: Specify a custom database URL
DATABASE_URL="postgresql://auraaiuser:your_password@localhost:5432/ai_governance" ./setup-local-db.sh
```

This script will:
1. Check if DATABASE_URL is set and use a default if not
2. Run database schema migration with `npx drizzle-kit push`
3. Seed the database with sample data using `npx tsx scripts/seed.ts`

### Starting the Application

The start script handles:
- PostgreSQL service verification
- Database connection setup
- Running the application (either as a background process or systemd service)
- Logging all output to a file

The script supports two different deployment methods:

#### Method 1: Background Process (Default)

Runs the application in the background using nohup, keeping it running after terminal session ends.

```bash
# Start as a background process (default)
./start-auraai.sh --background

# Specify custom DATABASE_URL
DATABASE_URL="postgresql://auraaiuser:your_password@localhost:5432/ai_governance" ./start-auraai.sh

# Include API keys for additional features 
GITHUB_API_KEY="your_github_api_key" OPENAI_API_KEY="your_openai_api_key" ./start-auraai.sh
```

#### Method 2: Systemd Service (Recommended for Production)

Creates and starts a systemd service for better reliability and automatic startup on server reboot.

```bash
# Start as a systemd service
sudo ./start-auraai.sh --systemd

# With custom database and API keys
sudo DATABASE_URL="postgresql://auraaiuser:your_password@localhost:5432/ai_governance" \
  GITHUB_API_KEY="your_github_api_key" \
  OPENAI_API_KEY="your_openai_api_key" \
  ./start-auraai.sh --systemd
```

When starting the application, the script will:
1. Create or clear a log file at `./auraai-app.log`
2. Verify PostgreSQL is running and start it if necessary
3. Set environment variables (DATABASE_URL, NODE_ENV, and API keys if provided)
4. Start the application with `npm run dev` in the selected mode
5. For background mode, save the process ID to `./auraai-app.pid`
6. For systemd mode, create and enable a systemd service file
7. Display sample login credentials for the application

Once started, the application will continue running even if you close your terminal session and will automatically restart after server reboots when using systemd mode.

### Monitoring the Application

#### For Background Process Mode

To check if the application is running:

```bash
ps -p $(cat ./auraai-app.pid)
```

To view the logs in real-time:

```bash
tail -f ./auraai-app.log
```

#### For Systemd Service Mode

To check the service status:

```bash
sudo systemctl status auraai.service
```

To view the logs:

```bash
# Using journalctl
sudo journalctl -u auraai.service

# Or view the application log file
tail -f ./auraai-app.log
```

### Stopping the Application

To stop the application, use the provided stop script:

#### For Background Process Mode

```bash
./stop-auraai.sh
# or explicitly specify mode
./stop-auraai.sh --background
```

#### For Systemd Service Mode

```bash
./stop-auraai.sh --systemd
# or use systemctl directly
sudo systemctl stop auraai.service
```

The stop script includes visual feedback with emoji indicators to clearly show the shutdown process status:
- ⏳ Process in progress
- ✅ Success
- ⚠️ Warning
- ❌ Error

When stopping a background process, the script will:
1. Check if the application is running using the saved PID
2. Send a graceful shutdown signal (SIGTERM)
3. Wait up to 5 seconds for graceful termination with visual feedback
4. Force shutdown if necessary after timeout (using SIGKILL)
5. Verify the application has been properly terminated
6. Remove the PID file

When stopping a systemd service, the script will:
1. Check if the service exists and is running
2. Stop the service with systemctl
3. Verify the service has been properly stopped

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