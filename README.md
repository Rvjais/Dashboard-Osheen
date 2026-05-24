# Task Studio - Daily Office Dashboard

A full-stack productivity dashboard with React frontend and Express backend, featuring JWT authentication and Google OAuth.

## Project Structure

```
mydesk-—-daily-office-dashboard/
├── server/                 # Express backend API
│   ├── src/
│   │   ├── config/        # Database configuration
│   │   ├── middleware/    # Auth middleware (JWT, Google OAuth)
│   │   ├── models/        # Sequelize models (User, Task, etc.)
│   │   ├── routes/        # API routes
│   │   └── scripts/       # Database sync scripts
│   ├── package.json
│   └── .env.example
├── client/                 # React frontend
│   ├── src/
│   │   ├── context/      # Auth context provider
│   │   ├── pages/        # Login, Register, Dashboard
│   │   ├── services/     # API service layer
│   │   └── types/        # TypeScript interfaces
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## Setup Instructions

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Google Cloud Console project (for OAuth)

### Server Setup

1. Navigate to server folder:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Edit `.env` with your configuration:
```env
PORT=5000
DATABASE_URL=postgres://postgres:password@localhost:5432/task_studio
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:5173/api/auth/google/callback

CLIENT_URL=http://localhost:5173
```

5. Create PostgreSQL database:
```sql
CREATE DATABASE task_studio;
```

6. Start the server:
```bash
npm run dev
```

The server will automatically sync database tables on startup.

### Client Setup

1. Navigate to client folder:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Add Google OAuth Client ID to your HTML or index.html:
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>
```

4. Start the client:
```bash
npm run dev
```

The client runs on `http://localhost:5173` with API proxy to `http://localhost:5000`.

## Authentication Features

### Email/Password Auth
- Registration with name, email, password
- Login with email and password
- JWT token stored in localStorage
- Token refresh and logout

### Google OAuth
- One-tap Google login
- Link Google account to existing email
- Auto-create account for new users

## API Endpoints

### Auth (`/api/auth`)
- `POST /register` - Register new user
- `POST /login` - Login with email/password
- `GET /google` - Get Google auth URL
- `POST /google/callback` - Handle Google callback
- `GET /me` - Get current user
- `POST /change-password` - Change password
- `POST /logout` - Logout

### Users (`/api/users`)
- `GET /team` - Get team members (admin only)
- `GET /` - Get all users (admin only)
- `POST /team` - Add team member (admin only)
- `PUT /profile` - Update own profile
- `PUT /:id` - Update user (admin only)
- `DELETE /:id` - Delete user (admin only)

### Tasks (`/api/tasks`)
- `GET /` - Get user's tasks
- `POST /` - Create task
- `PUT /:id` - Update task
- `PATCH /:id/toggle` - Toggle done status
- `DELETE /:id` - Delete task

### Tracker (`/api/tracker`)
- `GET /` - Get all tracker items
- `POST /` - Create tracker item
- `PUT /:id` - Update tracker item
- `DELETE /:id` - Delete tracker item

### Meetings (`/api/meetings`)
- `GET /` - Get user's meeting notes
- `POST /` - Create meeting note
- `PUT /:id` - Update meeting note
- `DELETE /:id` - Delete meeting note

### Content (`/api/content`)
- `GET /content` - Get content items
- `POST /content` - Create content item
- `GET /tools` - Get tools
- `POST /tools` - Create custom tool
- `GET /ideas` - Get ideas
- `POST /ideas` - Create idea

## Database Models

- **User** - id, name, email, password, role, avatarColor, mood, capacity, status, googleId
- **TrackerItem** - id, name, date, type, priority, status, deliverable, assigneeId, link, notes
- **Task** - id, title, priority, done, dueDate, userId
- **MeetingNote** - id, title, date, attendees, notes, actionItems, link, userId
- **ContentItem** - id, title, platform, publishDate, stage, link, goal, caption, notes, userId
- **Tool** - id, name, url, icon, category, userId (null for system tools)
- **Idea** - id, text, category, date, userId

## Environment Variables

### Server (.env)
| Variable | Description |
|----------|-------------|
| PORT | Server port (default: 5000) |
| DATABASE_URL | PostgreSQL connection string |
| JWT_SECRET | Secret for JWT signing |
| JWT_EXPIRES_IN | Token expiration (default: 7d) |
| GOOGLE_CLIENT_ID | Google OAuth client ID |
| GOOGLE_CLIENT_SECRET | Google OAuth client secret |
| GOOGLE_REDIRECT_URI | OAuth callback URL |
| CLIENT_URL | Frontend URL for CORS |

## Security

- Passwords hashed with bcrypt (12 rounds)
- JWT tokens with configurable expiration
- Auth middleware protects API routes
- Admin-only routes for team management
- CORS configured for frontend origin

## Development

```bash
# Start both servers
# Terminal 1 - Server
cd server && npm run dev

# Terminal 2 - Client
cd client && npm run dev
```

## Production Build

```bash
# Client
cd client && npm run build

# Server
cd server && npm start
```

## Features

- Dashboard with productivity score
- Daily tracker for deliverables
- Task planner with Pomodoro timer
- Meeting notes management
- Content calendar
- Team management (admin)
- Tools hub with custom links
- AI companion integration ready
- Focus mode with notifications
- Toast notifications