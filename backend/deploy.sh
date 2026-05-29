#!/bin/bash

echo "🚀 Starting deployment..."

cd /home/ubuntu/muaythai-project/backend || exit

echo "📥 Pulling latest code..."
git pull

echo "🐍 Activating virtualenv..."
source venv/bin/activate

echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo "🗄️ Running migrations..."
python manage.py migrate

echo "📁 Collecting static files..."
# python manage.py collectstatic --noinput

echo "🔄 Restarting Gunicorn..."
sudo systemctl restart gunicorn

echo "✅ Deployment complete!"