#!/bin/bash

echo "🔄 Restarting services..."

sudo systemctl restart gunicorn
sudo systemctl restart nginx

echo "✅ Restart complete!"