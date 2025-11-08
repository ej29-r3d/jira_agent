# Testing the JIRA OAuth POC

This document provides comprehensive testing instructions for the JIRA OAuth POC application.

## Prerequisites

Before testing, ensure you have:
- ✅ Completed the setup instructions in [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)
- ✅ Configured your Atlassian OAuth app correctly
- ✅ Set up your `.env` file with valid credentials
- ✅ Installed all dependencies with `npm install`

## Starting the Application

1. **Start the server:**
   ```bash
   npm start
   ```

2. **Verify the server is running:**
   You should see output like:
   ```
   🚀 JIRA OAuth POC Server Started
   ================================
   📍 Server running on: http://localhost:3000
   🔐 OAuth Client ID: KFM30b5GNP...
   🔗 Callback URL: http://localhost:3000/auth/callback
   🌍 Environment: development

   ✨ Ready to authenticate with JIRA!
      Visit: http://localhost:3000
   ```

3. **Open your browser:**
   Navigate to http://localhost:3000

## Test Cases

### 1. OAuth Authentication Flow

#### Test 1.1: Initial Landing Page
- [ ] Landing page loads successfully
- [ ] Page displays "JIRA OAuth POC" title
- [ ] Features list is visible
- [ ] "Connect to JIRA" button is present
- [ ] Security note is displayed

**Expected Result:** Clean, professional landing page with all elements visible

#### Test 1.2: Initiate OAuth Flow
- [ ] Click "Connect to JIRA" button
- [ ] Browser redirects to Atlassian login page
- [ ] URL contains correct OAuth parameters (check browser address bar)

**Expected Result:** Redirect to `auth.atlassian.com` with OAuth parameters

**What to verify in the URL:**
- `client_id` parameter is present
- `redirect_uri` matches your callback URL
- `scope` includes required scopes
- `code_challenge` is present (PKCE)
- `state` parameter is present (CSRF protection)

#### Test 1.3: Atlassian Authorization
- [ ] Log in with your Atlassian credentials
- [ ] Authorization screen shows the app name "JIRA Ticket Analyzer POC"
- [ ] Requested permissions are displayed
- [ ] Click "Accept" to grant permissions

**Expected Result:** Successful authorization

#### Test 1.4: OAuth Callback
- [ ] Browser redirects back to `http://localhost:3000/auth/callback`
- [ ] Then automatically redirects to dashboard
- [ ] No error messages appear

**Expected Result:** Successful authentication and redirect to dashboard

**Server logs should show:**
```
🔐 Initiating OAuth flow...
🔄 Exchanging authorization code for tokens...
✅ Authentication successful!
```

### 2. Dashboard Functionality

#### Test 2.1: User Information
- [ ] User name or email is displayed in the header
- [ ] Name matches your Atlassian account

**Expected Result:** Correct user information displayed

#### Test 2.2: JIRA Site Information
- [ ] JIRA workspace name is displayed
- [ ] JIRA workspace URL is shown
- [ ] Information is accurate

**Expected Result:** Connected JIRA instance information is displayed

#### Test 2.3: Statistics Cards
- [ ] All four stat cards are visible:
  - Total Assigned
  - In Progress
  - To Do
  - Reported by Me
- [ ] Numbers load and display correctly
- [ ] Numbers match your actual JIRA data

**Expected Result:** Accurate statistics from your JIRA workspace

#### Test 2.4: Tickets Table
- [ ] Tickets table loads successfully
- [ ] Tickets are displayed with all columns:
  - Key (clickable)
  - Summary
  - Status
  - Priority
  - Role
  - Updated date
- [ ] Tickets shown are ones where you're assigned OR reporter
- [ ] Status badges have appropriate colors
- [ ] Priority badges have appropriate colors

**Expected Result:** Complete list of relevant tickets

#### Test 2.5: Ticket Links
- [ ] Click on a ticket key (e.g., "PROJ-123")
- [ ] Link opens in a new tab
- [ ] Correct JIRA issue page loads

**Expected Result:** Ticket opens in JIRA web interface

#### Test 2.6: Refresh Functionality
- [ ] Click the "🔄 Refresh" button
- [ ] Loading spinner appears
- [ ] Tickets reload successfully
- [ ] Data is up-to-date

**Expected Result:** Data refreshes without errors

### 3. Session Management

#### Test 3.1: Token Persistence
- [ ] Close the browser tab (not the browser)
- [ ] Open a new tab and go to http://localhost:3000
- [ ] You should still be logged in (redirected to dashboard)

**Expected Result:** Session persists across tabs

#### Test 3.2: Page Refresh
- [ ] On the dashboard, refresh the page (F5 or Ctrl+R)
- [ ] Dashboard reloads successfully
- [ ] Data is still accessible

**Expected Result:** No need to re-authenticate

#### Test 3.3: Logout
- [ ] Click "Logout" button in the header
- [ ] Redirected to landing page
- [ ] Try to access /dashboard.html directly
- [ ] Should redirect to landing page

**Expected Result:** Proper session cleanup and logout

### 4. API Endpoints

You can test API endpoints using the browser console or tools like curl.

#### Test 4.1: Check Auth Status
```bash
curl http://localhost:3000/auth/status
```
**Expected (when logged in):**
```json
{
  "authenticated": true,
  "expiresAt": 1234567890123
}
```

#### Test 4.2: Get User Info
```bash
curl http://localhost:3000/api/me \
  -H "Cookie: connect.sid=your-session-cookie"
```
**Expected:** Your Atlassian user information

#### Test 4.3: Get JIRA Resources
```bash
curl http://localhost:3000/api/resources \
  -H "Cookie: connect.sid=your-session-cookie"
```
**Expected:** List of accessible JIRA sites

