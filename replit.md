# replit.md

## Overview

AmayAI is an AI-powered personal assistant web application designed specifically for Google Workspace users. The application automates routine tasks like email triage, scheduling, and task management using advanced AI capabilities. It features a neon-themed, cyberpunk-style interface with glassmorphism effects and real-time updates via WebSocket connections.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **React 18** with TypeScript for type safety and modern component patterns
- **Tailwind CSS** with custom neon utilities and glassmorphism effects for cyberpunk styling
- **Shadcn UI** components customized for dark theme consistency
- **React Query** for API state management, caching, and real-time data synchronization
- **Wouter** for lightweight client-side routing
- **WebSocket integration** for real-time dashboard updates and notifications

### Backend Architecture
- **Express.js** server with TypeScript for robust API development
- **RESTful API design** with clear endpoint structure under `/api` prefix
- **WebSocket server** on `/ws` path for real-time client communication
- **Modular service architecture** separating concerns (Google, OpenAI, Slack services)
- **Middleware-based request logging** and error handling

### Data Storage Solutions
- **PostgreSQL** database with Drizzle ORM for type-safe database operations
- **Neon Database** for serverless PostgreSQL hosting
- **Connection pooling** for efficient database resource management
- **Zod schemas** for runtime type validation and data integrity

## Key Components

### Email Triage System
- **Gmail API integration** with real-time webhook notifications via `users.watch`
- **OpenAI GPT-4 classification** for automated email categorization (urgent/normal/low/spam)
- **AI-powered summarization** and reply suggestion generation
- **User approval workflow** for AI-generated responses before sending

### Smart Calendar Management
- **Google Calendar API** integration with FreeBusy queries for availability checking
- **CC-to-schedule functionality** for automated meeting booking via email
- **Conflict detection and resolution** with intelligent time slot suggestions
- **Multi-attendee coordination** with external participant support

### Task Management
- **Google Tasks API** integration for seamless task synchronization
- **Priority-based organization** with visual indicators and due date tracking
- **Slack notifications** for task reminders and status updates
- **Real-time task completion tracking** with automatic updates

### AI Suggestion Engine
- **Pattern recognition** from email and calendar activity using OpenAI
- **Proactive recommendations** for workflow optimization
- **Contextual follow-up suggestions** based on user behavior patterns
- **Meeting preparation** and agenda generation capabilities

## Data Flow

1. **Authentication Flow**: OAuth 2.0 with Google Workspace using domain-wide delegation
2. **Real-time Processing**: Gmail webhooks → API processing → AI analysis → WebSocket broadcast
3. **User Interaction**: Dashboard → API calls → Database updates → Real-time UI refresh
4. **External Integrations**: Slack notifications triggered by database events and scheduled tasks

## External Dependencies

### Core APIs
- **Google Workspace APIs**: Gmail, Calendar, Tasks, and OAuth 2.0
- **OpenAI GPT-4**: For email classification, summarization, and suggestion generation
- **Slack Web API**: For DM notifications and reminder scheduling

### Infrastructure Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **WebSocket connections**: For real-time dashboard updates and notifications

### Development Tools
- **Drizzle Kit**: Database migrations and schema management
- **Vite**: Frontend build tool with HMR and development server
- **ESBuild**: Backend bundling for production deployment

## Deployment Strategy

### Development Environment
- **Concurrent development servers**: Vite for frontend HMR, Express for backend API
- **Environment variable management** for API keys and database connections
- **TypeScript compilation** with shared schemas between frontend and backend

### Production Build
- **Static asset generation** via Vite build process to `dist/public`
- **Backend bundling** with ESBuild to `dist/index.js` for Node.js execution
- **Database migration handling** via Drizzle Kit push commands
- **Environment-specific configuration** for production vs development modes

### Infrastructure Requirements
- **Node.js 18+** runtime environment
- **PostgreSQL database** connection (provided by Neon)
- **Google Cloud Platform** service account with domain-wide delegation
- **SSL/TLS termination** for WebSocket and HTTPS connections
- **Process management** for long-running server processes and WebSocket connections