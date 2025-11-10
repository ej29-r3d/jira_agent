# JIRA OAuth POC

A production-ready proof-of-concept web application that demonstrates secure OAuth 2.0 (3LO) authentication with Atlassian JIRA and displays tickets where the user is assigned or reporter.

## Overview

This application showcases best practices for implementing OAuth 2.0 authentication with the Atlassian platform, including:

- **OAuth 2.0 with PKCE** - Enhanced security using Proof Key for Code Exchange
- **Automatic Token Refresh** - Seamless user experience with automatic token renewal
- **JIRA API Integration** - Real-time ticket data from JIRA Cloud
- **Professional UI** - Clean, responsive dashboard with statistics and ticket views
- **Security First** - CSRF protection, secure session management, and no password storage

## Features

### Authentication
- Secure OAuth 2.0 authorization flow with PKCE
- State parameter for CSRF protection
- Automatic access token refresh
- Secure session management
- Clean logout with session cleanup

### Dashboard
- User profile information
- JIRA workspace details
- Ticket statistics (Total Assigned, In Progress, To Do, Reported)
- Comprehensive ticket list with filtering
- Direct links to JIRA issues
- Real-time data refresh

### API Endpoints
- `/api/me` - Get current user information
- `/api/resources` - List accessible JIRA sites
- `/api/my-tickets` - Get tickets where user is assignee or reporter
- `/api/ticket/:key` - Get detailed ticket information
- `/api/stats` - Get ticket statistics
- `/auth/status` - Check authentication status
- `/health` - Health check endpoint

## Service Portal Scraper

The project includes a powerful toolkit for discovering and collecting Atlassian service portal URLs at scale. This is useful for:

- Testing OAuth flows against real public portals
- Building a database of Atlassian service desk examples
- Research and analysis of public Atlassian deployments
- Automated testing and validation

### Features

- **Two scraping methods**: Web scraping (free, no API key) and API-based (fast, reliable)
- **Multiple API providers**: SerpAPI, Google Custom Search, Bing Search API
- **Smart deduplication**: Automatically removes duplicate portals
- **Resume capability**: Continue from where you left off
- **Multiple output formats**: JSON and CSV export
- **Portal classification**: Automatically categorizes portal types

### Quick Start

```bash
# Web scraping (no API key required)
cd scraper
node scrape.js web --max 200

# API scraping (recommended - requires free API key)
node scrape.js api --provider serpapi --key YOUR_KEY --max 500

# Get help
node scrape.js help
```

For detailed documentation, see [scraper/README.md](scraper/README.md).

## Architecture

### Project Structure

```
jira-oauth-poc/
├── server.js              # Express server with OAuth flow
├── config/
│   └── oauth.js          # OAuth configuration and PKCE helpers
├── routes/
│   └── jira.js           # JIRA API routes and middleware
├── public/
│   ├── index.html        # Landing page
│   └── dashboard.html    # Post-authentication dashboard
├── scraper/              # Service portal discovery tools
│   ├── scrape.js         # CLI wrapper for easy usage
│   ├── portal-scraper.js # Web-based scraper
│   ├── api-scraper.js    # API-based scraper
│   ├── README.md         # Scraper documentation
│   └── .env.example      # API configuration template
├── package.json          # Dependencies and scripts
├── .env                  # Environment variables (not in git)
├── .env.example          # Environment template
├── .gitignore           # Git ignore rules
├── README.md            # This file
├── SETUP_INSTRUCTIONS.md # Detailed setup guide
└── TESTING.md           # Testing procedures
```

### Technology Stack

**Backend:**
- Node.js (v14+)
- Express.js - Web framework
- express-session - Session management
- axios - HTTP client for API calls
- dotenv - Environment variable management

**Frontend:**
- Vanilla JavaScript - No framework dependencies
- HTML5 & CSS3 - Modern, responsive design
- Fetch API - For backend communication

**Authentication:**
- OAuth 2.0 with PKCE (RFC 7636)
- Atlassian OAuth endpoints
- JIRA Cloud REST API v3

### OAuth 2.0 Flow Diagram

