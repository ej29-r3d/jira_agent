require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizationUrl,
  exchangeCodeForToken
} = require('./config/oauth');
const jiraRoutes = require('./routes/jira');

const app = express();
const PORT = process.env.PORT || 3000;

// Validate required environment variables
const requiredEnvVars = [
  'ATLASSIAN_CLIENT_ID',
  'ATLASSIAN_CLIENT_SECRET',
  'CALLBACK_URL',
  'SESSION_SECRET'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
  console.error('Please check your .env file');
  process.exit(1);
}

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// API routes
app.use('/api', jiraRoutes);

/**
 * Root route - Serve landing page
 */
app.get('/', (req, res) => {
  if (req.session.tokens) {
    // Already authenticated, redirect to dashboard
    return res.redirect('/dashboard.html');
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/**
 * GET /auth/login
 * Initiate OAuth 2.0 authorization flow with PKCE
 */
app.get('/auth/login', (req, res) => {
  try {
    // Generate PKCE parameters
    const codeVerifier = generateCodeVerifier();
    const codeChallenge = generateCodeChallenge(codeVerifier);
    const state = generateState();

    // Store PKCE parameters in session
    req.session.oauth = {
      codeVerifier,
      state,
      timestamp: Date.now()
    };

    // Build authorization URL
    const authUrl = buildAuthorizationUrl(
      process.env.ATLASSIAN_CLIENT_ID,
      process.env.CALLBACK_URL,
      state,
      codeChallenge
    );

    console.log('🔐 Initiating OAuth flow...');
    res.redirect(authUrl);
  } catch (error) {
    console.error('OAuth initialization error:', error);
    res.status(500).send('Failed to initiate OAuth flow');
  }
});

/**
 * GET /auth/callback
 * OAuth callback endpoint - Exchange authorization code for tokens
 */
app.get('/auth/callback', async (req, res) => {
  try {
    const { code, state, error, error_description } = req.query;

    // Check for OAuth errors
    if (error) {
      console.error('OAuth error:', error, error_description);
      return res.redirect(`/?error=${encodeURIComponent(error_description || error)}`);
    }

    // Validate required parameters
    if (!code || !state) {
      return res.redirect('/?error=Missing authorization code or state');
    }

    // Validate state parameter (CSRF protection)
    if (!req.session.oauth || req.session.oauth.state !== state) {
      console.error('State mismatch - possible CSRF attack');
      return res.redirect('/?error=Invalid state parameter');
    }

    // Check if OAuth session is too old (5 minutes timeout)
    const sessionAge = Date.now() - req.session.oauth.timestamp;
    if (sessionAge > 5 * 60 * 1000) {
      return res.redirect('/?error=OAuth session expired');
    }

    console.log('🔄 Exchanging authorization code for tokens...');

    // Exchange authorization code for access token
    const tokens = await exchangeCodeForToken(
      code,
      req.session.oauth.codeVerifier,
      process.env.ATLASSIAN_CLIENT_ID,
      process.env.ATLASSIAN_CLIENT_SECRET,
      process.env.CALLBACK_URL
    );

    // Store tokens in session
    req.session.tokens = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      expires_at: Date.now() + (tokens.expires_in * 1000),
      scope: tokens.scope
    };

    // Clear OAuth temporary data
    delete req.session.oauth;

    console.log('✅ Authentication successful!');
    res.redirect('/dashboard.html');
  } catch (error) {
    console.error('OAuth callback error:', error.message);
    res.redirect(`/?error=${encodeURIComponent('Authentication failed')}`);
  }
});

/**
 * GET /auth/status
 * Check authentication status
 */
app.get('/auth/status', (req, res) => {
  const isAuthenticated = !!(req.session.tokens && req.session.tokens.access_token);
  res.json({
    authenticated: isAuthenticated,
    expiresAt: req.session.tokens?.expires_at
  });
});

/**
 * POST /auth/logout
 * Logout and clear session
 */
app.post('/auth/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Logout failed' });
    }
    console.log('👋 User logged out');
    res.json({ success: true });
  });
});

/**
 * GET /health
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * 404 handler
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

/**
 * Global error handler
 */
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 JIRA OAuth POC Server Started');
  console.log('================================');
  console.log(`📍 Server running on: http://localhost:${PORT}`);
  console.log(`🔐 OAuth Client ID: ${process.env.ATLASSIAN_CLIENT_ID.substring(0, 10)}...`);
  console.log(`🔗 Callback URL: ${process.env.CALLBACK_URL}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('');
  console.log('✨ Ready to authenticate with JIRA!');
  console.log(`   Visit: http://localhost:${PORT}`);
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  process.exit(0);
});
