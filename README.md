# NBA Fantasy AI Backend 🏀🤖

## Status: ✅ Production Ready
All 15 integration tests passing | Version: 4.2.0

## Overview
A production-ready backend service for NBA Fantasy AI, featuring real-time sports data, AI predictions, analytics, and premium subscription management. Built with Node.js, Express, MongoDB, Redis, and WebSocket for real-time updates.

## Features
- ✅ **NBA Games Data** - Live and historical NBA games with team statistics
- ✅ **AI Predictions Engine** - Machine learning-powered game predictions
- ✅ **Kalshi Market Integration** - Real-time prediction market data
- ✅ **Analytics Dashboard** - User behavior and engagement tracking
- ✅ **Premium Subscription Management** - RevenueCat integration for subscriptions
- ✅ **Real-time WebSocket Support** - Live updates for secret phrases and game events
- ✅ **Multi-Database Support** - MongoDB + Redis caching layer
- ✅ **Authentication & Authorization** - JWT-based secure API access
- ✅ **Rate Limiting & Security** - Production-ready security middleware
- ✅ **Comprehensive API Documentation** - Swagger/OpenAPI documentation
- ✅ **Health Monitoring** - Express status monitor with metrics

## Tech Stack
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB Atlas (Primary), Redis (Cache)
- **Authentication**: JWT, RevenueCat
- **Real-time**: Socket.io WebSocket
- **Documentation**: Swagger/OpenAPI
- **Monitoring**: Express Status Monitor
- **Security**: Helmet, CORS, Rate Limiting

## API Endpoints

### Core Endpoints
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/nba/games` | GET | Get NBA games data | No |
| `/api/nba/games/today` | GET | Today's NBA games | No |
| `/api/kalshi/markets` | GET | Kalshi prediction markets | No |
| `/api/predictions/generate` | POST | Generate AI predictions | Yes |
| `/api/analytics/summary` | GET | Analytics dashboard | Yes |
| `/api/analytics/log` | POST | Log analytics events | Yes |
| `/api/secret-phrases` | POST | Log secret phrase discoveries | Yes |

### Health & Monitoring
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Full system health check |
| `/api/health` | GET | API health status |
| `/status` | GET | Express status monitor |
| `/api-docs` | GET | Swagger API documentation |

### Premium Features
| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| `/api/premium/validate` | GET | Validate subscription | Yes |
| `/api/premium/limits` | GET | Check usage limits | Yes |
| `/api/premium/features` | GET | Get premium features | Yes |

## Quick Start

### Prerequisites
- Node.js 18 or higher
- MongoDB Atlas account
- Redis instance (optional, uses in-memory cache if not available)
- Railway or similar deployment platform

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/jarryexon-coder/Final-Code.git
   cd Final-Code
