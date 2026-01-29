# Docker Setup

This project uses Docker Compose to run all required services for local development.

## Services

The following services are configured in `docker-compose.yml`:

### 1. MySQL 8.0 (`atlascaucasus-next-mysql`)
- **Port**: `3307`
- **Database**: `tourism_db`
- **User**: `tourism_user`
- **Password**: `tourism_password`
- **Root Password**: `rootpassword`
- **Persistent Storage**: `mysql_data` volume

### 2. phpMyAdmin (`atlascaucasus-next-phpmyadmin`)
- **Port**: `8082`
- **URL**: http://localhost:8082
- **Login**:
  - Username: `root`
  - Password: `rootpassword`
- Use this to browse and manage the MySQL database

### 3. Redis 7 (`atlascaucasus-next-redis`)
- **Port**: `6380`
- **Persistent Storage**: `redis_data` volume (AOF enabled)
- Used for caching, rate limiting, and real-time features

### 4. Redis Commander (`atlascaucasus-next-redis-ui`)
- **Port**: `8083`
- **URL**: http://localhost:8083
- Web-based Redis management interface
- Browse keys, view data, and monitor Redis

---

## Commands

### Start all services
```bash
npm run db:up
```
This starts MySQL, phpMyAdmin, Redis, and Redis Commander in detached mode.

### Stop all services
```bash
npm run db:down
```
Stops all containers but preserves data volumes.

### Reset all data
```bash
npm run db:reset
```
WARNING: This deletes all volumes (database data, Redis data) and recreates containers.

### View logs
```bash
docker compose logs -f
```

### View specific service logs
```bash
docker compose logs -f mysql
docker compose logs -f redis
```

---

## Connection Details

### From the Node.js server:

**.env configuration:**
```env
DATABASE_URL="mysql://tourism_user:tourism_password@localhost:3307/tourism_db"
REDIS_HOST=localhost
REDIS_PORT=6380
```

### From other Docker containers:

If you run the Node.js server inside Docker, use service names:
```env
DATABASE_URL="mysql://tourism_user:tourism_password@mysql:3306/tourism_db"
REDIS_HOST=redis
REDIS_PORT=6379
```

---

## Prisma Setup

After starting Docker services for the first time:

1. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

2. **Run migrations:**
   ```bash
   npm run prisma:migrate
   ```

3. **Seed database (optional):**
   ```bash
   npm run prisma:seed
   ```

---

## Troubleshooting

### Port conflicts

If you get "port already in use" errors:

- **MySQL (3306)**: Stop local MySQL or change port in `docker-compose.yml`
- **Redis (6379)**: Stop local Redis or change port in `docker-compose.yml`
- **phpMyAdmin (8080)**: Change to another port like `8082:80`
- **Redis Commander (8081)**: Change to another port like `8082:8081`

### Container won't start

Check logs:
```bash
docker compose logs <service-name>
```

Rebuild containers:
```bash
docker compose down
docker compose up -d --build
```

### Reset everything

Complete reset (deletes all data):
```bash
docker compose down -v
docker volume prune -f
npm run db:up
npm run prisma:migrate
```

---

## Production Notes

WARNING: Do not use these settings in production!

### Database Permissions

The file `docker/init/01-grant-permissions.sql` grants ALL PRIVILEGES to `tourism_user`. This is:
- **SAFE** for local development
- **DANGEROUS** for production

**For Production:**
1. **Option A (Recommended)**: Use managed database services (AWS RDS, PlanetScale, Google Cloud SQL)
   - They handle permissions securely
   - No need to worry about shadow databases
   - Automated backups and security

2. **Option B**: If self-hosting, use `docker/init/02-production-permissions.sql.example`
   - Grants only necessary privileges
   - Restricts user to single database
   - Allows shadow database creation for migrations only

3. **Best Practice**: Use separate database users
   - **Migration user** (privileged): Only used in CI/CD for running migrations
   - **Application user** (restricted): Only SELECT, INSERT, UPDATE, DELETE
   - Application never runs migrations in production

### Security Checklist

- [ ] Change all passwords in `.env` and `docker-compose.yml`
- [ ] Use secrets management (Docker Secrets, Kubernetes Secrets, AWS Secrets Manager)
- [ ] Restrict database user permissions (see above)
- [ ] Enable Redis password authentication
- [ ] Use managed database services (AWS RDS, PlanetScale, etc.)
- [ ] Configure SSL/TLS for all connections
- [ ] Set up automated backup strategies
- [ ] Never run `prisma migrate dev` in production (use `prisma migrate deploy` in CI/CD)
