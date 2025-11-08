const express = require('express');
const axios = require('axios');
const { refreshAccessToken, isTokenExpired } = require('../config/oauth');

const router = express.Router();

/**
 * Middleware to ensure user is authenticated
 */
function requireAuth(req, res, next) {
  if (!req.session.tokens || !req.session.tokens.access_token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

/**
 * Middleware to refresh token if expired
 */
async function ensureValidToken(req, res, next) {
  try {
    const { tokens } = req.session;

    if (!tokens) {
      return res.status(401).json({ error: 'No tokens found' });
    }

    // Check if token is expired
    if (isTokenExpired(tokens.expires_at)) {
      console.log('Token expired, refreshing...');

      const newTokens = await refreshAccessToken(
        tokens.refresh_token,
        process.env.ATLASSIAN_CLIENT_ID,
        process.env.ATLASSIAN_CLIENT_SECRET
      );

      // Update session with new tokens
      req.session.tokens = {
        access_token: newTokens.access_token,
        refresh_token: newTokens.refresh_token || tokens.refresh_token,
        expires_in: newTokens.expires_in,
        expires_at: Date.now() + (newTokens.expires_in * 1000)
      };

      console.log('Token refreshed successfully');
    }

    next();
  } catch (error) {
    console.error('Token refresh failed:', error.message);
    // Clear session and require re-authentication
    req.session.destroy();
    return res.status(401).json({ error: 'Token refresh failed, please re-authenticate' });
  }
}

/**
 * Helper function to make authenticated API calls
 */
async function makeAuthenticatedRequest(url, accessToken, options = {}) {
  try {
    const response = await axios({
      url,
      method: options.method || 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        ...options.headers
      },
      params: options.params,
      data: options.data
    });

    return response.data;
  } catch (error) {
    // Handle rate limiting
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'] || 60;
      throw new Error(`Rate limited. Retry after ${retryAfter} seconds`);
    }

    // Handle other errors
    throw new Error(
      error.response?.data?.errorMessages?.[0] ||
      error.response?.data?.message ||
      error.message ||
      'API request failed'
    );
  }
}

/**
 * GET /api/me
 * Get current authenticated user information
 */
