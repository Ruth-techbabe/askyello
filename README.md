# SME Service Marketplace(askyello) Backend

A comprehensive backend API for connecting service providers with customers across Africa. Built with Node.js, Express, MySQL, and powered by AI-driven features.

##  Features

### Core Features
- **User Management**
  - Multi-role authentication (User, Provider, Admin)
  - JWT-based authentication with refresh tokens
  - Google OAuth integration
  - Email verification system
  - OTP verification for service providers

- **Provider Features**
  - Provider registration and profile management
  - Business verification system (email + OTP)
  - Category-based service listings
  - Location-based search with geocoding
  - Rating and review system

- **Review System**
  - AI-powered sentiment analysis (OpenAI integration)
  - Automated review processing with cron jobs
  - Review moderation and approval workflow
  - Multi-criteria rating system

- **Search & Discovery**
  - Advanced search with filters (category, location, rating)
  - Geocoding integration for location services
  - Category-based browsing
  - Pan-African coverage (NULL coordinates for providers without specific locations)

- **Admin Panel**
  - User management
  - Provider verification/rejection
  - Review moderation
  - System analytics

- **AI Chatbot**
  - Registration guidance
  - Service recommendations
  - FAQ handling
  - Powered by OpenAI GPT-4

### Security Features
- Rate limiting on all endpoints
- Helmet.js security headers
- CORS configuration
- Password hashing with bcrypt
- JWT token rotation
- Session management

##  Tech Stack

### Core Technologies
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MySQL 8.0+
- **ORM:** Sequelize
- **Authentication:** JWT, Passport.js
- **Caching:** Redis (optional)

### Key Libraries
- **express** - Web framework
- **sequelize** - ORM for MySQL
- **mysql2** - MySQL driver
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **passport** - Authentication middleware
- **passport-google-oauth20** - Google OAuth strategy
- **nodemailer** - Email service
- **openai** - AI chatbot integration
- **axios** - HTTP client for external APIs
- **node-cron** - Scheduled job processing
- **express-rate-limit** - API rate limiting
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing
- **compression** - Response compression
- **winston** - Logging
- **uuid** - Unique identifiers (v8.3.2 for CommonJS compatibility)

##  Prerequisites

Before you begin, ensure you have:

- **Node.js** v18 or higher
- **npm** or **yarn** package manager
- **MySQL** 8.0 or higher
- **Git** for version control

### Optional Services
- **Redis** (for caching - currently optional)
- **Google Maps API key** (for geocoding)
- **OpenAI API key** (for chatbot)
- **Gmail account** (for email verification)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/Ruth-techbabe/askyello.git
cd askyello
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```bash
# Server Configuration
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sme_marketplace
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_DIALECT=mysql

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Admin Configuration
ADMIN_SECRET_KEY=your_admin_secret_key_here
ADMIN_TOKEN_EXPIRES_IN=8h
ADMIN_REFRESH_TOKEN_EXPIRES_IN=24h
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_DEFAULT_PASSWORD=ChangeThisSecurePassword123!

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/v1/auth/google/callback

# Google Maps API (Optional)
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_gmail_app_password
EMAIL_FROM=noreply@askyello.com

# OpenAI Configuration (Optional)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4-turbo-preview

# Redis Configuration (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# Session Configuration
SESSION_SECRET=your_session_secret_key_here
SESSION_MAX_AGE=86400000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_REVIEW_MAX=5

# File Upload
UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Review System
REVIEW_MIN_TEXT_LENGTH=10
REVIEW_PENDING_HOURS=24
REVIEW_WEIGHT_DETAILED=1.2
REVIEW_WEIGHT_NEUTRAL=1.0
REVIEW_WEIGHT_NEW_USER=0.8

# OTP Configuration
OTP_EXPIRY_HOURS=24
PASSWORD_REQUIRE_UPPERCASE=true
PASSWORD_REQUIRE_LOWERCASE=true
PASSWORD_REQUIRE_NUMBERS=true
PASSWORD_REQUIRE_SPECIAL=true
PASSWORD_MIN_LENGTH=8

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=logs/app.log
```

### 4. Generate Secret Keys

Generate secure secret keys for JWT and sessions:

```bash
# Run this command 3 times to generate different keys
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Use the generated strings for:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ADMIN_SECRET_KEY`
- `SESSION_SECRET`

### 5. Database Setup

#### Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE sme_marketplace CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### Run Migrations

```bash
# Sequelize will auto-create tables in development mode
npm run dev
```

#### Seed Initial Data

```bash
npm run seed
```

This will populate:
- Service categories (Plumbing, Electrical, Carpentry, etc.)
- Initial data structures

#### Create Admin Account

```bash
npm run create-admin
```

**Default Admin Credentials:**
- Email: `admin@yourdomain.com` (from .env)
- Password: `ChangeThisSecurePassword123!` (from .env)

**IMPORTANT:** Change these credentials immediately after first login!

##  Running the Application

### Development Mode

```bash
npm run dev
```

