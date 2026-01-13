# 🚀 NBA Fantasy Backend Deployment Guide

## Production URL
https://pleasing-determination-production.up.railway.app

## Key Endpoints
- `/health` - System health check
- `/api/health` - API health check  
- `/status` - Server status dashboard
- `/api-docs` - API documentation (Swagger)
- `/privacy` - Privacy policy

## Environment Variables (Railway)
- `MONGODB_URI`: mongodb+srv://Jerryexon1:Bigyear1@cluster0.6sqqrz.mongodb.net/sports-app?appName=Cluster0
- `REDIS_URL`: redis://default:BIIjBqQGBdyzNGORZdQYmQQeBgJROcWe@caboose.proxy.rlwy.net:32242
- `NODE_ENV`: production
- `PORT`: 3002
- `JWT_SECRET`: [your-secret]
- `ALLOWED_ORIGINS`: https://nba-frontend.up.railway.app,http://localhost:19006

## How to Deploy
1. Push to main branch: `git push origin main`
2. Or use Railway CLI: `railway up`

## Monitoring
- Railway Dashboard: https://railway.app
- Health Check: https://pleasing-determination-production.up.railway.app/health
- Logs: `railway logs`

## Troubleshooting
1. Check environment variables in Railway
2. Check logs: `railway logs`
3. Redeploy if needed: `railway up --force`