router.get('/me', requireAuth, ensureValidToken, async (req, res) => {
  try {
    const userInfo = await makeAuthenticatedRequest(
      'https://api.atlassian.com/me',
      req.session.tokens.access_token
    );

    res.json(userInfo);
  } catch (error) {
    console.error('Get user info error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/resources
 * Get accessible JIRA cloud instances
 */
router.get('/resources', requireAuth, ensureValidToken, async (req, res) => {
  try {
    const resources = await makeAuthenticatedRequest(
      'https://api.atlassian.com/oauth/token/accessible-resources',
      req.session.tokens.access_token
    );

    res.json(resources);
  } catch (error) {
    console.error('Get resources error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/my-tickets
 * Get tickets where the current user is assignee or reporter
 */
router.get('/my-tickets', requireAuth, ensureValidToken, async (req, res) => {
  try {
    // Get cloud resources first
    const resources = await makeAuthenticatedRequest(
      'https://api.atlassian.com/oauth/token/accessible-resources',
      req.session.tokens.access_token
    );

    if (!resources || resources.length === 0) {
      return res.json({ tickets: [], message: 'No JIRA instances accessible' });
    }

    // Use the first cloud instance (can be enhanced to handle multiple)
    const cloudId = resources[0].id;
    const siteUrl = resources[0].url;

    // JQL query to get tickets where user is assignee or reporter
    const jql = '(assignee = currentUser() OR reporter = currentUser()) ORDER BY updated DESC';

    const searchResults = await makeAuthenticatedRequest(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search`,
      req.session.tokens.access_token,
      {
        params: {
          jql: jql,
          maxResults: 50,
          fields: 'summary,status,priority,assignee,reporter,updated,issuetype,created'
        }
      }
    );

    // Enhance tickets with additional info
    const tickets = searchResults.issues.map(issue => ({
      key: issue.key,
      id: issue.id,
      summary: issue.fields.summary,
      status: issue.fields.status.name,
      statusCategory: issue.fields.status.statusCategory.name,
      priority: issue.fields.priority?.name || 'None',
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      assigneeEmail: issue.fields.assignee?.emailAddress,
      reporter: issue.fields.reporter?.displayName || 'Unknown',
      reporterEmail: issue.fields.reporter?.emailAddress,
      issueType: issue.fields.issuetype.name,
      updated: issue.fields.updated,
      created: issue.fields.created,
      url: `${siteUrl}/browse/${issue.key}`
    }));

    res.json({
      tickets,
      total: searchResults.total,
      cloudId,
      siteName: resources[0].name,
      siteUrl
    });
  } catch (error) {
    console.error('Get my tickets error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/ticket/:key
 * Get detailed information about a specific ticket
 */
router.get('/ticket/:key', requireAuth, ensureValidToken, async (req, res) => {
  try {
    const { key } = req.params;

    // Get cloud resources
    const resources = await makeAuthenticatedRequest(
      'https://api.atlassian.com/oauth/token/accessible-resources',
      req.session.tokens.access_token
    );

    if (!resources || resources.length === 0) {
      return res.status(404).json({ error: 'No JIRA instances accessible' });
    }

    const cloudId = resources[0].id;
    const siteUrl = resources[0].url;

    // Get ticket details
    const issue = await makeAuthenticatedRequest(
      `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/issue/${key}`,
      req.session.tokens.access_token
    );

    const ticketDetails = {
      key: issue.key,
      id: issue.id,
      summary: issue.fields.summary,
      description: issue.fields.description,
      status: issue.fields.status.name,
      statusCategory: issue.fields.status.statusCategory.name,
      priority: issue.fields.priority?.name || 'None',
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      assigneeEmail: issue.fields.assignee?.emailAddress,
      reporter: issue.fields.reporter?.displayName || 'Unknown',
      reporterEmail: issue.fields.reporter?.emailAddress,
      issueType: issue.fields.issuetype.name,
      created: issue.fields.created,
      updated: issue.fields.updated,
      url: `${siteUrl}/browse/${issue.key}`,
      labels: issue.fields.labels || [],
      comments: issue.fields.comment?.comments?.length || 0
    };

    res.json(ticketDetails);
  } catch (error) {
    console.error('Get ticket error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stats
 * Get ticket statistics for the current user
 */
router.get('/stats', requireAuth, ensureValidToken, async (req, res) => {
  try {
    // Get cloud resources
    const resources = await makeAuthenticatedRequest(
      'https://api.atlassian.com/oauth/token/accessible-resources',
      req.session.tokens.access_token
    );

    if (!resources || resources.length === 0) {
      return res.json({ stats: {}, message: 'No JIRA instances accessible' });
    }

    const cloudId = resources[0].id;

    // Get various counts using different JQL queries
    const queries = {
      totalAssigned: 'assignee = currentUser()',
      inProgress: 'assignee = currentUser() AND status = "In Progress"',
      toDo: 'assignee = currentUser() AND status = "To Do"',
      reported: 'reporter = currentUser()',
      done: 'assignee = currentUser() AND status = Done'
    };

    const stats = {};

    for (const [key, jql] of Object.entries(queries)) {
      try {
        const result = await makeAuthenticatedRequest(
          `https://api.atlassian.com/ex/jira/${cloudId}/rest/api/3/search`,
          req.session.tokens.access_token,
          {
            params: {
              jql: jql,
              maxResults: 0 // We only need the count
            }
          }
        );
        stats[key] = result.total;
      } catch (error) {
        console.error(`Error getting ${key} count:`, error.message);
        stats[key] = 0;
      }
    }

    res.json({ stats });
  } catch (error) {
    console.error('Get stats error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
