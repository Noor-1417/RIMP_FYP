# RIMP Deployment Guide

Complete guide for deploying Remote Internship Management Platform to production.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Backend Deployment](#backend-deployment)
3. [Frontend Deployment](#frontend-deployment)
4. [Database Setup](#database-setup)
5. [Environment Configuration](#environment-configuration)
6. [CI/CD Pipeline](#cicd-pipeline)
7. [Monitoring & Maintenance](#monitoring--maintenance)

## Pre-Deployment Checklist

- [ ] All tests passing
- [ ] No console errors or warnings
- [ ] Environment variables configured
- [ ] API keys and secrets secured
- [ ] Database backups configured
- [ ] SSL certificates prepared
- [ ] Domain name configured
- [ ] CDN setup (optional)
- [ ] Email service tested
- [ ] Payment processing tested
- [ ] Analytics configured
- [ ] Error tracking setup

## Backend Deployment

### Option 1: Deploy to Heroku

1. **Install Heroku CLI**
```bash
npm install -g heroku
heroku login
```

2. **Create Heroku app**
```bash
cd backend
heroku create rimp-backend
```

3. **Set environment variables**
```bash
heroku config:set MONGODB_URI=your_mongodb_uri
heroku config:set JWT_SECRET=your_secret_key
heroku config:set STRIPE_SECRET_KEY=your_stripe_key
heroku config:set EMAIL_USER=your_email
heroku config:set EMAIL_PASSWORD=your_app_password
```

4. **Deploy**
```bash
git push heroku main
```

5. **View logs**
```bash
heroku logs --tail
```

### Option 2: Deploy to AWS EC2

1. **Launch EC2 Instance**
   - Choose Ubuntu 20.04 LTS
   - t2.micro (or suitable size)
   - Configure security groups (allow ports 80, 443, 5000)

2. **Connect and setup**
```bash
ssh -i your-key.pem ubuntu@your-instance-ip

# Update system
sudo apt update
sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install MongoDB
sudo apt install -y mongodb

# Install PM2
sudo npm install -g pm2
```

3. **Clone and setup project**
```bash
git clone your-repo-url
cd backend
npm install
```

4. **Create .env file**
```bash
nano .env
# Add your environment variables
```

5. **Start with PM2**
```bash
pm2 start src/server.js --name "rimp-backend"
pm2 startup
pm2 save
```

6. **Setup Nginx reverse proxy**
```bash
sudo apt install -y nginx

# Create config file
sudo nano /etc/nginx/sites-available/rimp
```

Add configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/rimp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

7. **Setup SSL with Let's Encrypt**
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

### Option 3: Deploy to Railway.app

1. **Connect GitHub repository**
2. **Create new project from repo**
3. **Add MongoDB service**
4. **Set environment variables**
5. **Deploy automatically**

### Option 4: Deploy with Docker

1. **Create Dockerfile**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
```

2. **Build and push to Docker Hub**
```bash
docker build -t rimp-backend .
docker tag rimp-backend your-username/rimp-backend
docker push your-username/rimp-backend
```

3. **Deploy with Docker Compose**
```bash
docker-compose up -d
```

## Frontend Deployment

### Option 1: Deploy to Vercel

1. **Connect GitHub repository**
2. **Configure build settings**
   - Framework: Create React App
   - Build command: `npm run build`
   - Output directory: `build`

3. **Set environment variables**
```
REACT_APP_API_URL=https://your-backend-url
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
```

4. **Deploy**
   - Automatic on push to main branch

### Option 2: Deploy to Netlify

1. **Install Netlify CLI**
```bash
npm install -g netlify-cli
```

2. **Login and init**
```bash
netlify login
netlify init
```

3. **Configure build**
   - Build command: `npm run build`
   - Publish directory: `build`

4. **Deploy**
```bash
netlify deploy --prod
```

### Option 3: Deploy to AWS S3 + CloudFront

1. **Build frontend**
```bash
npm run build
```

2. **Create S3 bucket**
```bash
aws s3 mb s3://rimp-frontend-prod
```

3. **Upload files**
```bash
aws s3 sync build/ s3://rimp-frontend-prod --delete
```

4. **Create CloudFront distribution**
   - Origin: S3 bucket
   - Default document: index.html
   - Enable compression
   - Set CORS headers

5. **Update Route 53**
   - Point domain to CloudFront distribution

### Option 4: Deploy to traditional web host

1. **Build frontend**
```bash
npm run build
```

2. **Upload via FTP/SFTP**
   - Upload `build` folder contents
   - Configure .htaccess for SPA routing

3. **.htaccess configuration**
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{DOCUMENT_ROOT}%{REQUEST_FILENAME} -f [OR]
  RewriteCond %{DOCUMENT_ROOT}%{REQUEST_FILENAME} -d
  RewriteRule ^ - [L]
  RewriteRule ^ /index.html [L]
</IfModule>
```

## Database Setup

### MongoDB Atlas (Recommended)

1. **Create account** at mongodb.com/cloud/atlas

2. **Create cluster**
   - Choose cloud provider
   - Select region
   - Configure network access

3. **Get connection string**
   - Replace `<username>` and `<password>`
   - Use in MONGODB_URI

4. **Backup configuration**
   - Enable automated backups
   - Set backup frequency to daily
   - Download snapshots regularly

### Self-hosted MongoDB

1. **Install MongoDB Enterprise**
```bash
# Ubuntu
sudo apt install -y mongodb-org

# Start service
sudo systemctl start mongod
sudo systemctl enable mongod
```

2. **Configure replication**
```javascript
// Initialize replica set
rs.initiate()
```

3. **Setup backup script**
```bash
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)

mongodump --out $BACKUP_DIR/backup_$DATE

# Cleanup old backups (keep last 30 days)
find $BACKUP_DIR -type d -mtime +30 -exec rm -rf {} \;
```

## Environment Configuration

### Backend Production .env

```env
# Server
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-frontend-domain.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/rimp

# JWT
JWT_SECRET=your-very-secure-random-string-min-32-chars
JWT_EXPIRE=7d

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx

# Email
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
EMAIL_FROM=noreply@rimp.com
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587

# AWS S3 (Optional)
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_S3_BUCKET=rimp-uploads
AWS_REGION=us-east-1

# Firebase (Optional)
FIREBASE_API_KEY=xxxxx
FIREBASE_PROJECT_ID=xxxxx
```

### Frontend Production .env

```env
REACT_APP_API_URL=https://api.your-domain.com
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxx
```

## CI/CD Pipeline

### GitHub Actions Configuration

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend && npm install
          cd ../frontend && npm install
      
      - name: Run tests
        run: |
          cd backend && npm test
          cd ../frontend && npm test
      
      - name: Build frontend
        run: cd frontend && npm run build
      
      - name: Deploy to Vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
        run: npx vercel --prod
      
      - name: Deploy to Heroku
        env:
          HEROKU_API_KEY: ${{ secrets.HEROKU_API_KEY }}
        run: |
          git push https://heroku:$HEROKU_API_KEY@git.heroku.com/rimp-backend.git main
```

## Monitoring & Maintenance

### Application Monitoring

1. **Setup Sentry for error tracking**
```javascript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: "production",
});
```

2. **Setup New Relic**
   - Monitor application performance
   - Track errors and exceptions
   - Database performance metrics

3. **Setup LogRocket**
   - Session replay
   - Error tracking
   - Performance monitoring

### Server Monitoring

1. **AWS CloudWatch**
   - Monitor EC2 instances
   - Track CPU and memory
   - Set up alarms

2. **Uptime Monitoring**
   - Use UptimeRobot
   - Set up status page
   - Get notifications

### Database Maintenance

1. **Regular backups**
   - Daily automated backups
   - Weekly full snapshots
   - Monthly archive

2. **Index optimization**
```javascript
// Add indexes for frequently queried fields
db.users.createIndex({ email: 1 })
db.tasks.createIndex({ category: 1, status: 1 })
db.payments.createIndex({ user: 1, status: 1 })
```

3. **Database cleanup**
```bash
# Cleanup old notifications (older than 90 days)
db.notifications.deleteMany({
  createdAt: { $lt: new Date(Date.now() - 90*24*60*60*1000) }
})
```

### Security Updates

1. **Keep dependencies updated**
```bash
npm audit
npm audit fix
npm outdated
npm update
```

2. **SSL certificate renewal** (auto with Let's Encrypt)

3. **Security headers configuration** (Nginx)
```nginx
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "no-referrer-when-downgrade" always;
add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
```

### Performance Optimization

1. **Enable compression** (Nginx)
```nginx
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
```

2. **Cache static assets**
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

3. **Database query optimization**
   - Add appropriate indexes
   - Use pagination for large datasets
   - Cache frequently accessed data

## Post-Deployment

1. **Test all features**
   - User registration and login
   - Payment processing
   - Email notifications
   - File uploads
   - Certificate generation

2. **Run smoke tests**
```bash
npm run test:smoke
```

3. **Monitor for errors**
   - Check error tracking dashboard
   - Review server logs
   - Monitor performance metrics

4. **Setup monitoring alerts**
   - High error rate (>1%)
   - API response time (>2s)
   - Server down time
   - Database connection issues

## Rollback Procedure

1. **Backend rollback**
```bash
# Heroku
heroku releases
heroku rollback v123

# Docker
docker pull your-username/rimp-backend:previous-tag
docker-compose restart
```

2. **Frontend rollback**
```bash
# Vercel
vercel --prod rollback

# Netlify
netlify deploy --prod --alias previous-deployment
```

3. **Database rollback**
   - Restore from latest backup
   - Document reason for rollback
   - Communicate to users if needed

## Support

For deployment issues, consult:
- [Express.js Deployment](https://expressjs.com/en/advanced/best-practice-performance.html)
- [React Deployment](https://create-react-app.dev/deployment/)
- [MongoDB Deployment](https://docs.mongodb.com/manual/administration/deploy-and-maintain/)
- Platform-specific documentation

---

**Last Updated**: November 2024
