const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const passport = require('./config/passport');
const { apiLimiter } = require('./middleware/rateLimit.middleware');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler.middleware');


const authRoutes = require('./routes/auth.routes');
const providerRoutes = require('./routes/provider.routes');
const reviewRoutes = require('./routes/review.routes');
const searchRoutes = require('./routes/search.routes');
const chatbotRoutes = require('./routes/chatbot.routes');
const adminRoutes = require('./routes/admin.routes'); 




const app = express();

//  CORS Configuration - Allows both local dev and production frontend
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL,           // Production frontend (when deployed)
      'http://localhost:5173',            // Local frontend development
      'http://127.0.0.1:5173',       
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, Postman, server-to-server)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));


app.use(helmet());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression());

app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000'),
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

app.use(apiLimiter);

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

const API_PREFIX = `/api/${process.env.API_VERSION || 'v1'}`;

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/providers`, providerRoutes);
app.use(`${API_PREFIX}/reviews`, reviewRoutes);
app.use(`${API_PREFIX}/search`, searchRoutes);
app.use(`${API_PREFIX}/chatbot`, chatbotRoutes);
app.use(`${API_PREFIX}/admin`, adminRoutes); 

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