```
┌─────────┐                                          ┌──────────────┐
│ Browser │                                          │   Server     │
└────┬────┘                                          └──────┬───────┘
     │                                                      │
     │  1. Click "Connect to JIRA"                        │
     ├──────────────────────────────────────────────────> │
     │                                                      │
     │  2. Generate code_verifier & code_challenge        │
     │     Store in session                                │
     │  <──────────────────────────────────────────────────┤
     │                                                      │
     │  3. Redirect to Atlassian OAuth                     │
     │     with code_challenge                             │
     │  <──────────────────────────────────────────────────┤
     │                                                      │
┌────▼─────────────┐
│   Atlassian      │
│  Authorization   │
└────┬─────────────┘
     │
     │  4. User logs in & approves
     │
     │  5. Redirect to callback with code & state
     ├──────────────────────────────────────────────────> │
     │                                                      │
     │  6. Validate state (CSRF protection)                │
     │     Exchange code for token with code_verifier      │
     │     Store tokens in session                         │
     │  <──────────────────────────────────────────────────┤
     │                                                      │
     │  7. Redirect to dashboard                           │
     │  <──────────────────────────────────────────────────┤
     │                                                      │
```

### API Call Flow

```
┌──────────┐          ┌──────────┐          ┌─────────────┐
│Dashboard │          │  Server  │          │   JIRA API  │
└────┬─────┘          └────┬─────┘          └──────┬──────┘
     │                     │                        │
     │  GET /api/my-tickets                         │
     ├──────────────────> │                         │
     │                     │                         │
     │                     │  Check token expiry     │
     │                     ├──────┐                  │
     │                     │      │                  │
     │                     │ <────┘                  │
     │                     │                         │
     │                     │  If expired: refresh    │
     │                     ├──────────────────────> │
     │                     │  POST /oauth/token      │
     │                     │                         │
     │                     │  New access_token       │
     │                     │ <────────────────────── │
     │                     │                         │
     │                     │  GET /search (JQL)      │
     │                     ├──────────────────────> │
     │                     │  Authorization: Bearer  │
     │                     │                         │
     │                     │  Ticket data            │
     │                     │ <────────────────────── │
     │                     │                         │
     │  Ticket list        │                         │
     │ <─────────────────  │                         │
     │                     │                         │
```

## Getting Started

### Prerequisites

- Node.js v14 or higher
- npm v6 or higher
- An Atlassian account with access to JIRA Cloud

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd jira-oauth-poc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure OAuth app**

   Follow the detailed instructions in [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md) to:
   - Create an Atlassian OAuth app
   - Configure callback URLs and permissions
   - Get your Client ID and Client Secret

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your credentials
   ```

5. **Start the application**
   ```bash
   npm start
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

For detailed setup instructions, see [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md).

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `ATLASSIAN_CLIENT_ID` | OAuth Client ID from Atlassian Developer Console | Yes | - |
| `ATLASSIAN_CLIENT_SECRET` | OAuth Client Secret | Yes | - |
| `CALLBACK_URL` | OAuth callback URL (must match OAuth app config) | Yes | `http://localhost:3000/auth/callback` |
| `SESSION_SECRET` | Random string for session encryption | Yes | - |
| `PORT` | Server port | No | 3000 |
| `NODE_ENV` | Environment (development/production) | No | development |

### OAuth Scopes

The application requests the following scopes:

- `read:jira-work` - View issues, projects, and work items
- `read:jira-user` - View user information
- `write:jira-work` - (Optional) Create and update issues
- `offline_access` - Get refresh tokens for persistent access

## Security

### Implemented Security Measures

1. **OAuth 2.0 with PKCE**
   - Prevents authorization code interception attacks
   - Uses SHA-256 for code challenge generation
   - Required for public clients

2. **CSRF Protection**
   - State parameter validated on callback
   - Session-based state verification
   - Time-limited OAuth sessions (5 minutes)

3. **Secure Session Management**
   - HTTP-only cookies
   - Secure flag in production (HTTPS)
   - Session expiration after 24 hours
   - Server-side session storage

4. **No Password Storage**
   - OAuth flow eliminates password handling
   - Tokens stored in server-side sessions
   - Never exposed to frontend

5. **Token Security**
   - Automatic token refresh before expiration
   - Refresh tokens stored securely
   - Token revocation on logout