Server will start on `http://localhost:3000` (or your configured PORT)

### Production Mode

```bash
npm start
```

### Available Scripts

```bash
npm run dev          # Start development server with nodemon
npm start           # Start production server
npm run seed        # Seed database with initial data
npm run create-admin # Create admin account
npm test            # Run tests (if configured)
npm run lint        # Run ESLint (if configured)
```

## Project Structure

```
askyello/
├── src/
│   ├── config/             # Configuration files
│   │   ├── database.js     # Sequelize database configuration
│   │   ├── passport.js     # Passport authentication strategies
│   │   └── redis.js        # Redis configuration (optional)
│   │
│   ├── controllers/        # Route controllers
│   │   ├── admin.controller.js
│   │   ├── auth.controller.js
│   │   ├── chatbot.controller.js
│   │   ├── provider.controller.js
│   │   ├── review.controller.js
│   │   └── search.controller.js
│   │
│   ├── middleware/         # Express middleware
│   │   ├── auth.middleware.js
│   │   ├── errorHandler.middleware.js
│   │   ├── rateLimit.middleware.js
│   │   └── validation.middleware.js
│   │
│   ├── models/            # Sequelize models
│   │   ├── User.model.js
│   │   ├── Provider.model.js
│   │   ├── Review.model.js
│   │   └── Category.model.js
│   │
│   ├── routes/            # API routes
│   │   ├── admin.routes.js
│   │   ├── auth.routes.js
│   │   ├── chatbot.routes.js
│   │   ├── provider.routes.js
│   │   ├── review.routes.js
│   │   └── search.routes.js
│   │
│   ├── services/          # Business logic
│   │   ├── auth.service.js
│   │   ├── email.service.js
│   │   ├── geolocation.service.js
│   │   ├── openai.service.js
│   │   └── reviewAnalysis.service.js
│   │
│   ├── jobs/              # Scheduled jobs
│   │   └── reviewProcessing.job.js
│   │
│   ├── utils/             # Utility functions
│   │   ├── logger.js
│   │   ├── validators.js
│   │   └── helpers.js
│   │
│   ├── scripts/           # Database scripts
│   │   ├── seed.js
│   │   └── create-admin.js
│   │
│   ├── app.js             # Express app configuration
│   └── server.js          # Server entry point
│
├── logs/                  # Application logs
├── uploads/               # File uploads (gitignored)
├── .env                   # Environment variables (gitignored)
├── .env.example           # Environment template
├── .gitignore            # Git ignore rules
├── package.json          # Dependencies and scripts
└── README.md            # This file
```

##  API Documentation

### Base URL

```
Development: http://localhost:3000/api/v1
Production:  https://your-domain.com/api/v1
```

### Authentication

Most endpoints require authentication. Include JWT token in header:

```
Authorization: Bearer <your_jwt_token>
```

### Main Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/register-provider` - Register service provider
- `POST /auth/login` - Login
- `POST /auth/refresh` - Refresh JWT token
- `GET /auth/google` - Google OAuth login
- `POST /auth/verify-email` - Verify email address
- `POST /auth/verify-otp` - Verify provider OTP

#### Providers
- `GET /providers` - List all providers
- `GET /providers/:id` - Get provider details
- `PUT /providers/:id` - Update provider profile
- `GET /providers/:id/reviews` - Get provider reviews

#### Search
- `GET /search/providers` - Search providers with filters
- `GET /search/categories` - Get all service categories

#### Reviews
- `POST /reviews` - Submit a review
- `GET /reviews/:id` - Get review details
- `PUT /reviews/:id` - Update review
- `DELETE /reviews/:id` - Delete review

#### Admin
- `GET /admin/users` - List all users
- `GET /admin/providers/pending` - Get pending verifications
- `PUT /admin/providers/:id/verify` - Verify provider
- `PUT /admin/providers/:id/reject` - Reject provider

#### Chatbot
- `POST /chatbot` - Send message to AI chatbot



##  Troubleshooting

### Common Issues

#### Database Connection Failed
```bash
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution:** 
- Ensure MySQL is running
- Check DB_HOST, DB_PORT, DB_USER, DB_PASSWORD in .env
- For Railway: Use private connection (mysql.railway.internal)

#### UUID Module Error
```bash
Error: require() of ES Module uuid not supported
```
**Solution:** 
- This project uses uuid v8.3.2 for CommonJS compatibility
- Don't upgrade to uuid v9+

#### Port Already in Use
```bash
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution:**
```bash
# Find and kill process using port
lsof -ti:3000 | xargs kill -9
```

#### Session/CORS Errors in Production
**Solution:**
- Ensure `SESSION_SECRET` is set in production
- Update `FRONTEND_URL` to match your deployed frontend
- Check CORS configuration in `src/app.js`

#### Email Sending Fails
**Solution:**
- Use Gmail App Password, not regular password
- Enable "Less secure app access" (if applicable)
- Check EMAIL_USER and EMAIL_PASSWORD in .env



##  Testing

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2026-02-24T10:00:00.000Z"
}



