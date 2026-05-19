# Tradex ⚡

> Self-hosted trading alert automation — get TradingView alerts delivered to your WhatsApp for free.

Tradex monitors your connected Gmail inbox for TradingView alert emails and instantly forwards them to WhatsApp via Twilio. No paid notification services. No middlemen. Just configure your credentials and you're live.

---

## How It Works

1. User signs up / logs in → receives a JWT
2. User connects Gmail → backend redirects to Google OAuth for Gmail read access
3. After OAuth, Gmail tokens are stored securely in MongoDB
4. A poller runs every **30 seconds** → reads latest TradingView alert email → parses it → sends WhatsApp message via Twilio
5. Twilio calls back `/twilio-status` to confirm delivery
6. Dashboard polls `/user/alerts` every 5 seconds to show live alert history

---

## Tech Stack

**Backend**
- Node.js + Express
- MongoDB + Mongoose
- Google OAuth2 + Gmail API
- Twilio WhatsApp
- JWT + bcrypt

**Frontend**
- React + React Router
- Axios + Vite

---

## Prerequisites

Before you begin, make sure you have:

- **Node.js** v20.19+
- **npm** (comes with Node.js)
- **MongoDB** — Atlas (cloud) or local instance
- **Google Cloud project** — OAuth2 credentials + Gmail API enabled
- **Twilio account** — WhatsApp enabled + an approved Content Template (Content SID)
- **TradingView account** — to send alert emails

---

## Environment Variables

Create `backend/.env` using `backend/.env.example` as a starting point.

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `PORT` | ✅ | Port the backend listens on | Default: `3000` |
| `mongodb_uri` | ✅ | MongoDB connection string | MongoDB Atlas or local URI |
| `JWT_USER_SECRET` | ✅ | Secret for signing JWTs | Generate a strong random string |
| `saltRounds` | ✅ | bcrypt salt rounds | Recommended: `10` |
| `GOOGLE_CLIENT_ID` | ✅ | OAuth2 client ID | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | ✅ | OAuth2 client secret | Google Cloud Console → Credentials |
| `GOOGLE_REDIRECT_URI` | ✅ | OAuth2 redirect URI | Must match Google OAuth settings exactly e.g. `http://localhost:3000/user/auth/google/callback` |
| `FRONTEND_URL` | ⬜ | Frontend URL for OAuth redirects | e.g. `http://localhost:5173` |
| `GOOGLE_USER_PASSWORD_PLACEHOLDER` | ⬜ | Placeholder password for OAuth users | Any random string |
| `TWILIO_ACCOUNT_SID` | ✅ | Twilio account SID | Twilio Console |
| `TWILIO_AUTH_TOKEN` | ✅ | Twilio auth token | Twilio Console |
| `TWILIO_CONTENT_SID` | ✅ | Twilio WhatsApp Content Template SID | Twilio Console → Content Editor |
| `TWILIO_STATUS_CALLBACK_URL` | ⬜ | Public URL for Twilio delivery callbacks | Use ngrok locally e.g. `https://<id>.ngrok.app/twilio-status` |
| `VITE_API_BASE_URL` | ⬜ | Backend URL for frontend API calls | Leave empty in dev (Vite proxy handles it) |

---

## Local Setup

### 1 — Clone the repo

```bash
git clone https://github.com/your-username/tradex.git
cd tradex
```

### 2 — Backend setup

```bash
cd backend
npm install
cp .env.example .env   # then fill in your values
npm start
```

### 3 — Frontend setup

```bash
cd ../frontend
npm install
npm run dev
```

### 4 — Open in browser

```
http://localhost:5173
```

---

## Connecting TradingView Alerts

Tradex reads TradingView alerts via **email** (not webhooks).

1. In TradingView, open or create an alert
2. Under **Notifications**, enable **Send Email**
3. Use the same Gmail address you'll connect in the Tradex dashboard
4. Save the alert — TradingView sends alerts from `noreply@tradingview.com`, which is what the poller filters on
5. In the Tradex dashboard, connect that Gmail account and authorise access

> **Need webhooks instead?** Add a `POST /tradingview/webhook` route to the backend and point TradingView webhook alerts at that URL.

---

## Project Structure

```
Tradex/
├── backend/
│   ├── .env.example          # Env variable template
│   ├── server.js             # App entry — Express, MongoDB, poller start
│   ├── middleware/
│   │   └── authuser.js       # JWT auth middleware
│   ├── models/
│   │   ├── alertsdb.js       # Alert schema
│   │   └── userdb.js         # User schema
│   ├── routes/
│   │   └── user.js           # Auth, OAuth, profile, alert routes
│   └── utils/
│       ├── gmailPoller.js    # Gmail polling + alert processing
│       ├── parseAlert.js     # Extracts symbol, price, signal from email
│       └── sendWhatsapp.js   # Twilio WhatsApp send logic
│
└── frontend/
    ├── vite.config.js        # Vite dev server + proxy config
    └── src/
        ├── App.jsx           # Route definitions
        ├── api/
        │   ├── alerts.js     # Alerts API client
        │   ├── auth.js       # Auth + Google connect API client
        │   └── client.js     # Axios instance with JWT handling
        ├── components/
        │   ├── AlertCard.jsx
        │   ├── Navbar.jsx
        │   ├── ProtectedRoute.jsx
        │   └── Spinner.jsx
        └── pages/
            ├── DashboardPage.jsx
            ├── LoginPage.jsx
            └── OAuthCallbackPage.jsx
```

---

## Common Issues

| Issue | Fix |
|---|---|
| `saltRounds` missing | Set it to a number (e.g. `10`) in `.env` — bcrypt will fail without it |
| Google OAuth redirect mismatch | `GOOGLE_REDIRECT_URI` must match your Google Cloud OAuth settings exactly |
| Gmail API not enabled | Enable Gmail API in your Google Cloud project |
| TradingView alerts not appearing | Make sure email notifications are enabled and the correct Gmail is connected |
| Twilio status callbacks failing | `TWILIO_STATUS_CALLBACK_URL` must be a **public** URL — use ngrok for local dev |
| WhatsApp template not working | `TWILIO_CONTENT_SID` must reference an **approved** WhatsApp Content Template |
| Duplicate alerts | Don't run multiple backend instances — the poller runs in-process and will duplicate |
| CORS errors in production | Add CORS middleware if frontend and backend are on different domains |

---

## License

MIT — use it, fork it, self-host it.