6. **Environment Security**
   - Secrets in environment variables
   - `.env` excluded from version control
   - Configuration validation on startup

### Security Best Practices for Production

1. **Use HTTPS exclusively**
   ```javascript
   cookie: {
     secure: true,  // HTTPS only
     httpOnly: true,
     sameSite: 'lax'
   }
   ```

2. **Implement rate limiting**
   ```bash
   npm install express-rate-limit
   ```

3. **Use database-backed sessions**
   ```bash
   npm install connect-redis
   ```

4. **Add security headers**
   ```bash
   npm install helmet
   ```

5. **Enable CORS properly**
   ```bash
   npm install cors
   ```

6. **Implement logging**
   ```bash
   npm install winston
   ```

## API Documentation

### Authentication Endpoints

#### GET /auth/login
Initiates OAuth 2.0 authorization flow.

**Response:** Redirect to Atlassian authorization page

---

#### GET /auth/callback
OAuth callback endpoint.

**Query Parameters:**
- `code` - Authorization code
- `state` - CSRF token

**Response:** Redirect to dashboard or error page

---

#### GET /auth/status
Check authentication status.

**Response:**
```json
{
  "authenticated": true,
  "expiresAt": 1234567890123
}
```

---

#### POST /auth/logout
Logout and destroy session.

**Response:**
```json
{
  "success": true
}
```

### JIRA API Endpoints

All endpoints require authentication. Tokens are automatically refreshed if expired.

#### GET /api/me
Get current authenticated user information.

**Response:**
```json
{
  "account_id": "...",
  "name": "John Doe",
  "email": "john@example.com",
  "picture": "https://..."
}
```

---

#### GET /api/resources
Get accessible JIRA cloud instances.

**Response:**
```json
[
  {
    "id": "cloud-id",
    "name": "My JIRA Workspace",
    "url": "https://mycompany.atlassian.net",
    "scopes": ["read:jira-work", "read:jira-user"],
    "avatarUrl": "https://..."
  }
]
```

---

#### GET /api/my-tickets
Get tickets where user is assignee or reporter.

**Response:**
```json
{
  "tickets": [
    {
      "key": "PROJ-123",
      "id": "10001",
      "summary": "Fix login bug",
      "status": "In Progress",
      "statusCategory": "In Progress",
      "priority": "High",
      "assignee": "John Doe",
      "assigneeEmail": "john@example.com",
      "reporter": "Jane Smith",
      "reporterEmail": "jane@example.com",
      "issueType": "Bug",
      "updated": "2024-01-15T10:30:00.000Z",
      "created": "2024-01-10T08:00:00.000Z",
      "url": "https://mycompany.atlassian.net/browse/PROJ-123"
    }
  ],
  "total": 42,
  "cloudId": "cloud-id",
  "siteName": "My JIRA Workspace",
  "siteUrl": "https://mycompany.atlassian.net"
}
```

---

#### GET /api/ticket/:key
Get detailed information about a specific ticket.

**Parameters:**
- `key` - JIRA issue key (e.g., "PROJ-123")

**Response:**
```json
{
  "key": "PROJ-123",
  "summary": "Fix login bug",
  "description": "...",
  "status": "In Progress",
  "priority": "High",
  "assignee": "John Doe",
  "reporter": "Jane Smith",
  "labels": ["bug", "urgent"],
  "comments": 5,
  "url": "https://..."
}
```

---

#### GET /api/stats
Get ticket statistics for current user.

**Response:**
```json
{
  "stats": {
    "totalAssigned": 15,
    "inProgress": 3,
    "toDo": 8,
    "reported": 22,
    "done": 4
  }
}
```

### Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `401` - Not authenticated
- `403` - Forbidden (insufficient permissions)
- `404` - Resource not found
- `429` - Rate limited
- `500` - Server error

## Testing

Comprehensive testing procedures are documented in [TESTING.md](TESTING.md).

### Quick Test

```bash
# Start the server
npm start

# In another terminal, test health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"healthy","timestamp":"...","environment":"development"}
```

### Manual Testing Checklist

- [ ] OAuth flow completes successfully
- [ ] Dashboard displays user information
- [ ] Tickets load correctly
- [ ] Statistics are accurate
- [ ] Token refresh works automatically
- [ ] Logout clears session
- [ ] Error handling works properly

