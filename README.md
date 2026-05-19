# Tradex

Tradex is a full-stack app that monitors TradingView alert emails in a connected Gmail inbox and delivers the alerts to WhatsApp. It also provides a dashboard to connect Gmail and WhatsApp, authenticate users, and view alert history.

## How it works

1. A user signs up or logs in and receives a JWT from the backend.
2. The frontend stores the JWT in local storage and attaches it to API requests.
3. The user connects a Gmail inbox and WhatsApp number; the backend returns a Google OAuth URL for Gmail read access.
4. After Google OAuth callback, the backend stores Gmail access and refresh tokens in MongoDB and redirects the user back to the frontend.
5. A poller runs every 30 seconds, reads the latest TradingView alert email, parses it, sends a WhatsApp message via Twilio, and writes the alert to MongoDB.
6. Twilio calls back `/twilio-status` to mark messages as delivered.
7. The dashboard polls `/user/alerts` every 5 seconds to show new alerts.

## Tech stack

**Backend**
- Node.js
- Express
- MongoDB with Mongoose
- Google APIs (OAuth2 + Gmail API)
- Twilio WhatsApp
- JWT (jsonwebtoken)
- bcrypt
- dotenv

**Frontend**
- React
- React Router
- Axios
- Vite

## Prerequisites

- Node.js 20.19+ (required by MongoDB and Mongoose dependencies in the lockfile)
- npm (comes with Node.js)
- MongoDB instance (MongoDB Atlas or local MongoDB)
- Google Cloud project with OAuth2 credentials and Gmail API enabled
- Twilio account with WhatsApp enabled and a Content Template (Content SID)
- TradingView account (to send alert emails)

## Environment variables

Create `backend/.env` using `backend/.env.example` as a starting point and add the missing variables listed below.

| Variable | Required | Description | Where to get it |
| --- | --- | --- | --- |
| `PORT` | Yes | Port the backend server listens on. | Choose a port, default is `3000`. |
| `mongodb_uri` | Yes | MongoDB connection string used by Mongoose. | MongoDB Atlas connection string or local MongoDB URI. |
| `JWT_USER_SECRET` | Yes | Secret used to sign and verify JWTs. | Generate a strong random string. |
| `saltRounds` | Yes | bcrypt salt rounds for password hashing. | Choose a number like `10`. |
| `GOOGLE_CLIENT_ID` | Yes | OAuth2 client ID for Google login and Gmail API. | Google Cloud Console -> Credentials. |
| `GOOGLE_CLIENT_SECRET` | Yes | OAuth2 client secret. | Google Cloud Console -> Credentials. |
| `GOOGLE_REDIRECT_URI` | Yes | OAuth2 redirect URI handled by the backend. | Must match Google OAuth settings, e.g. `http://localhost:3000/user/auth/google/callback`. |
| `FRONTEND_URL` | No | Base URL for frontend redirects after OAuth. | Set to frontend URL like `http://localhost:5173` or production URL. |
| `GOOGLE_USER_PASSWORD_PLACEHOLDER` | No | Placeholder password used when creating OAuth users. | Any random string; optional. |
| `TWILIO_ACCOUNT_SID` | Yes | Twilio account SID. | Twilio Console. |
| `TWILIO_AUTH_TOKEN` | Yes | Twilio auth token. | Twilio Console. |
| `TWILIO_CONTENT_SID` | Yes | Twilio Content Template SID for WhatsApp messages. | Twilio Console -> Content Editor. |
| `TWILIO_STATUS_CALLBACK_URL` | No | Public URL Twilio calls for delivery status updates. | Use ngrok or production URL, e.g. `https://<id>.ngrok.app/twilio-status`. |
| `VITE_API_BASE_URL` | No (frontend) | Base URL for API calls in the frontend. | Use backend URL in production; leave empty for Vite proxy in dev. |

## Local setup

1. Clone the repository.
2. Install backend dependencies:
   - `cd backend`
   - `npm install`
