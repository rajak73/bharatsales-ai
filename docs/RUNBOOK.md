# BharatSales AI - Operations Runbook

## Service Health Checks

### Check All Services
```bash
docker-compose ps
docker-compose logs -f
```

### API Health
```bash
curl http://localhost:4000/api/v1/health/live
curl http://localhost:4000/api/v1/health/ready
```

### Database Health
```bash
docker exec bharatsales-mongodb mongosh --eval "rs.status()"
```

### Redis Health
```bash
docker exec bharatsales-redis redis-cli ping
```

## Common Operations

### Restart Services
```bash
docker-compose restart api
docker-compose restart web
```

### View Logs
```bash
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f mongodb
```

### Database Backup
```bash
docker exec bharatsales-mongodb mongodump --out /backup/$(date +%Y%m%d)
docker cp bharatsales-mongodb:/backup/$(date +%Y%m%d) ./backups/
```

### Database Restore
```bash
docker cp ./backups/<date> bharatsales-mongodb:/backup/
docker exec bharatsales-mongodb mongorestore /backup/<date>
```

### Scale API
```bash
docker-compose up -d --scale api=3
```

## Troubleshooting

### API Not Starting
1. Check MongoDB is running: `docker-compose ps mongodb`
2. Check replica set: `docker exec bharatsales-mongodb mongosh --eval "rs.status()"`
3. Check logs: `docker-compose logs api`

### MongoDB Replica Set Issues
```bash
# Reinitialize replica set
docker-compose up mongo-init
# Or manually:
docker exec bharatsales-mongodb mongosh --eval 'rs.initiate({_id: "rs0", members: [{_id: 0, host: "mongodb:27017"}]})'
```

### Redis Connection Issues
```bash
docker exec bharatsales-redis redis-cli ping
# Should return PONG
```

### Web App Not Loading
1. Check API is running: `curl http://localhost:4000/api/v1/health/live`
2. Check web logs: `docker-compose logs web`
3. Verify NEXT_PUBLIC_API_URL is set correctly

## Monitoring

### Key Metrics to Watch
- API response time (p95 < 500ms for reads)
- Error rate (< 0.1%)
- MongoDB connection pool
- Redis memory usage
- Container CPU/Memory

### Log Locations
- API: `docker-compose logs api`
- Web: `docker-compose logs web`
- MongoDB: `docker-compose logs mongodb`

## Incident Response

### Severity 1 (Critical - Service Down)
1. Check service status: `docker-compose ps`
2. Restart affected service
3. Check logs for errors
4. Escalate if not resolved in 15 minutes

### Severity 2 (Major - Degraded Performance)
1. Check resource usage: `docker stats`
2. Scale affected service if needed
3. Check for slow queries in MongoDB

### Severity 3 (Minor - Non-critical)
1. Log issue
2. Address in next maintenance window

## Maintenance

### Regular Tasks
- Daily: Check backup completion
- Weekly: Review logs for errors
- Monthly: Rotate secrets, review access
- Quarterly: Security audit, dependency updates

### Database Maintenance
```bash
# Check database stats
docker exec bharatsales-mongodb mongosh --eval "db.stats()"

# Check collection sizes
docker exec bharatsales-mongodb mongosh --eval "db.getCollectionNames().forEach(c => print(c, db[c].countDocuments()))"
```
