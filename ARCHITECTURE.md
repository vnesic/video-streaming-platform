# System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌────────────┐  ┌────────────┐  ┌──────────────────────┐  │
│  │ Web App    │  │ Android TV │  │ Mobile App (Future)  │  │
│  │ (React)    │  │            │  │                      │  │
│  └────────────┘  └────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway / Backend                     │
│                    (Node.js + Express)                       │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │ Auth Service │  │ Video Service│  │ Payment Service │  │
│  │              │  │              │  │                 │  │
│  │ - Register   │  │ - List       │  │ - Subscribe     │  │
│  │ - Login      │  │ - Stream     │  │ - Cancel        │  │
│  │ - JWT        │  │ - Progress   │  │ - Webhook       │  │
│  └──────────────┘  └──────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
    ┌─────────────┐  ┌──────────┐  ┌──────────────┐
    │ PostgreSQL  │  │   Mux    │  │    Stripe    │
    │             │  │  Video   │  │   Payments   │
    │ - Users     │  │ Hosting  │  │              │
    │ - Subs      │  │          │  │ - Checkout   │
    │ - Videos    │  │ - Encode │  │ - Webhooks   │
    │ - History   │  │ - Stream │  │ - Billing    │
    └─────────────┘  └──────────┘  └──────────────┘
```

## Data Flow

### User Registration & Authentication
```
User → Frontend → POST /api/auth/register
              ↓
           Backend validates input
              ↓
           Hash password (bcrypt)
              ↓
           Create Stripe customer
              ↓
           Save to PostgreSQL
              ↓
           Generate JWT token
              ↓
           Return token + user data
```

### Subscription Flow
```
User selects plan → Frontend → POST /api/subscription/checkout
                            ↓
                    Backend creates Stripe session
                            ↓
                    User redirected to Stripe
                            ↓
                    User completes payment
                            ↓
            Stripe webhook → POST /api/subscription/webhook
                            ↓
                    Backend processes webhook
                            ↓
                    Update subscription in DB
                            ↓
                    User gains access
```

### Video Streaming Flow
```
User clicks video → GET /api/videos/:id
                        ↓
                Check authentication (JWT)
                        ↓
                Check subscription status
                        ↓
                GET /api/videos/:id/play
                        ↓
                Generate Mux playback URL
                        ↓
                Return signed URL
                        ↓
                Frontend plays video
                        ↓
                Track progress → PUT /api/videos/:id/progress
```

## Security Layers

### 1. Authentication
- JWT tokens (7-day expiry)
- bcrypt password hashing (10 rounds)
- Token verification on protected routes

### 2. Authorization
- Subscription-based access control
- Plan hierarchy (Basic < Premium)
- Video-level access restrictions

### 3. API Security
- Helmet.js (security headers)
- CORS configuration
- Rate limiting (100 requests/15 min)
- Input validation (Joi)

### 4. Payment Security
- Stripe webhook signature verification
- Never store card details
- PCI compliance through Stripe

## Database Design

### Core Tables

**users**
- id (UUID, PK)
- email (unique)
- password_hash
- stripe_customer_id
- created_at, updated_at

**subscriptions**
- id (UUID, PK)
- user_id (FK)
- stripe_subscription_id
- plan_type (basic/premium)
- status (active/canceled)
- current_period_end

**videos**
- id (UUID, PK)
- title, description
- mux_asset_id, mux_playback_id
- category, required_plan
- status (processing/ready/error)

**watch_history**
- user_id, video_id (composite unique)
- progress (seconds)
- completed (boolean)
- last_watched_at

## Scaling Considerations

### Current Setup (Small Scale)
- Single server for API
- PostgreSQL (single instance)
- Mux handles video scaling
- Stripe handles payment scaling

### Future Scaling Options

**Horizontal Scaling:**
- Load balancer (nginx/AWS ALB)
- Multiple API instances
- Redis for session management
- Message queue for async tasks

**Database Scaling:**
- Read replicas
- Connection pooling (PgBouncer)
- Caching layer (Redis)

**CDN:**
- CloudFlare for static assets
- Mux already provides CDN for videos

## Monitoring & Logging

**Application Logs:**
- Morgan for HTTP logging
- Console logs for debugging
- Error tracking (Sentry recommended)

**Database Monitoring:**
- Query performance
- Connection pool stats
- Slow query log

**Business Metrics:**
- Active subscriptions
- Video view counts
- Payment success/failure rates
- User engagement

## Deployment Architecture

### Development
```
Local Machine
├── PostgreSQL (local)
├── Backend (localhost:5000)
└── Frontend (localhost:3000)
```

### Production
```
Cloud Provider (AWS/Heroku/Railway)
├── Database (RDS/Heroku Postgres)
├── Backend (EC2/Container/Serverless)
├── Frontend (S3 + CloudFront / Vercel)
├── Mux (Video CDN)
└── Stripe (Payments)
```

## API Design Principles

1. **RESTful conventions**: Standard HTTP methods
2. **Consistent responses**: Always return success/error structure
3. **Proper status codes**: 200, 201, 400, 401, 403, 404, 500
4. **Pagination**: For list endpoints
5. **Filtering**: Query parameters for search/filter
6. **Authentication**: Bearer token in headers
7. **Versioning ready**: Easy to add /v1/ prefix

## Android TV Integration Notes

Your Android TV app will:
1. Use the same REST API
2. Implement ExoPlayer for HLS streaming
3. Handle JWT authentication
4. Support subscription checks
5. Use Mux's adaptive streaming

**Key endpoints for Android TV:**
- POST /api/auth/login
- GET /api/videos
- GET /api/videos/:id/play
- PUT /api/videos/:id/progress

## Performance Optimizations

1. **Database indexes** on frequently queried columns
2. **Connection pooling** (20 connections)
3. **Pagination** for large result sets
4. **Lazy loading** for video thumbnails
5. **Caching** headers for static assets
6. **Compression** for API responses
7. **Mux CDN** for video delivery

## Error Handling

**Backend:**
- Try-catch blocks in all controllers
- Centralized error handler
- Detailed logging
- User-friendly error messages

**Frontend:**
- Axios interceptors
- Toast notifications
- Graceful degradation
- Retry logic for failed requests

This architecture is designed to be:
- ✅ Scalable
- ✅ Secure
- ✅ Maintainable
- ✅ Production-ready
- ✅ Easy to extend
