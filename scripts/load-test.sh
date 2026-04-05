#!/bin/bash
echo "Sending traffic... press Ctrl+C to stop"
while true; do
  curl -s http://localhost:8080/          > /dev/null
  curl -s http://localhost:8080/api/data  > /dev/null
  curl -s http://localhost:8080/api/error > /dev/null
  curl -s http://localhost:8080/api/slow  > /dev/null
  sleep 0.5
done