3. Configure backend environment variables:
   - Copy `backend/.env.example` to `backend/.env`.
   - Add the missing variables: `saltRounds`, `FRONTEND_URL`, and `GOOGLE_USER_PASSWORD_PLACEHOLDER`.
4. Start the backend server:
   - `npm start`
5. Install frontend dependencies:
   - `cd ../frontend`
   - `npm install`
6. (Optional) Create `frontend/.env` and set `VITE_API_BASE_URL` if the frontend is not served from the same origin as the backend.
7. Start the frontend dev server:
   - `npm run dev`
8. Open `http://localhost:5173` in your browser.

## TradingView alerts (email based)

This codebase reads TradingView alerts from Gmail. There is no TradingView webhook endpoint in the current backend.

To connect TradingView alerts:
1. In TradingView, create or edit an alert.
2. In the alert "Notifications" section, enable **Send Email**.
3. Use the Gmail address you connect inside the Tradex dashboard.
4. Save the alert. TradingView emails are sent from `noreply@tradingview.com`, which is what the poller filters on.
5. In the Tradex dashboard, connect the same Gmail account and authorize Gmail access.

If you need webhooks instead of email, add a new backend route (for example, `POST /tradingview/webhook`) and configure TradingView to send webhook alerts to that URL.

## Project structure

```
Tradex/
  backend/
    .env.example            # Backend env template
    package.json            # Backend scripts and dependencies
    package-lock.json       # Locked backend dependency versions
    server.js               # Express app bootstrap, Mongo connect, poller start
    middleware/
      authuser.js           # JWT auth middleware
    models/
      alertsdb.js           # Alert schema and model
      userdb.js             # User schema and model
    routes/
      user.js               # Auth, Google OAuth, profile, and alert routes
    utils/
      gmailPoller.js        # Gmail polling and alert processing
      parseAlert.js         # Extracts symbol, price, signal from email
      sendWhatsapp.js       # Twilio WhatsApp send logic
  frontend/
    index.html              # Vite HTML entry
    package.json            # Frontend scripts and dependencies
    package-lock.json       # Locked frontend dependency versions
    vite.config.js          # Vite dev server and proxy config
    src/
      App.jsx               # Route definitions
      main.jsx              # React entry point
      styles.css            # Global styles
      api/
        alerts.js           # Alerts API client
        auth.js             # Auth and Google connect API client
        client.js           # Axios instance with JWT handling
      components/
        AlertCard.jsx       # Alert card UI
        Navbar.jsx          # Header and logout
        ProtectedRoute.jsx  # Auth-gated route wrapper
        Spinner.jsx         # Loading indicator
      pages/
        DashboardPage.jsx   # Alerts dashboard and Gmail connect flow
        LoginPage.jsx       # Email/password and Google login
        OAuthCallbackPage.jsx # Handles OAuth redirect
      utils/
        token.js            # Local storage helpers for JWT
    dist/
      index.html            # Production build entry
      assets/
        index-*.js          # Production JS bundle
        index-*.css         # Production CSS bundle
  .gitignore                # Ignores node_modules and .env
```

## Common issues and gotchas

- **Missing `saltRounds`**: bcrypt will fail if this is not set to a valid number.
- **Google OAuth redirect mismatch**: `GOOGLE_REDIRECT_URI` must match the OAuth client settings exactly.
- **Gmail API not enabled**: enable Gmail API in the Google Cloud project, or OAuth will fail.
- **TradingView alerts not appearing**: ensure the alert email is enabled and sent to the Gmail you connected in the dashboard.
- **Twilio status updates not working**: `TWILIO_STATUS_CALLBACK_URL` must be a public URL; localhost will not work.
- **WhatsApp template not approved**: `TWILIO_CONTENT_SID` must reference an approved WhatsApp Content Template.
- **CORS in production**: the backend does not enable CORS; if frontend and backend are on different domains, add CORS middleware.
- **Multiple backend instances**: the Gmail poller runs in-process every 30 seconds; running multiple instances can duplicate alerts.
