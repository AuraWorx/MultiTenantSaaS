#!/bin/bash

# Start the Python bias analysis service
cd server/services/bias_analysis
./run.sh &

# Store the Python service PID
PYTHON_PID=$!

# Start the Node.js application
cd ../../..
npm run dev &

# Store the Node.js PID
NODE_PID=$!

# Function to handle script termination
cleanup() {
    echo "Stopping services..."
    kill $PYTHON_PID
    kill $NODE_PID
    exit 0
}

# Set up trap to catch termination signal
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait $PYTHON_PID $NODE_PID 