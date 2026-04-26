# FinTrack — Personal Finance Dashboard

A production-ready full-stack personal finance web app.

## Tech Stack

- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts
- **Backend**: Node.js + Express + Sequelize ORM
- **Database**: PostgreSQL

---

## Prerequisites

Make sure these are installed on your machine:

- [Node.js](https://nodejs.org/) v18+
- [PostgreSQL](https://www.postgresql.org/download/) v14+
- npm v9+

---

## Step 1 — Clone & Install Dependencies

```bash
# Install root dev tools
npm install

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

---

## Step 2 — Setup PostgreSQL Database

```bash
# Create the database (run in terminal)
createdb fintrack

# OR using psql:
psql -U postgres -c "CREATE DATABASE fintrack;"
```

---

## Step 3 — Configure Environment Variables

**Server** — copy and edit:
```bash
cp server/.env.example server/.env
```

Edit `server/.env`:
```
PORT=5000
DATABASE_URL=postgresql://YOUR_PG_USER:YOUR_PG_PASSWORD@localhost:5432/fintrack
JWT_SECRET=change_this_to_a_long_random_string
JWT_EXPIRES_IN=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Client** — copy and edit:
```bash
cp client/.env.example client/.env
```

`client/.env` (default works with Vite proxy):
```
VITE_API_URL=/api
```

---

## Step 4 — Run the App

### Option A — Run both together (from root):
```bash
npm run dev
```

### Option B — Run separately:
```bash
# Terminal 1 — Backend (auto-syncs DB schema on first run)
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

---

## Step 5 — Open in Browser

```
http://localhost:5173
```

Register a new account, add your accounts, and start tracking!

---

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/accounts` | List accounts |
| POST | `/api/accounts` | Create account |
| DELETE | `/api/accounts/:id` | Remove account |
| GET | `/api/transactions` | List transactions (paginated + filtered) |
| POST | `/api/transactions` | Add transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/summary` | Net worth, monthly summary, 6-month trend |
| GET | `/api/goals` | List savings goals |
| POST | `/api/goals` | Create goal |
| PUT | `/api/goals/:id` | Update goal |
| DELETE | `/api/goals/:id` | Delete goal |

---

## Project Structure

```
fintrack/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── api/             # Axios instance
│   │   ├── components/      # Layout, shared UI
│   │   ├── context/         # AuthContext (JWT)
│   │   └── pages/           # Dashboard, Transactions, Accounts, Goals
│   └── vite.config.js
├── server/                  # Express API
│   ├── config/              # DB connection, Sequelize config
│   ├── middleware/          # JWT auth middleware
│   ├── models/              # User, Account, Transaction, Goal
│   ├── routes/              # auth, transactions, accounts, summary, goals
│   └── index.js             # Entry point
├── package.json             # Root scripts (concurrently)
└── README.md
```
