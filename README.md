# AmayAI - Advanced AI Personal Assistant for Google Workspace

## Overview

AmayAI is a sophisticated AI-powered personal assistant specifically designed for Google Workspace users. It automates routine tasks like email triage, intelligent scheduling, and task management using advanced AI capabilities. The application features a stunning neon-themed, cyberpunk-style interface with glassmorphism effects and real-time updates via WebSocket connections.

## Key Features

🚀 **Advanced AI Capabilities**
- **Smart Email Triage**: Automatic email classification and filtering with AI-powered summarization
- **Intelligent Task Creation**: AI analyzes emails and calendar to suggest actionable tasks
- **Proactive Productivity Suggestions**: Context-aware recommendations based on activity patterns
- **Real-time AI Optimization**: Continuous analysis and workflow improvement suggestions

📧 **Email Management**
- Real-time Gmail integration with webhook notifications
- AI-powered email classification (urgent/normal/low/spam)
- Automatic filtering of [CMAC_CATCHALL] emails as requested
- Smart reply suggestions and draft generation
- Email approval workflow for AI-generated responses

📅 **Smart Calendar Integration**
- Google Calendar API integration with FreeBusy queries
- CC-to-schedule functionality for automated meeting booking
- Conflict detection and intelligent time slot suggestions
- Multi-attendee coordination with external participants

✅ **Intelligent Task Management**
- Google Tasks API synchronization
- AI-powered task creation based on email and calendar patterns
- Priority-based organization with visual indicators
- Slack notifications for task reminders and updates
- Real-time task completion tracking

🎨 **Modern Interface**
- Neon-themed cyberpunk design with glassmorphism effects
- Dark mode with bright accent colors (cyan, magenta, yellow, green)
- Real-time WebSocket updates for live dashboard refresh
- Responsive design optimized for desktop and mobile

## Architecture

### Frontend
- **React 18** with TypeScript for type safety
- **Tailwind CSS** with custom neon utilities and glassmorphism
- **Shadcn UI** components customized for dark theme
- **React Query** for API state management and real-time sync
- **Wouter** for lightweight client-side routing
- **WebSocket integration** for real-time updates

### Backend
- **Express.js** server with TypeScript
- **RESTful API** design with `/api` prefix structure
- **WebSocket server** on `/ws` path for real-time communication
- **Modular service architecture** (Google, OpenAI, Slack services)
- **Middleware-based** request logging and error handling

### Data Storage
- **PostgreSQL** database with Drizzle ORM
- **Neon Database** for serverless PostgreSQL hosting
- **Connection pooling** for efficient resource management
- **Zod schemas** for runtime type validation

## Installation & Setup

### Prerequisites
- Node.js 18+ runtime environment
- PostgreSQL database connection
- Google Cloud Platform service account with domain-wide delegation
- OpenAI API key for AI features
- Slack Bot Token for notifications (optional)

### Environment Variables
```bash
# Database
DATABASE_URL=your_postgresql_connection_string

# Google Workspace
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# Slack (optional)
SLACK_BOT_TOKEN=your_slack_bot_token
SLACK_CHANNEL_ID=your_slack_channel_id
```

### Development Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Initialize database: `npm run db:push`
5. Start development server: `npm run dev`

The application will be available at `http://localhost:5000`

## Usage

### Getting Started
1. **Authentication**: Click "Connect Google Workspace" to authenticate
2. **Dashboard**: View real-time stats for emails triaged, tasks completed, meetings scheduled
3. **Email Triage**: AI automatically processes and classifies incoming emails
4. **Task Management**: Click "Tasks Completed" card to access AI-powered task creation
5. **Quick Actions**: Use AI Quick Actions panel for instant productivity boosts

### AI Features

#### Email Triage & Filtering
- Emails are automatically classified by priority and filtered
- [CMAC_CATCHALL] emails are excluded from triage as requested
- AI generates summaries and reply suggestions
- Click "Emails Triaged" card to review and manage processed emails

#### Smart Task Creation
- Click "✨ Generate AI Tasks" to create tasks based on email and calendar analysis
- AI suggests actionable items with priorities and due dates
- Tasks sync automatically with Google Tasks
- Real-time updates show task completion progress

#### Productivity Optimization
- AI continuously analyzes patterns and suggests optimizations
- Real-time monitoring of email, calendar, and task activities
- Proactive suggestions for workflow improvements
- Smart scheduling recommendations for optimal productivity

### Advanced Features

#### WebSocket Real-time Updates
- Live dashboard updates without page refresh
- Instant notifications for new emails, tasks, and suggestions
- Real-time synchronization across all connected devices

#### Slack Integration
- Task reminder notifications via Slack DMs
- Meeting notifications and updates
- Integration with team communication workflows

#### Calendar Optimization
- Automatic conflict detection and resolution
- Smart meeting time suggestions based on attendee availability
- FreeBusy integration for external participant coordination

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth flow
- `GET /auth/google/callback` - Handle OAuth callback
- `GET /api/user/profile` - Get authenticated user profile

### Email Management
- `GET /api/emails/triage` - Get triaged emails
- `POST /api/emails/ai-compose` - Generate AI email drafts
- `POST /api/emails/draft-reply` - Create reply drafts

### Task Management
- `GET /api/tasks` - Get user tasks (synced with Google Tasks)
- `POST /api/tasks/ai-create` - Generate AI-powered tasks
- `PATCH /api/tasks/:id` - Update task status

### Calendar Integration
- `GET /api/calendar/events` - Get calendar events
- `POST /api/calendar/ai-schedule` - AI scheduling optimization
- `POST /api/calendar/meeting` - Create meetings

### AI Features
- `GET /api/suggestions` - Get AI productivity suggestions
- `GET /api/stats` - Get dashboard statistics

## Security & Privacy

- **OAuth 2.0** secure authentication with Google Workspace
- **Environment variable** protection for sensitive credentials
- **Rate limiting** on API endpoints to prevent abuse
- **Data encryption** for sensitive information storage
- **HTTPS/WSS** for all client-server communication

## Deployment

### Production Build
1. Build frontend: `npm run build`
2. Bundle backend: `npm run build:server`
3. Deploy to Replit or any Node.js hosting platform
4. Set production environment variables
5. Run database migrations: `npm run db:push`

The application is optimized for deployment on Replit with automatic scaling and SSL/TLS termination.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is proprietary software designed for Google Workspace productivity enhancement.

## Support

For support and questions, please refer to the documentation or contact the development team.

---

**AmayAI** - Transforming productivity through intelligent automation and AI-powered workspace management.