## Troubleshooting

### Common Issues

**Problem:** "Invalid client ID" error

**Solution:**
- Verify `ATLASSIAN_CLIENT_ID` in `.env` matches the Developer Console
- No extra spaces or quotes in `.env`

---

**Problem:** "Redirect URI mismatch"

**Solution:**
- Ensure `CALLBACK_URL` exactly matches what's configured in OAuth app
- Check protocol (http vs https), domain, port, and path

---

**Problem:** No tickets displayed

**Solution:**
- Create test tickets in JIRA
- Assign some to yourself or create as reporter
- Verify JIRA permissions

---

**Problem:** "Token refresh failed"

**Solution:**
- Logout and login again
- Check that `offline_access` scope is enabled
- Verify OAuth app is still active

## Production Deployment

### Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use HTTPS only
- [ ] Implement database-backed sessions (Redis/MongoDB)
- [ ] Add rate limiting
- [ ] Enable security headers (Helmet)
- [ ] Set up logging and monitoring
- [ ] Use secrets management (AWS Secrets Manager, etc.)
- [ ] Update OAuth callback URL to production domain
- [ ] Set `cookie.secure = true`
- [ ] Enable CORS for specific origins only
- [ ] Implement health checks
- [ ] Set up error tracking (Sentry, etc.)

### Environment-Specific Configuration

**Development:**
```env
NODE_ENV=development
CALLBACK_URL=http://localhost:3000/auth/callback
```

**Production:**
```env
NODE_ENV=production
CALLBACK_URL=https://your-domain.com/auth/callback
```

### Recommended Infrastructure

- **Hosting:** AWS (EC2, ECS), Heroku, DigitalOcean
- **Session Store:** Redis (AWS ElastiCache)
- **Secrets Management:** AWS Secrets Manager, HashiCorp Vault
- **Monitoring:** CloudWatch, Datadog, New Relic
- **Error Tracking:** Sentry
- **CI/CD:** GitHub Actions, GitLab CI, CircleCI

## Future Enhancements

### Planned Features

- [ ] Comment on issues directly from the app
- [ ] Create new issues
- [ ] Advanced filtering and search
- [ ] Ticket assignment and status updates
- [ ] Email notifications
- [ ] Export to CSV/PDF
- [ ] Dark mode
- [ ] Mobile app (React Native)
- [ ] Multi-workspace support
- [ ] Custom JQL queries
- [ ] Ticket analytics and insights
- [ ] Webhook integration

### Technical Improvements

- [ ] Add TypeScript
- [ ] Implement unit tests (Jest)
- [ ] Add integration tests (Supertest)
- [ ] E2E tests (Playwright/Cypress)
- [ ] GraphQL API
- [ ] WebSocket for real-time updates
- [ ] Service worker for offline support
- [ ] Docker containerization
- [ ] Kubernetes deployment
- [ ] OpenAPI/Swagger documentation

## Contributing

This is a POC project, but contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Resources

### Official Documentation

- [Atlassian OAuth 2.0 Guide](https://developer.atlassian.com/cloud/jira/platform/oauth-2-3lo-apps/)
- [JIRA Cloud REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/)
- [OAuth 2.0 RFC 6749](https://tools.ietf.org/html/rfc6749)
- [PKCE RFC 7636](https://tools.ietf.org/html/rfc7636)

### Useful Links

- [Atlassian Developer Console](https://developer.atlassian.com/console/myapps/)
- [JIRA Query Language (JQL) Reference](https://support.atlassian.com/jira-service-management-cloud/docs/use-advanced-search-with-jira-query-language-jql/)
- [OAuth 2.0 Playground](https://www.oauth.com/playground/)

## License

MIT License - feel free to use this POC as a foundation for your projects.

## Support

For issues, questions, or suggestions:

1. Check [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)
2. Review [TESTING.md](TESTING.md)
3. Check server and browser console logs
4. Review Atlassian OAuth documentation

## Acknowledgments

- Built with Express.js
- Atlassian JIRA Cloud API
- OAuth 2.0 with PKCE security

---

**Built with ❤️ as a POC for secure JIRA OAuth integration**
