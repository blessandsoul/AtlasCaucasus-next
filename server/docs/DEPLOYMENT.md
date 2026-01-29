# Tourism Server - Deployment Guide

## Prerequisites

- **Node.js**: 20.x LTS or higher
- **MySQL**: 8.0 or higher
- **Redis**: 7.0 or higher
- **PM2**: For process management (optional but recommended)

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd tourism-server
npm install
```

### 2. Environment Setup

Copy the environment template:
```bash
cp .env.example .env
```

Configure your `.env` file:
```env
# Server
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=mysql://user:password@localhost:3306/tourism_db

# JWT Secrets (generate with: openssl rand -base64 32)
ACCESS_TOKEN_SECRET=your-secure-random-string-min-32-chars
REFRESH_TOKEN_SECRET=another-secure-random-string-min-32-chars

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=noreply@tourismgeorgia.com

# Frontend URL (for CORS and password reset links)
FRONTEND_URL=https://yourfrontend.com
```

### 3. Database Setup

Run migrations:
```bash
npm run prisma:migrate deploy
```

Generate Prisma client:
```bash
npm run prisma:generate
```

Seed initial data (optional):
```bash
npm run prisma:seed
```

### 4. Build Application

```bash
npm run build
```

### 5. Start Server

Development:
```bash
npm run dev
```

Production:
```bash
npm start
```

## Production Deployment with PM2

### Install PM2
```bash
npm install -g pm2
```

### Start Application
```bash
pm2 start ecosystem.config.js
```

### PM2 Management
```bash
# View status
pm2 status

# View logs
pm2 logs tourism-server

# Monitor resources
pm2 monit

# Restart
pm2 restart tourism-server

# Stop
pm2 stop tourism-server

# Enable startup on boot
pm2 startup
pm2 save
```

## Nginx Configuration

### Basic Reverse Proxy

```nginx
upstream tourism_server {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name api.yourserver.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourserver.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourserver.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourserver.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;

    # API Proxy
    location / {
        proxy_pass http://tourism_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # WebSocket Support
    location /ws {
        proxy_pass http://tourism_server;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 86400s;
        proxy_send_timeout 86400s;
    }

    # Static files
    location /postman_collection.json {
        proxy_pass http://tourism_server;
        proxy_cache_valid 200 1d;
    }
}
```

### SSL with Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourserver.com
```

## Health Checks

### Basic Health
```bash
curl http://localhost:3000/api/v1/health
```

### Detailed Health (includes DB, Redis, WebSocket)
```bash
curl http://localhost:3000/api/v1/health/detailed
```

### Server Metrics
```bash
curl http://localhost:3000/api/v1/health/metrics
```

## Monitoring

### Log Files (with PM2)
- Application logs: `~/.pm2/logs/tourism-server-out.log`
- Error logs: `~/.pm2/logs/tourism-server-error.log`

### Key Metrics to Monitor
- CPU and Memory usage
- Response times (p50, p95, p99)
- Error rate (4xx, 5xx)
- Active WebSocket connections
- Redis memory usage
- Database connection pool

### Recommended Tools
- **Prometheus + Grafana**: For metrics visualization
- **ELK Stack**: For log aggregation
- **Uptime Robot**: For availability monitoring

## Backup Strategy

### Database Backup (Daily)
```bash
# Create backup
mysqldump -u user -p tourism_db > backup_$(date +%Y%m%d).sql

# Restore backup
mysql -u user -p tourism_db < backup_20260102.sql
```

### Automated Backup Script
```bash
#!/bin/bash
BACKUP_DIR=/var/backups/tourism
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup
mysqldump -u user -p$DB_PASSWORD tourism_db | gzip > $BACKUP_DIR/db_$DATE.sql.gz

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

## Troubleshooting

### Server Won't Start
1. Check environment variables: `cat .env`
2. Verify database connection: `mysql -u user -p -e "SELECT 1"`
3. Verify Redis connection: `redis-cli ping`
4. Check logs: `pm2 logs tourism-server --lines 100`

### Database Connection Issues
```bash
# Test connection
mysql -h localhost -u user -p tourism_db -e "SELECT 1"

# Check Prisma connection
npx prisma db pull
```

### Redis Connection Issues
```bash
# Test connection
redis-cli -h localhost -p 6379 ping

# Check memory
redis-cli info memory
```

### High Memory Usage
1. Check for memory leaks: `pm2 monit`
2. Restart workers: `pm2 restart tourism-server`
3. Check WebSocket connections: `curl localhost:3000/api/v1/health/detailed`

## Security Checklist

- [ ] Strong JWT secrets (min 32 characters)
- [ ] Database password is complex
- [ ] Redis password configured
- [ ] HTTPS enabled with valid SSL
- [ ] Rate limiting enabled
- [ ] CORS configured for specific origins
- [ ] Environment variables not in git
- [ ] Firewall configured (only 80, 443, 22)
- [ ] SSH key authentication only
- [ ] Regular security updates

## Performance Tuning

### Node.js
```bash
# Set max old space size (for 2GB RAM server)
NODE_OPTIONS="--max-old-space-size=1536"
```

### MySQL
```sql
-- my.cnf optimizations
[mysqld]
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
max_connections = 200
```

### Redis
```conf
# redis.conf
maxmemory 512mb
maxmemory-policy allkeys-lru
```

## Support

For issues and questions:
- Documentation: `/api/v1/` endpoint
- Postman Collection: `/postman_collection.json`
- Email: support@tourismgeorgia.com
