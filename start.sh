#!/bin/bash
echo "=== Starting Spring Boot Backend on port 8080 ==="
java -jar /app/backend.jar &

echo "=== Waiting for Backend Initialization ==="
sleep 8

echo "=== Starting Node.js Frontend & API Proxy Server ==="
node /app/serve_frontend.js
