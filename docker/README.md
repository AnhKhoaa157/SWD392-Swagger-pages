# 🐳 Docker Deployment Guide

Hướng dẫn triển khai Academic Collaboration Platform Backend với Docker.

## 📋 Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+
- 4GB RAM minimum
- 10GB disk space

## 🚀 Quick Start

### 1. Chuẩn bị Environment Variables

```bash
# Copy template
cp .env.docker .env

# Chỉnh sửa .env với thông tin của bạn
nano .env  # hoặc notepad .env
```

**⚠️ Quan trọng**: Đổi các giá trị mặc định trong production!
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ADMIN_PASSWORD`

### 2. Build và Start Services

```bash
# Build và start tất cả services
docker-compose up -d

# Hoặc build lại nếu có thay đổi code
docker-compose up -d --build

# Start với phpMyAdmin (database management tool)
docker-compose --profile tools up -d
```

### 3. Kiểm tra Status

```bash
# Xem logs
docker-compose logs -f backend

# Kiểm tra health
docker-compose ps

# Test API
curl http://localhost:3000
```

## 🛠️ Helper Scripts (Recommended)

Để đơn giản hóa việc quản lý Docker, project cung cấp các helper scripts:

### Windows (PowerShell)

```powershell
# Xem tất cả commands
./docker.ps1 help

# Development (hot-reload)
./docker.ps1 dev           # Start dev mode
./docker.ps1 dev-build     # Rebuild và start
./docker.ps1 dev-stop      # Stop dev containers

# Production
./docker.ps1 up            # Start production
./docker.ps1 build         # Rebuild images
./docker.ps1 down          # Stop all

# Monitoring
./docker.ps1 logs          # Xem tất cả logs
./docker.ps1 logs-api      # Backend logs only
./docker.ps1 status        # Container status
./docker.ps1 stats         # Resource usage

# Database
./docker.ps1 db-connect    # Connect MySQL shell
./docker.ps1 db-backup     # Backup database
./docker.ps1 db-restore    # Restore from backup
./docker.ps1 db-reset      # Reset database

# Utilities
./docker.ps1 shell         # Backend shell
./docker.ps1 phpmyadmin    # Start phpMyAdmin
./docker.ps1 test          # Run tests
```

### Linux/Mac (Makefile)

```bash
# Xem tất cả commands
make help

# Development
make dev                   # Start dev mode
make dev-build             # Rebuild và start
make dev-stop              # Stop dev containers

# Production
make up                    # Start production
make build                 # Rebuild images
make down                  # Stop all

# Monitoring
make logs                  # Xem tất cả logs
make logs-api              # Backend logs only
make status                # Container status
make stats                 # Resource usage

# Database
make db-connect            # Connect MySQL shell
make db-backup             # Backup database
make db-restore            # Restore from backup
make db-reset              # Reset database

# Utilities
make shell                 # Backend shell
make phpmyadmin            # Start phpMyAdmin
make test                  # Run tests
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                   Client                        │
│              (Frontend/Postman)                 │
└─────────────────┬───────────────────────────────┘
                  │ HTTP :3000
                  ▼
┌─────────────────────────────────────────────────┐
│           Backend API (Node.js)                 │
│         academic_backend container              │
│  ┌──────────────────────────────────────────┐  │
│  │ • Express.js REST API                    │  │
│  │ • Sequelize ORM                          │  │
│  │ • JWT Authentication                     │  │
│  │ • Auto-create Admin on startup          │  │
│  └──────────────────────────────────────────┘  │
└─────────────────┬───────────────────────────────┘
                  │ MySQL Protocol :3306
                  ▼
┌─────────────────────────────────────────────────┐
│          MySQL Database 8.0                     │
│         academic_mysql container                │
│  ┌──────────────────────────────────────────┐  │
│  │ • 14 Tables (AcademicCore + ChatEngine)  │  │
│  │ • utf8mb4 encoding                       │  │
│  │ • Auto-init with schema.sql              │  │
│  │ • Persistent volume                      │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

## 📦 Docker Services

### Backend API
- **Container**: `academic_backend`
- **Port**: 3000
- **Image**: Built from Dockerfile
- **Health Check**: GET http://localhost:3000/
- **Auto-restart**: Yes

### MySQL Database
- **Container**: `academic_mysql`
- **Port**: 3306
- **Image**: mysql:8.0
- **Volume**: `mysql_data` (persistent)
- **Auto-init**: Runs `database-schema.sql` on first start
- **Health Check**: mysqladmin ping

### phpMyAdmin (Optional)
- **Container**: `academic_phpmyadmin`
- **Port**: 8080
- **Profile**: `tools` (not started by default)
- **Access**: http://localhost:8080

## 🔧 Common Commands

### Start/Stop Services

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes database data)
docker-compose down -v

# Restart specific service
docker-compose restart backend
```

### Logs & Debugging

```bash
# View all logs
docker-compose logs -f

# View backend logs only
docker-compose logs -f backend

# View last 100 lines
docker-compose logs --tail=100 backend

# Check container status
docker-compose ps
```

### Database Operations

```bash
# Access MySQL CLI
docker-compose exec mysql mysql -u root -p

# Backup database
docker-compose exec mysql mysqldump -u root -p academic_collaboration_db > backup.sql

# Restore database
docker-compose exec -T mysql mysql -u root -p academic_collaboration_db < backup.sql

