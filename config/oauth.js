const crypto = require('crypto');

/**
 * OAuth 2.0 Configuration and Helper Functions
 * Implements PKCE (Proof Key for Code Exchange) for enhanced security
 */

// OAuth endpoints
const OAUTH_CONFIG = {
  authorizationUrl: 'https://auth.atlassian.com/authorize',
  tokenUrl: 'https://auth.atlassian.com/oauth/token',
  userInfoUrl: 'https://api.atlassian.com/me',
  resourcesUrl: 'https://api.atlassian.com/oauth/token/accessible-resources',
  audience: 'api.atlassian.com',
  scopes: [
    'read:jira-work',
    'read:jira-user',
    'write:jira-work',
    'offline_access'
  ].join(' ')
};

/**
 * Generate a cryptographically secure random string for PKCE code verifier
 * @returns {string} Base64 URL-encoded random string
 */
function generateCodeVerifier() {
  return base64URLEncode(crypto.randomBytes(32));
}

/**
 * Generate code challenge from code verifier using SHA256
 * @param {string} verifier - The code verifier
 * @returns {string} Base64 URL-encoded SHA256 hash
 */
function generateCodeChallenge(verifier) {
  return base64URLEncode(
    crypto.createHash('sha256').update(verifier).digest()
  );
}

/**
 * Generate a random state parameter for CSRF protection
 * @returns {string} Random state string
 */
function generateState() {
  return base64URLEncode(crypto.randomBytes(32));
}

/**
 * Base64 URL encoding (without padding)
 * @param {Buffer} buffer - Buffer to encode
 * @returns {string} Base64 URL-encoded string
 */
function base64URLEncode(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * Build the authorization URL with all required parameters
 * @param {string} clientId - OAuth client ID
 * @param {string} redirectUri - Callback URL
 * @param {string} state - CSRF token
 * @param {string} codeChallenge - PKCE code challenge
 * @returns {string} Complete authorization URL
 */
function buildAuthorizationUrl(clientId, redirectUri, state, codeChallenge) {
  const params = new URLSearchParams({
    audience: OAUTH_CONFIG.audience,
    client_id: clientId,
    scope: OAUTH_CONFIG.scopes,
    redirect_uri: redirectUri,
    response_type: 'code',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'consent'
  });

  return `${OAUTH_CONFIG.authorizationUrl}?${params.toString()}`;
}

/**
 * Exchange authorization code for access token
 * @param {string} code - Authorization code
 * @param {string} codeVerifier - PKCE code verifier
 * @param {string} clientId - OAuth client ID
 * @param {string} clientSecret - OAuth client secret
 * @param {string} redirectUri - Callback URL
 * @returns {Promise<Object>} Token response
 */
async function exchangeCodeForToken(code, codeVerifier, clientId, clientSecret, redirectUri) {
  const axios = require('axios');

  const tokenData = {
    grant_type: 'authorization_code',
    client_id: clientId,
    client_secret: clientSecret,
    code: code,
    redirect_uri: redirectUri,
    code_verifier: codeVerifier
  };

  try {
    const response = await axios.post(
      OAUTH_CONFIG.tokenUrl,
      new URLSearchParams(tokenData).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Token exchange error:', error.response?.data || error.message);
    throw new Error('Failed to exchange authorization code for token');
  }
}

/**
 * Refresh an expired access token
 * @param {string} refreshToken - Refresh token
 * @param {string} clientId - OAuth client ID
 * @param {string} clientSecret - OAuth client secret
 * @returns {Promise<Object>} New token response
 */
async function refreshAccessToken(refreshToken, clientId, clientSecret) {
  const axios = require('axios');

  const tokenData = {
    grant_type: 'refresh_token',
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken
  };

  try {
    const response = await axios.post(
      OAUTH_CONFIG.tokenUrl,
      new URLSearchParams(tokenData).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    return response.data;
  } catch (error) {
    console.error('Token refresh error:', error.response?.data || error.message);
    throw new Error('Failed to refresh access token');
  }
}

/**
 * Check if token is expired or about to expire
 * @param {number} expiresAt - Token expiration timestamp
 * @param {number} bufferSeconds - Safety buffer in seconds (default: 300)
 * @returns {boolean} True if token needs refresh
 */
function isTokenExpired(expiresAt, bufferSeconds = 300) {
  const now = Date.now();
  return expiresAt - (bufferSeconds * 1000) <= now;
}

module.exports = {
  OAUTH_CONFIG,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  buildAuthorizationUrl,
  exchangeCodeForToken,
  refreshAccessToken,
  isTokenExpired
};
