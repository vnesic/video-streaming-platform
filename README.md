# Video Streaming Platform

A production-ready video streaming platform with user authentication, subscription management (Stripe), and video hosting (Mux).

## Features

- 🔐 User authentication (JWT-based)
- 💳 Subscription management with Stripe
- 🎥 Video streaming with Mux
- 📊 Watch history and progress tracking
- 🎨 Modern, responsive UI with React and Tailwind CSS
- 📱 Ready for Android TV integration
- 🔒 Secure payment processing
- ⚡ Production-ready architecture

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL
- JWT Authentication
- Stripe (Payment Processing)
- Mux (Video Hosting)
- bcryptjs (Password Hashing)

### Frontend
- React 18
- React Router
- Axios
- React Player (Video Playback)
- Tailwind CSS
- React Hot Toast (Notifications)

## Prerequisites

- Node.js 16+ and npm
- PostgreSQL 12+
- Stripe account
- Mux account

## Installation

### 1. Clone and Setup

```bash
cd video-streaming-platform
```

### 2. Database Setup

```bash
# Create PostgreSQL database
createdb videostreaming

# Or using psql
psql -U postgres
CREATE DATABASE videostreaming;
\q
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

**Configure `.env` file:**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/videostreaming
DB_HOST=localhost
DB_PORT=5432
DB_NAME=videostreaming
DB_USER=your_postgres_user
DB_PASSWORD=your_postgres_password

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_EXPIRES_IN=7d

# Server
PORT=5000
NODE_ENV=development

# Stripe (Get from https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (Create products in Stripe Dashboard)
STRIPE_BASIC_PRICE_ID=price_...
STRIPE_PREMIUM_PRICE_ID=price_...

# Mux (Get from https://dashboard.mux.com/settings/access-tokens)
MUX_TOKEN_ID=...
MUX_TOKEN_SECRET=...
MUX_WEBHOOK_SECRET=...

# Frontend URL
FRONTEND_URL=http://localhost:3000
```

### 4. Run Database Migrations

```bash
npm run migrate
```

### 5. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env
nano .env
```

**Configure frontend `.env`:**

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Stripe Setup

### 1. Create Stripe Account
- Sign up at https://stripe.com
- Get API keys from Dashboard > Developers > API keys

### 2. Create Products and Prices

**In Stripe Dashboard:**

1. Go to Products
2. Create "Basic Plan":
   - Name: Basic Plan
   - Price: $9.99/month
   - Recurring: Monthly
   - Copy the Price ID (starts with `price_`)

3. Create "Premium Plan":
   - Name: Premium Plan  
   - Price: $19.99/month
   - Recurring: Monthly
   - Copy the Price ID

4. Add Price IDs to backend `.env`

### 3. Configure Webhooks

1. Go to Developers > Webhooks
2. Add endpoint: `http://yourdomain.com/api/subscription/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook signing secret to `.env`

## Mux Setup

### 1. Create Mux Account
- Sign up at https://mux.com
- Get access tokens from Settings > Access Tokens

### 2. Configure Webhooks

1. Go to Settings > Webhooks
2. Add endpoint: `http://yourdomain.com/api/videos/webhook/mux`
3. Select events:
   - `video.asset.ready`
   - `video.asset.errored`
4. Copy webhook secret to `.env`

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

Access the application at http://localhost:3000

### Production Mode

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the build folder with a static server
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile (protected)

### Subscriptions
- `GET /api/subscription/plans` - Get available plans
- `POST /api/subscription/checkout` - Create checkout session (protected)
- `GET /api/subscription/current` - Get current subscription (protected)
- `POST /api/subscription/cancel` - Cancel subscription (protected)
- `POST /api/subscription/webhook` - Stripe webhook handler

### Videos
- `GET /api/videos` - Get all videos (protected)
- `GET /api/videos/:id` - Get video details (protected)
- `GET /api/videos/:id/play` - Get playback URL (protected, requires subscription)
- `PUT /api/videos/:id/progress` - Update watch progress (protected)
- `GET /api/videos/history` - Get watch history (protected)
- `POST /api/videos/upload` - Upload video (protected, admin)
- `POST /api/videos/webhook/mux` - Mux webhook handler

## Database Schema

The platform uses PostgreSQL with the following main tables:

- `users` - User accounts
- `subscriptions` - Subscription data
- `videos` - Video metadata
- `watch_history` - User watch progress
- `payment_history` - Payment records
- `categories` - Video categories

See `database/schema.sql` for full schema.

## Android TV Integration

The backend API is ready for Android TV integration. You can use the same authentication and video endpoints from your Android TV app.

**Key considerations for Android TV:**
- Use the same JWT authentication
- Implement video playback using ExoPlayer
- Handle subscription checks on the backend
- Use Mux's HLS URLs for streaming

## Deployment

### Backend Deployment (Heroku/Railway/Render)

1. Set all environment variables
2. Deploy the backend folder
3. Run migrations: `npm run migrate`

### Frontend Deployment (Vercel/Netlify)

1. Build the frontend: `npm run build`
2. Deploy the `build` folder
3. Set environment variables
4. Configure API URL to production backend

### Database (Heroku Postgres/Supabase/Neon)

Use a managed PostgreSQL service for production

### Important Security Notes

- Use strong JWT secrets (32+ characters)
- Enable HTTPS in production
- Set proper CORS origins
- Use Stripe test mode for development
- Never commit `.env` files
- Use signed Mux URLs for production
- Implement rate limiting (already included)

## Project Structure

```
video-streaming-platform/
├── backend/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── subscriptionController.js
│   │   └── videoController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── subscription.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── subscription.js
│   │   └── video.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.js
│   │   └── index.js
│   ├── .env.example
│   └── package.json
└── database/
    ├── schema.sql
    └── migrate.js
```

## Testing

### Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists: `psql -l`

### Stripe Webhook Issues
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:5000/api/subscription/webhook`
- Verify webhook secret in `.env`

### Video Upload Issues
- Check Mux credentials
- Verify video URL is accessible
- Check Mux dashboard for asset status

## Support

For issues or questions:
1. Check the error logs
2. Verify all environment variables are set
3. Ensure all services (Postgres, Stripe, Mux) are properly configured

## License

MIT License - feel free to use this for your own projects!

## Next Steps

1. Set up your Stripe and Mux accounts
2. Configure environment variables
3. Run the migrations
4. Start the servers
5. Register a test user
6. Subscribe to a plan
7. Upload test videos
8. Start building your Android TV app!

Happy streaming! 🎬
