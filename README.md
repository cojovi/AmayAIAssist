# AmayAI - AI Personal Assistant for Google Workspace

![AmayAI Logo](./assets/logo.svg)

AmayAI is a comprehensive AI-powered personal assistant designed specifically for Google Workspace users. It automates routine tasks like email triage, intelligent scheduling, task management, and provides proactive suggestions to boost your productivity. The application features a stunning neon-themed, cyberpunk-style interface with glassmorphism effects and real-time updates.

## 🌟 Key Features

### 📧 Intelligent Email Triage
- **AI-Powered Classification**: Automatically categorizes incoming emails as urgent, normal, low priority, or spam using GPT-4
- **Smart Summarization**: Generates concise summaries of email content for quick review
- **Reply Suggestions**: Creates contextual reply suggestions that require user approval before sending
- **Real-time Processing**: Gmail webhook integration provides instant email processing as they arrive
- **Batch Operations**: Handle multiple emails efficiently with bulk actions

### 📅 Smart Calendar Management
- **CC-to-Schedule**: Automatically detects scheduling requests in emails and creates calendar invites
- **Conflict Detection**: Identifies scheduling conflicts and suggests alternative time slots
- **FreeBusy Integration**: Checks availability across multiple calendars before scheduling
- **Multi-attendee Coordination**: Handles complex scheduling with external participants
- **Meeting Preparation**: Generates agendas and preparation notes for upcoming meetings

### ✅ Advanced Task Management
- **Google Tasks Sync**: Seamlessly integrates with Google Tasks for unified task management
- **Priority-based Organization**: Automatically prioritizes tasks based on deadlines and importance
- **Smart Reminders**: Sends Slack notifications for upcoming deadlines and task reminders
- **Progress Tracking**: Real-time updates on task completion status
- **Context-aware Creation**: Creates tasks from email content and calendar events

### 🤖 AI Suggestion Engine
- **Pattern Recognition**: Learns from your email and calendar patterns to provide proactive suggestions
- **Workflow Optimization**: Recommends ways to streamline your daily routines
- **Contextual Follow-ups**: Suggests follow-up actions based on email threads and meeting outcomes
- **Productivity Insights**: Provides analytics on your productivity patterns and trends

### ⚡ Real-time Dashboard
- **Live Statistics**: Real-time updates on emails processed, meetings scheduled, and tasks completed
- **WebSocket Integration**: Instant updates without page refresh
- **Neon-themed UI**: Stunning cyberpunk aesthetics with glassmorphism effects
- **Dark Mode**: Optimized for extended use with eye-friendly dark theme
- **Responsive Design**: Works seamlessly across desktop and mobile devices

## 🚀 Technology Stack

### Frontend
- **React 18** with TypeScript for modern, type-safe development
- **Tailwind CSS** with custom neon utilities and glassmorphism effects
- **Shadcn UI** components customized for dark theme consistency
- **React Query** for efficient API state management and caching
- **Wouter** for lightweight client-side routing
- **WebSocket** integration for real-time updates

### Backend
- **Express.js** server with TypeScript
- **RESTful API** design with `/api` prefix structure
- **WebSocket server** on `/ws` path for real-time communication
- **Modular service architecture** (Google, OpenAI, Slack services)
- **Comprehensive error handling** and request logging

### Database & Storage
- **PostgreSQL** with Drizzle ORM for type-safe database operations
- **Neon Database** for serverless PostgreSQL hosting
- **Connection pooling** for efficient resource management
- **Zod schemas** for runtime type validation

### External Integrations
- **Google Workspace APIs**: Gmail, Calendar, Tasks, OAuth 2.0
- **OpenAI GPT-4**: Email classification, summarization, and suggestions
- **Slack Web API**: Notifications and reminder scheduling

## 📋 Prerequisites

Before setting up AmayAI, ensure you have the following:

1. **Node.js 18+** installed on your system
2. **PostgreSQL database** (automatically provided by Replit)
3. **Google Cloud Platform** account with Workspace API access
4. **OpenAI API** account with available credits
5. **Slack workspace** with bot permissions

## 🔧 Installation & Setup

### 1. Environment Variables

The following environment variables are required and should be set in Replit Secrets:

```bash
# Database (automatically configured)
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=5432
PGUSER=...
PGPASSWORD=...
PGDATABASE=...

# OpenAI Configuration
OPENAI_API_KEY=sk-...

# Slack Configuration
SLACK_BOT_TOKEN=xoxb-...
SLACK_CHANNEL_ID=C...

# Google Workspace (to be configured)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://your-domain.replit.app/auth/google/callback
```

### 2. Google Cloud Setup

1. **Create a Google Cloud Project**:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the following APIs:
     - Gmail API
     - Google Calendar API
     - Google Tasks API
     - Google+ API (for user info)

2. **Configure OAuth 2.0**:
   - Go to "APIs & Services" > "Credentials"
   - Create OAuth 2.0 Client ID
   - Set authorized redirect URI to: `https://your-domain.replit.app/auth/google/callback`
   - Download the credentials and extract `client_id` and `client_secret`

3. **Set up Domain-wide Delegation** (for enterprise use):
   - Create a service account
   - Enable domain-wide delegation
   - Add the necessary scopes in Google Workspace Admin Console

### 3. OpenAI Setup

1. **Create OpenAI Account**:
   - Visit [OpenAI Platform](https://platform.openai.com/)
   - Create an account or sign in
   - Add billing information to your account

2. **Generate API Key**:
   - Go to "API Keys" section
   - Create a new secret key
   - Copy the key (starts with `sk-`)

### 4. Slack Setup

1. **Create Slack App**:
   - Go to [Slack API](https://api.slack.com/apps)
   - Create a new app for your workspace
   - Choose "From scratch" option

2. **Configure Bot Permissions**:
   - Go to "OAuth & Permissions"
   - Add the following scopes:
     - `chat:write`
     - `channels:read`
     - `users:read`
   - Install the app to your workspace

3. **Get Channel ID**:
   - Right-click on your desired Slack channel
   - Select "Copy link"
   - Extract the channel ID from the URL (format: C084HL619LG)

### 5. Database Setup

The database is automatically configured when you run the application. The schema includes:

- **Users**: User profiles and authentication data
- **Emails**: Processed email metadata and classifications
- **Tasks**: Task management with Google Tasks sync
- **Events**: Calendar events and meeting data
- **Suggestions**: AI-generated suggestions and their status

Run the database migration:
```bash
npm run db:push
```

## 🏃‍♂️ Running the Application

### Development Mode

1. **Start the Application**:
   ```bash
   npm run dev
   ```
   This starts both the Express backend server and Vite frontend development server.

2. **Access the Application**:
   - Open your browser to the Replit URL
   - The application will be available at the root path

### Production Deployment

1. **Build the Application**:
   ```bash
   npm run build
   ```

2. **Start Production Server**:
   ```bash
   npm start
   ```

The application will build the frontend assets and serve them through the Express server.

## 🎨 UI Design & Theming

AmayAI features a distinctive neon-themed, cyberpunk aesthetic with the following design elements:

### Color Palette
- **Primary Neon**: Bright cyan (`#00ffff`) for primary actions and highlights
- **Secondary Neon**: Electric blue (`#0080ff`) for secondary elements
- **Accent Colors**: Pink (`#ff00ff`), Green (`#00ff00`), Orange (`#ff8000`)
- **Dark Background**: Deep space black (`#000011`) with subtle gradients
- **Glass Effects**: Semi-transparent panels with backdrop blur

### Design Principles
- **Glassmorphism**: Translucent cards with blur effects and subtle borders
- **Neon Glows**: CSS box-shadow effects for interactive elements
- **Smooth Animations**: Framer Motion for fluid transitions and micro-interactions
- **Responsive Grid**: CSS Grid and Flexbox for adaptive layouts
- **Typography**: Clean, modern fonts with appropriate contrast ratios

### Custom CSS Classes
```css
.neon-glow { box-shadow: 0 0 20px currentColor; }
.glass-card { backdrop-filter: blur(10px); background: rgba(0,0,0,0.3); }
.neon-border { border: 1px solid; border-image: linear-gradient(45deg, #00ffff, #ff00ff) 1; }
```

## 📡 API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth flow
- `GET /api/auth/google/callback` - Handle OAuth callback
- `POST /api/auth/logout` - Logout user

### User Management
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile
- `GET /api/stats` - Get user statistics

### Email Operations
- `GET /api/emails` - List processed emails
- `POST /api/emails/triage` - Trigger email triage
- `POST /api/emails/reply` - Send AI-generated reply

### Calendar Operations
- `GET /api/calendar/events` - List upcoming events
- `POST /api/calendar/schedule` - Schedule new meeting
- `GET /api/calendar/freebusy` - Check availability

### Task Management
- `GET /api/tasks` - List tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### AI Suggestions
- `GET /api/suggestions` - Get AI suggestions
- `POST /api/suggestions/accept` - Accept suggestion
- `POST /api/suggestions/dismiss` - Dismiss suggestion

## 🔄 WebSocket Events

The application uses WebSocket connections for real-time updates:

### Client → Server Events
```javascript
{
  type: 'subscribe',
  channel: 'user_updates',
  userId: 123
}
```

### Server → Client Events
```javascript
{
  type: 'email_triaged',
  data: { emailId: 'abc123', priority: 'urgent', summary: '...' }
}

{
  type: 'meeting_scheduled',
  data: { eventId: 'evt123', title: 'Team Sync', startTime: '2024-01-15T10:00:00Z' }
}

{
  type: 'task_completed',
  data: { taskId: 'task123', title: 'Review proposal' }
}

{
  type: 'suggestion_generated',
  data: { id: 'sug123', type: 'follow_up', content: '...' }
}
```

## 🔒 Security & Privacy

### Data Protection
- All API keys are encrypted and stored securely in environment variables
- User authentication uses Google OAuth 2.0 with secure token handling
- Database connections use SSL encryption
- Sensitive data is never logged or exposed in client-side code

### Privacy Considerations
- Email content is processed server-side and not stored permanently
- AI processing uses OpenAI's API with data retention policies
- Users maintain full control over their Google Workspace data
- All integrations require explicit user consent

### Security Best Practices
- Input validation using Zod schemas
- SQL injection prevention through parameterized queries
- XSS protection with proper data sanitization
- CORS configuration for secure cross-origin requests
- Rate limiting on API endpoints

## 🐛 Troubleshooting

### Common Issues

1. **"SLACK_BOT_TOKEN environment variable must be set"**
   - Ensure all required API keys are added to Replit Secrets
   - Restart the application after adding secrets

2. **Google OAuth "redirect_uri_mismatch"**
   - Verify the redirect URI in Google Cloud Console matches your Replit domain
   - Check that the protocol (https) is correct

3. **OpenAI API Rate Limits**
   - Monitor your OpenAI usage in the dashboard
   - Consider implementing request queuing for high-volume scenarios

4. **Database Connection Issues**
   - Verify DATABASE_URL is correctly set
   - Check Neon Database status and connection limits

5. **Slack Notifications Not Working**
   - Verify bot permissions in Slack workspace
   - Check channel ID format (should start with 'C')

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
```

This will provide detailed logs for:
- API requests and responses
- Database queries
- WebSocket connections
- Error stack traces

## 🤝 Contributing

We welcome contributions to AmayAI! Please follow these guidelines:

### Development Setup
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and test thoroughly
4. Commit with descriptive messages: `git commit -m 'Add amazing feature'`
5. Push to your branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

### Code Standards
- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write comprehensive tests for new features
- Update documentation for API changes
- Follow the existing architectural patterns

### Testing
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI** for providing the GPT-4 API that powers our AI features
- **Google** for the comprehensive Workspace APIs
- **Slack** for the messaging platform integration
- **Replit** for the development and hosting platform
- **Open Source Community** for the amazing libraries and tools used in this project

## 📞 Support

For support, issues, or feature requests:

1. **Check the Issues**: Look through existing GitHub issues for similar problems
2. **Create an Issue**: Open a new issue with detailed information
3. **Join Discussions**: Participate in community discussions
4. **Documentation**: Refer to this README and the Instructions.txt file

---

**Built with ❤️ for the future of productivity automation**

*AmayAI - Where AI meets elegance in workspace automation*