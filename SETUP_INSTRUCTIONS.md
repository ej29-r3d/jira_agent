# JIRA OAuth Setup Instructions

This guide will walk you through setting up OAuth 2.0 authentication with Atlassian/JIRA for this POC application.

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)
- An Atlassian/JIRA account with access to at least one JIRA workspace

## Step 1: Create an Atlassian OAuth App

1. **Go to Atlassian Developer Console**
   - Navigate to: https://developer.atlassian.com/console/myapps/
   - Log in with your Atlassian account

2. **Create a New App**
   - Click the "Create" button
   - Select "OAuth 2.0 integration"
   - Give it a name: **"JIRA Ticket Analyzer POC"** (or any name you prefer)
   - Click "Create"

3. **Note Your Credentials**
   - After creation, you'll see your app details
   - Copy the **Client ID** - you'll need this later
   - Copy the **Client Secret** - you'll need this later (click "Show" to reveal it)

## Step 2: Configure OAuth App Settings

### Authorization Callback URL

1. In your app settings, find the "Authorization" section
2. Click "Add" under "Redirect URLs"
3. Add the following callback URLs:
   - **Development**: `http://localhost:3000/auth/callback`
   - **Production** (optional for later): `https://your-domain.com/auth/callback`
4. Click "Save changes"

### Permissions (API Scopes)

1. Find the "Permissions" section
2. Click "Add" to add API scopes
3. Select "Jira API" from the dropdown
4. Add the following scopes:

   **Required Scopes:**
   - `read:jira-work` - View issues, projects, and other work items
   - `read:jira-user` - View user information
   - `offline_access` - Get refresh tokens for long-lived sessions

   **Optional Scopes** (for future enhancements):
   - `write:jira-work` - Create and update issues
   - `read:jira-search` - Advanced search capabilities

5. Click "Save changes"

### App Distribution (Optional)

For this POC, you can leave the app in "Development" mode. It will only be accessible to users in your Atlassian organization.

## Step 3: Configure the Application

### 3.1 Clone/Download the Project

If you haven't already, get the project files.

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Set Up Environment Variables

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Edit the `.env` file** with your credentials:
   ```env
   # Atlassian OAuth Configuration
   ATLASSIAN_CLIENT_ID=your-client-id-from-step-1
   ATLASSIAN_CLIENT_SECRET=your-client-secret-from-step-1

   # Server Configuration
   PORT=3000
   CALLBACK_URL=http://localhost:3000/auth/callback
   SESSION_SECRET=your-random-secret-string-here

   # Environment
   NODE_ENV=development
   ```

3. **Generate a Session Secret:**

   You can generate a secure random string using Node.js:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

   Copy the output and use it as your `SESSION_SECRET`.

### 3.4 Verify Configuration

Double-check that:
- ✅ Your `ATLASSIAN_CLIENT_ID` matches the one in the Atlassian Developer Console
- ✅ Your `ATLASSIAN_CLIENT_SECRET` matches the one in the Atlassian Developer Console
- ✅ Your `CALLBACK_URL` matches one of the URLs you added in the Authorization settings
- ✅ You have a secure random string for `SESSION_SECRET`

## Step 4: Start the Application

```bash
npm start
```

You should see:
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

## Step 5: Test the OAuth Flow

1. Open your browser and go to: http://localhost:3000
2. Click "Connect to JIRA"
3. You'll be redirected to Atlassian's login page
4. Log in with your Atlassian credentials
5. Review and accept the requested permissions
6. You'll be redirected back to the dashboard

## Troubleshooting

### "Invalid Client ID" Error

**Problem:** OAuth flow fails with "invalid_client" error

**Solutions:**
- Verify your `ATLASSIAN_CLIENT_ID` in `.env` matches exactly with the Developer Console
- Make sure there are no extra spaces or quotes in the `.env` file
- Restart the server after changing `.env` values

### "Redirect URI Mismatch" Error

**Problem:** OAuth callback fails with redirect URI error

**Solutions:**
- Ensure `CALLBACK_URL` in `.env` matches exactly with what you configured in the Atlassian Developer Console
- The URL must match exactly, including protocol (http/https), domain, port, and path
- Common mistake: `http://localhost:3000/callback` vs `http://localhost:3000/auth/callback`

### "Insufficient Scope" Error

**Problem:** API calls fail with permission errors

**Solutions:**
- Go back to the Atlassian Developer Console
- Add the required scopes: `read:jira-work`, `read:jira-user`, `offline_access`
- After adding scopes, you may need to re-authorize the app
- Log out from the POC app and log in again

### "No JIRA Instances Accessible" Error

**Problem:** Dashboard shows no JIRA sites

**Solutions:**
- Make sure you have access to at least one JIRA workspace
- Verify the user account has permissions to view issues
- Check that your Atlassian account is linked to a JIRA Cloud instance

### Connection Refused / Cannot Connect

**Problem:** Browser can't connect to localhost:3000

**Solutions:**
- Make sure the server is running (`npm start`)
- Check if another application is using port 3000
- Try a different port by changing `PORT` in `.env`

### Token Expired Errors

**Problem:** API calls fail after some time

**Solutions:**
- The app should automatically refresh tokens
- If it doesn't work, try logging out and logging in again
- Check server logs for token refresh errors

## Security Notes

### For Production Deployment

If you plan to deploy this to production:

1. **Use HTTPS Only**
   - Set `cookie.secure: true` in `server.js`
   - Update callback URL to use `https://`

2. **Secure Environment Variables**
   - Never commit `.env` to version control
   - Use environment variable management (e.g., AWS Secrets Manager, HashiCorp Vault)
   - Rotate secrets regularly

3. **Update Session Configuration**
   - Use a database-backed session store (e.g., Redis, MongoDB)
   - Set appropriate cookie expiration times
   - Enable CSRF protection

4. **App Distribution**
   - Change app status from "Development" to "Production" in Atlassian Developer Console
   - Complete the app verification process if required

## Next Steps

Once you have successfully authenticated:

- ✅ View your JIRA tickets on the dashboard
- ✅ See statistics about your work
- ✅ Click on ticket keys to open them in JIRA
- ✅ Try the auto-refresh functionality

For more information, see [TESTING.md](TESTING.md) and [README.md](README.md).
