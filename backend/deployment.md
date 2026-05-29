# 🚀 Django Deployment Guide (EC2 + Gunicorn + Nginx)

## 📦 Project Info

* Project Path: `/home/ubuntu/muaythai-project/backend`
* Domain: `muaythai-test.duckdns.org`
* WSGI: `config.wsgi:application`

---

## ⚙️ 1. Initial Server Setup

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install python3-pip python3-venv nginx git -y
```

---

## 📥 2. Clone Project

```bash
git clone <your-repo>
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## 🔐 3. Environment Variables

Create `.env` file:

```env
SECRET_KEY=your_secret
DEBUG=False
ALLOWED_HOSTS=muaythai-test.duckdns.org
```

---

## 🗄️ 4. Django Setup

```bash
python manage.py migrate
python manage.py collectstatic
```

---

## 🔥 5. Gunicorn Setup

```bash
sudo nano /etc/systemd/system/gunicorn.service
```

```ini
[Unit]
Description=gunicorn daemon
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/muaythai-project/backend

ExecStart=/home/ubuntu/muaythai-project/backend/venv/bin/gunicorn \
--workers 3 \
--bind unix:/home/ubuntu/muaythai-project/backend/backend.sock \
config.wsgi:application

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl start gunicorn
sudo systemctl enable gunicorn
```

---

## 🌐 6. Nginx Setup

```bash
sudo nano /etc/nginx/sites-available/mauythai
```

```nginx
server {
    listen 80;
    server_name muaythai-test.duckdns.org;

    location /static/ {
        root /home/ubuntu/muaythai-project/backend;
    }

    location / {
        include proxy_params;
        proxy_pass http://unix:/home/ubuntu/muaythai-project/backend/backend.sock;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mauythai /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 7. HTTPS Setup

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d muaythai-test.duckdns.org
```

---

## 🔄 8. Updating Application

```bash
git pull
source venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic
sudo systemctl restart gunicorn
```

---

## 📊 9. Logs

```bash
sudo journalctl -u gunicorn -f
sudo tail -f /var/log/nginx/error.log
```

---

## ⚡ 10. Restart Services

```bash
sudo systemctl restart gunicorn
sudo systemctl restart nginx
```

---
