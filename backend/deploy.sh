#!/bin/bash

echo "🚀 Starting deployment..."

cd /home/ubuntu/muaythai-project/backend || exit

echo "📥 Pulling latest code..."
git pull

echo "🐍 Activating virtualenv..."
source venv/bin/activate

echo "📦 Installing dependencies..."
pip install -r requirements.txt

echo "🔐 Ensuring RDS CA bundle is present..."
# Required for the DB SSL connection (sslmode=verify-full). Git-ignored, so fetch if missing.
if [ ! -f global-bundle.pem ]; then
    curl -sS -o global-bundle.pem https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem
    echo "   Downloaded global-bundle.pem"
else
    echo "   global-bundle.pem already present"
fi

echo "🗄️ Running migrations..."
python manage.py migrate

echo "📁 Collecting static files..."
# python manage.py collectstatic --noinput

echo "🔄 Restarting Gunicorn..."
sudo systemctl restart gunicorn

echo "✅ Deployment complete!"