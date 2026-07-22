#!/bin/bash
# Bulletproof dev server supervisor — restarts Next.js if it ever dies.
cd /home/z/my-project
echo "[$(date)] supervisor started" >> /home/z/my-project/dev.log
while true; do
  node node_modules/.bin/next dev -p 3000 >> /home/z/my-project/dev.log 2>&1
  echo "[$(date)] next dev exited (code $?), restarting in 3s..." >> /home/z/my-project/dev.log
  sleep 3
done
