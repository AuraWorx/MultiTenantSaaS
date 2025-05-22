#!/bin/bash

# Kill any existing node processes
pkill -f "node|npm"

# Wait a moment for processes to fully terminate
sleep 2

# Set environment variables
export DATABASE_URL='postgresql://postgres:postgres@localhost:5432/ai_governance'

# Start backend
cd /Users/suryags/Desktop/AI_Work/MultiTenantSaaS-1
npm run dev &
BACKEND_PID=$!

# Wait for backend to start
sleep 5

# Start frontend
cd client
npm run dev &
FRONTEND_PID=$!

# Function to handle script termination
cleanup() {
    echo "Stopping services..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

# Set up trap to catch termination signal
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID 