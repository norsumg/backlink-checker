# Deployment Guide - Backlink Price Finder

## 🛡️ **Security Prerequisites**

### Docker Installation
**⚠️ SECURITY NOTICE**: Only install Docker from official sources.

**Ubuntu/Debian:**
```bash
# Update package index
sudo apt-get update

# Install Docker from official repository
sudo apt-get install -y docker.io docker-compose

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker
```

**CentOS/RHEL:**
```bash
# Install Docker from official repository
sudo yum install -y docker docker-compose

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker
```

**❌ DO NOT** use convenience scripts like `get-docker.sh` in production environments.

## 🐳 **Current Production Setup**

### Architecture
- **Frontend**: React app in Docker container (ports 80/443)
- **Backend**: FastAPI in Docker container (port 8000)
- **Database**: PostgreSQL in Docker container (port 5432)

### Database Configuration
- **Production DB**: `postgresql://postgres:password@postgres:5432/backlink_checker`
- **Local Development**: SQLite fallback when not using Docker

## 🔧 **Working with the Database**

### Running Migrations

**✅ CORRECT - In Docker (Production):**
```bash
# Navigate to project root
cd /root/backlink-checker

# Run migration inside the backend container
docker exec -it backlink-checker-backend-1 alembic upgrade head
```

**❌ INCORRECT - On Host (Development only):**
```bash
# This uses SQLite, not your production PostgreSQL!
cd backend
alembic upgrade head
```

### Database Connection Details
- **Host**: postgres (Docker service name)
- **Port**: 5432
- **Database**: backlink_checker
- **User**: postgres
- **Password**: password

## 🚀 **Deployment Process**

### 1. Code Updates
```bash
# Pull latest changes
cd /root/backlink-checker
git pull origin main
```

### 2. Rebuild and Restart Containers
```bash
# Rebuild and restart all services
docker-compose down
docker-compose up -d --build
```

### 3. Run Database Migrations (if any)
```bash
# Run migrations in the backend container
docker exec -it backlink-checker-backend-1 alembic upgrade head
```

### 4. Check Service Status
```bash
# Verify all containers are running
docker ps

# Check logs if needed
docker logs backlink-checker-backend-1
docker logs backlink-checker-frontend-1
docker logs backlink-checker-postgres-1
```

## 🔒 **Environment Variables**

### Production Environment Variables (in docker-compose.yml)
```yaml
backend:
  environment:
    - DATABASE_URL=postgresql://postgres:password@postgres:5432/backlink_checker
    - SECRET_KEY=${SECRET_KEY:-your-secret-key-change-in-production}
    - ADMIN_PASSWORD=${ADMIN_PASSWORD:-change-this-admin-password}
    - DEBUG=false
```

### Adding New Environment Variables
1. Add to `docker-compose.yml` under backend environment
2. Add to `backend/app/core/config.py` if needed
3. Rebuild and restart containers

### 🔒 **Security: Protecting Secrets**

**IMPORTANT**: Never commit real secrets to git!

1. **Template file**: `docker-compose.template.yml` (safe to commit)
2. **Production file**: `docker-compose.yml` (contains real secrets, do NOT commit)

**Setting up production secrets:**
```bash
# Copy template to production file
cp docker-compose.template.yml docker-compose.yml

# Edit with your real secrets
nano docker-compose.yml

# Prevent accidental commits
git update-index --skip-worktree docker-compose.yml
```

## 🛠️ **Troubleshooting**

### Database Connection Issues
```bash
# Check if PostgreSQL container is healthy
docker ps
# Should show (healthy) status for postgres container

# Test database connection
docker exec -it backlink-checker-postgres-1 psql -U postgres -d backlink_checker -c "SELECT 1;"
```

### Backend Issues
```bash
# Check backend logs
docker logs backlink-checker-backend-1

# Access backend container shell
docker exec -it backlink-checker-backend-1 bash
```

### Migration Issues
```bash
# Check current migration status
docker exec -it backlink-checker-backend-1 alembic current

# See migration history
docker exec -it backlink-checker-backend-1 alembic history
```

## 📝 **Authentication System Deployment**

### New Dependencies Added
- `google-auth==2.23.4` (backend)
- `jwt-decode` (frontend)

### New Environment Variables Needed
Add these to `docker-compose.yml`:
```yaml
backend:
  environment:
    # ... existing vars ...
    - GOOGLE_CLIENT_ID=your-actual-google-client-id
    - GOOGLE_CLIENT_SECRET=your-actual-google-client-secret
```

### Setting Up Google OAuth (Required for Authentication)
1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Enable "Google Identity API" or "Google+ API"**
3. **Create OAuth 2.0 Client ID:**
   - Application type: "Web application"
   - Authorized redirect URIs: `https://yourdomain.com`
4. **Copy Client ID and Secret to docker-compose.yml**
5. **Restart containers**: `docker-compose down && docker-compose up -d`

### Creating a Test User (Optional)
```bash
# Create local test user for immediate access
docker exec -it backlink-checker-postgres-1 psql -U postgres -d backlink_checker -c "
INSERT INTO users (email, username, full_name, hashed_password, is_active, is_verified, created_at) 
VALUES ('admin@test.com', 'admin', 'Admin User', '\$2b\$12\$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', true, true, now());
"
# Login: admin@test.com / secret
```

### Migration Required
The authentication system adds a new `users` table:
```bash
# After pulling authentication changes
docker exec -it backlink-checker-backend-1 alembic upgrade head
```

## 🔄 **Regular Maintenance**

### Monthly Tasks
- Check container logs for errors
- Verify SSL certificates are valid
- Update base images: `docker-compose pull`
- Backup database: `docker exec backlink-checker-postgres-1 pg_dump -U postgres backlink_checker > backup_$(date +%Y%m%d).sql`

### Security Updates
- Regularly update base images in Dockerfiles
- Monitor for dependency vulnerabilities
- Rotate secrets (DATABASE_URL, SECRET_KEY, etc.)

## 🆘 **Emergency Procedures**

### Container Won't Start
```bash
# Check what's wrong
docker logs backlink-checker-backend-1

# Force recreate containers
docker-compose down
docker-compose up -d --force-recreate
```

### Database Issues
```bash
# Access database directly
docker exec -it backlink-checker-postgres-1 psql -U postgres -d backlink_checker

# Restore from backup (if needed)
cat backup_20240823.sql | docker exec -i backlink-checker-postgres-1 psql -U postgres -d backlink_checker
```

### Complete Reset (DANGER!)
```bash
# This will destroy all data!
docker-compose down -v
docker-compose up -d --build
docker exec -it backlink-checker-backend-1 alembic upgrade head
```

## 📋 **Pre-deployment Checklist**

- [ ] Code pulled from main branch
- [ ] Environment variables configured
- [ ] SSL certificates valid
- [ ] Database backup created
- [ ] Migration plan reviewed
- [ ] Rollback plan prepared
- [ ] Monitoring/logs ready to check post-deployment