#### Test 4.4: Get My Tickets
```bash
curl http://localhost:3000/api/my-tickets \
  -H "Cookie: connect.sid=your-session-cookie"
```
**Expected:** Array of tickets where you're assigned or reporter

#### Test 4.5: Health Check
```bash
curl http://localhost:3000/health
```
**Expected:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development"
}
```

### 5. Token Refresh (Advanced)

Testing automatic token refresh requires waiting for token expiration.

#### Test 5.1: Wait for Token Expiration
- [ ] Note the current time
- [ ] Tokens expire after ~3600 seconds (1 hour)
- [ ] Wait until close to expiration
- [ ] Make an API call (e.g., refresh the dashboard)
- [ ] Token should auto-refresh

**Expected Result:** Seamless token refresh without re-authentication

**Server logs should show:**
```
Token expired, refreshing...
Token refreshed successfully
```

**To test faster (for development):**
You can manually shorten the token expiry time in the session for testing purposes.

### 6. Error Handling

#### Test 6.1: Invalid Authentication
- [ ] Clear your session/cookies
- [ ] Try to access http://localhost:3000/api/my-tickets directly
- [ ] Should receive 401 Unauthorized error

**Expected Result:**
```json
{
  "error": "Not authenticated"
}
```

#### Test 6.2: OAuth Error Handling
- [ ] Initiate OAuth flow
- [ ] On Atlassian authorization page, click "Cancel"
- [ ] Should redirect back with error message

**Expected Result:** Error message displayed on landing page

#### Test 6.3: No JIRA Access
- [ ] Log in with an account that has no JIRA access
- [ ] Dashboard should show "No JIRA instances accessible" message

**Expected Result:** Graceful handling of no JIRA access

### 7. Security Testing

#### Test 7.1: CSRF Protection (State Parameter)
- [ ] Initiate OAuth flow
- [ ] Copy the callback URL
- [ ] Try to reuse it (paste in browser)
- [ ] Should fail with "Invalid state parameter" error

**Expected Result:** CSRF attack prevented

#### Test 7.2: PKCE Implementation
- [ ] Check OAuth authorization URL
- [ ] Verify `code_challenge` parameter is present
- [ ] Verify `code_challenge_method=S256`

**Expected Result:** PKCE is properly implemented

#### Test 7.3: Session Security
- [ ] Check that `.env` is in `.gitignore`
- [ ] Verify session secret is not exposed
- [ ] Check that tokens are not visible in frontend

**Expected Result:** Secrets are properly protected

### 8. Responsive Design

#### Test 8.1: Mobile View
- [ ] Open in browser and resize to mobile width (< 768px)
- [ ] Landing page is readable
- [ ] Dashboard is readable
- [ ] Some columns may be hidden on mobile
- [ ] Buttons are clickable

**Expected Result:** Responsive design works on mobile devices

#### Test 8.2: Desktop View
- [ ] Full desktop view shows all columns
- [ ] Stats grid shows 4 columns
- [ ] Table is fully visible

**Expected Result:** Optimal layout on desktop

## Common Issues and Solutions

### Issue: "Missing required environment variables"
**Solution:** Check your `.env` file has all required variables

### Issue: "Invalid client" error
**Solution:** Verify `ATLASSIAN_CLIENT_ID` matches the Developer Console

### Issue: "Redirect URI mismatch"
**Solution:** Ensure callback URL in `.env` matches OAuth app settings exactly

### Issue: Dashboard is empty
**Solution:** Make sure you have JIRA tickets assigned to you or created by you

### Issue: "Rate limited" error
**Solution:** Wait for the specified time (check `Retry-After` in error message)

### Issue: Statistics show 0 for everything
**Solution:**
- Create some test tickets in JIRA
- Assign some tickets to yourself
- Refresh the dashboard

## Performance Testing

### Load Time Benchmarks

Expected load times (on good connection):

- Landing page: < 500ms
- OAuth redirect: < 1s
- Dashboard initial load: 2-4s (includes multiple API calls)
- Ticket refresh: 1-2s
- Statistics load: 1-2s

### API Response Times

- `/auth/status`: < 50ms
- `/api/me`: 200-500ms
- `/api/resources`: 200-500ms
- `/api/my-tickets`: 500ms-2s (depending on ticket count)
- `/api/stats`: 1-3s (multiple JQL queries)

## Test Environment Cleanup

After testing:

1. **To reset the application:**
   ```bash
   # Stop the server (Ctrl+C)
   # Clear session data (automatically cleared on logout)
   ```

2. **To test fresh installation:**
   ```bash
   # Remove node_modules
   rm -rf node_modules

   # Reinstall
   npm install

   # Restart
   npm start
   ```

## Automated Testing (Future Enhancement)

This POC doesn't include automated tests, but here's what you could add:

- Unit tests for OAuth helper functions (Jest)
- Integration tests for API endpoints (Supertest)
- E2E tests for OAuth flow (Playwright/Cypress)
- API mocking for development (MSW)

## Success Criteria

The application passes all tests if:

- ✅ OAuth flow completes without errors
- ✅ User can see their JIRA tickets
- ✅ Statistics display correctly
- ✅ Token refresh works automatically
- ✅ Logout clears session properly
- ✅ Security measures are in place
- ✅ No secrets are exposed
- ✅ UI is responsive and professional

## Reporting Issues

If you encounter issues:

1. Check the server console logs
2. Check browser console (F12) for frontend errors
3. Verify your OAuth app configuration
4. Review the [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)
5. Check environment variables in `.env`

## Next Steps

Once all tests pass:

- ✅ Review the code to understand OAuth flow
- ✅ Explore JIRA API documentation for additional features
- ✅ Consider adding more functionality (comments, issue creation, etc.)
- ✅ Plan for production deployment

For production deployment considerations, see [README.md](README.md).