# Reset database
docker-compose down -v
docker-compose up -d
```

### Build & Update

```bash
# Rebuild after code changes
docker-compose up -d --build

# Force rebuild (no cache)
docker-compose build --no-cache
docker-compose up -d

# Pull latest images
docker-compose pull
docker-compose up -d
```

## � Development Mode

Development mode provides hot-reload, debugging capabilities, and exposed database ports.

### Using docker-compose.dev.yml

```bash
# Start in development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Or use helper scripts
./docker.ps1 dev        # Windows
make dev                # Linux/Mac
```

### Features in Development Mode

1. **Hot-Reload**: Source code mounted as volume
   ```yaml
   volumes:
     - ./src:/usr/src/app/src
     - ./server.js:/usr/src/app/server.js
   ```

2. **Debugging**: Node.js debugger port exposed
   - Port: `9229`
   - VS Code: Add launch configuration
   ```json
   {
     "type": "node",
     "request": "attach",
     "name": "Docker: Attach to Node",
     "port": 9229,
     "address": "localhost",
     "restart": true
   }
   ```

3. **Database Access**: MySQL port exposed
   - Port: `3306`
   - Connect from host: `localhost:3306`

4. **phpMyAdmin**: Auto-started
   - Access: http://localhost:8080

### Differences between Dev and Production

| Feature | Development | Production |
|---------|-------------|------------|
| Code reload | ✅ Hot-reload | ❌ Baked into image |
| Build target | `builder` | Final optimized |
| MySQL port | ✅ Exposed (3306) | ❌ Internal only |
| Debug port | ✅ Exposed (9229) | ❌ Disabled |
| phpMyAdmin | ✅ Auto-start | ❌ Manual start |
| Volume mounts | ✅ Source code | ❌ No mounts |
| Image size | Larger | Smaller |

### Switching Modes

```bash
# Stop development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down

# Start production mode
docker-compose up -d
```

## �🔒 Security Best Practices

### 1. Environment Variables

**❌ Never commit `.env` to git!**

```bash
# .gitignore should contain:
.env
.env.local
.env.production
```

### 2. Strong Passwords

```bash
# Generate strong passwords
openssl rand -base64 32

# Use in .env
DB_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
```

### 3. Production Checklist

- [ ] Change default `ADMIN_PASSWORD`
- [ ] Use strong `DB_PASSWORD`
- [ ] Generate new `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Configure proper `CORS_ORIGIN`
- [ ] Enable SSL/TLS with reverse proxy (nginx/traefik)
- [ ] Limit exposed ports (use internal networks)
- [ ] Regular backups
- [ ] Monitor logs

## 🌐 Production Deployment

### Using Nginx Reverse Proxy

```nginx
# /etc/nginx/sites-available/academic-api
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### SSL with Let's Encrypt

```bash
# Install certbot
apt-get install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d api.yourdomain.com

# Auto-renewal is enabled by default
```

### Docker Compose Production Override

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    environment:
      NODE_ENV: production
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  mysql:
    restart: always
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

Run with:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 📊 Monitoring

### Health Checks

```bash
# Check backend health
curl http://localhost:3000/

# Check MySQL health
docker-compose exec mysql mysqladmin ping -h localhost
```

### Resource Usage

```bash
# View resource usage
docker stats

# View specific container
docker stats academic_backend
```

### Logs Analysis

```bash
# Search for errors
docker-compose logs backend | grep -i error

# Count requests
docker-compose logs backend | grep "GET\|POST\|PUT\|DELETE" | wc -l
```

## 🔄 Updates & Maintenance

### Update Application

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose up -d --build

# Verify
docker-compose logs -f backend
```

### Database Migrations

```bash
# Run migration script
docker-compose exec backend npm run migrate

# Or manually
docker-compose exec backend node scripts/migrate.js
```

### Backup Schedule

```bash
# Add to crontab
0 2 * * * cd /path/to/project && docker-compose exec -T mysql mysqldump -u root -p$DB_PASSWORD academic_collaboration_db | gzip > backups/backup-$(date +\%Y\%m\%d).sql.gz
```

## ❓ Troubleshooting

### Backend không start được

```bash
# Check logs
docker-compose logs backend

# Common issues:
# 1. Database not ready
docker-compose restart backend

# 2. Port already in use
netstat -ano | findstr :3000  # Windows
lsof -i :3000                  # Linux/Mac

# 3. Permission issues
docker-compose down
docker volume prune
docker-compose up -d
```

### Database connection failed

```bash
# Check MySQL is running
docker-compose ps mysql

# Check health
docker-compose exec mysql mysqladmin ping -h localhost -u root -p

# Check credentials in .env
docker-compose config | grep DB_
```

### Cannot connect from host

```bash
# Check ports are exposed
docker-compose ps

# Check firewall
# Windows: Disable Windows Firewall temporarily
# Linux: sudo ufw allow 3000
```

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MySQL Docker Hub](https://hub.docker.com/_/mysql)
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)

## 🆘 Support

Nếu gặp vấn đề:
1. Check logs: `docker-compose logs -f`
2. Check status: `docker-compose ps`
3. Restart services: `docker-compose restart`
4. Clean rebuild: `docker-compose down && docker-compose up -d --build`

---

**Built with ❤️ for Academic Collaboration Platform**
