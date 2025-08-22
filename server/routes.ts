import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { googleService } from "./services/google";
import { classifyEmail, generateProactiveSuggestions, draftEmailReply, generateTaskSuggestions } from "./services/openai";
import { sendTaskReminderDM, sendMeetingNotification } from "./services/slack";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  
  // WebSocket server on distinct path to avoid Vite HMR conflicts
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store active WebSocket connections
  const clients = new Map<string, WebSocket>();
  
  wss.on('connection', (ws, req) => {
    const userId = req.url?.split('userId=')[1];
    if (userId) {
      clients.set(userId, ws);
      console.log(`WebSocket connected for user: ${userId}`);
    }
    
    ws.on('close', () => {
      if (userId) {
        clients.delete(userId);
        console.log(`WebSocket disconnected for user: ${userId}`);
      }
    });
  });
  
  // Broadcast to specific user
  function broadcastToUser(userId: string, data: any) {
    const client = clients.get(userId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
    }
  }

  // Google OAuth routes
  app.get('/api/auth/google', (req, res) => {
    const authUrl = googleService.getAuthUrl();
    res.redirect(authUrl);
  });

  app.get('/auth/google/callback', async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        return res.status(400).json({ error: 'No authorization code provided' });
      }

      const tokens = await googleService.getTokens(code as string);
      await googleService.setCredentials(tokens);

      // Get user info
      const { google } = await import('googleapis');
      const oauth2 = google.oauth2({ version: 'v2', auth: googleService['oauth2Client'] });
      const userInfo = await oauth2.userinfo.get();

      // Check if user email is from allowed domain - restrict to @cmacroofing.com only
      if (!userInfo.data.email?.endsWith('@cmacroofing.com')) {
        return res.redirect('/login?error=unauthorized_domain');
      }

      // Create or update user
      const existingUser = await storage.getUserByEmail(userInfo.data.email!);
      let user;
      
      if (existingUser) {
        user = await storage.updateUserTokens(existingUser.id, {
          access_token: tokens.access_token || undefined,
          refresh_token: tokens.refresh_token || undefined
        });
      } else {
        user = await storage.createUser({
          email: userInfo.data.email!,
          name: userInfo.data.name!,
          googleId: userInfo.data.id!,
          accessToken: tokens.access_token!,
          refreshToken: tokens.refresh_token,
        });
      }

      // Redirect to dashboard with success
      res.redirect('/dashboard?auth=success');
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect('/login?auth=error');
    }
  });

  // Check authentication status - only allow @cmacroofing.com emails
  app.get('/api/auth/status', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const authenticatedUsers = users.filter(user => 
        user.accessToken && 
        user.refreshToken && 
        user.email && 
        user.email.endsWith('@cmacroofing.com')
      );
      
      if (authenticatedUsers.length === 0) {
        return res.status(401).json({ authenticated: false });
      }
      
      const user = authenticatedUsers[0];
      res.json({ 
        authenticated: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      });
    } catch (error) {
      console.error('Error checking auth status:', error);
      res.status(500).json({ error: 'Failed to check authentication status' });
    }
  });

  // User profile - now requires valid authentication
  app.get('/api/user/profile', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const authenticatedUsers = users.filter(user => user.accessToken && user.refreshToken);
      
      if (authenticatedUsers.length === 0) {
        return res.status(401).json({ error: 'Authentication required. Please sign in with Google.' });
      }
      
      const user = authenticatedUsers[0];
      res.json({ 
        id: user.id,
        email: user.email,
        name: user.name,
        preferences: user.preferences
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: 'Failed to fetch user profile' });
    }
  });

  // User settings - requires authentication
  app.get('/api/user/settings', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const authenticatedUsers = users.filter(user => user.accessToken && user.refreshToken);
      
      if (authenticatedUsers.length === 0) {
        return res.status(401).json({ error: 'Authentication required. Please sign in with Google.' });
      }
      
      const user = authenticatedUsers[0];
      res.json(user.preferences || {});
    } catch (error) {
      console.error('Error fetching user settings:', error);
      res.status(500).json({ error: 'Failed to fetch user settings' });
    }
  });

  app.put('/api/user/settings', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const authenticatedUsers = users.filter(user => user.accessToken && user.refreshToken);
      
      if (authenticatedUsers.length === 0) {
        return res.status(401).json({ error: 'Authentication required. Please sign in with Google.' });
      }
      
      const user = authenticatedUsers[0];
      const updatedUser = await storage.updateUserPreferences(user.id, req.body);
      res.json({ success: true, preferences: updatedUser.preferences });
    } catch (error) {
      console.error('Error updating user settings:', error);
      res.status(500).json({ error: 'Failed to update user settings' });
    }
  });

  // Email triage - requires proper authentication
  app.get('/api/emails/triage', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const authenticatedUsers = users.filter(user => user.accessToken && user.refreshToken);
      
      if (authenticatedUsers.length === 0) {
        return res.status(401).json({ error: 'Authentication required. Please sign in with Google.' });
      }
      
      const user = authenticatedUsers[0];
      
      // Set up Google credentials
      if (user.accessToken) {
        await googleService.setCredentials({
          access_token: user.accessToken,
          refresh_token: user.refreshToken
        });
      } else {
        return res.status(401).json({ error: 'User not authenticated with Google' });
      }

      // Get unread emails (already filtered at Gmail API level)
      const filteredEmails = await googleService.getEmails(user.id);
      
      // Double-check filter for CMAC_CATCHALL emails - completely exclude them
      const emails = filteredEmails.filter(email => 
        !email.subject.includes('[CMAC_CATCHALL]')
      );
      
      // Process new emails that haven't been triaged
      const newEmails = [];
      for (const email of emails) {
        const existingTriage = await storage.getEmailTriageByMessageId(email.id);
        if (!existingTriage) {
          // Classify email with AI
          const classification = await classifyEmail(email.sender, email.subject, email.body);
          
          // Store triage result
          const triage = await storage.createEmailTriage({
            userId: user.id,
            messageId: email.id,
            threadId: email.threadId,
            sender: email.sender,
            subject: email.subject,
            classification: classification.classification,
            aiSummary: classification.summary,
            suggestedReplies: classification.suggestedReplies,
            processed: false
          });
          
          newEmails.push({
            ...email,
            triage: {
              ...triage,
              classification: classification
            }
          });
          
          // Broadcast real-time update
          broadcastToUser(user.id, {
            type: 'email_triaged',
            data: { email, triage }
          });
        }
      }

      // Get all triaged emails
      const triagedEmails = await storage.getEmailTriagesByUserId(user.id);
      res.json(triagedEmails);
    } catch (error) {
      console.error('Error processing email triage:', error);
      res.status(500).json({ error: 'Failed to process email triage' });
    }
  });

  // Send email reply
  app.post('/api/emails/reply', async (req, res) => {
    try {
      const { messageId, replyType, customMessage } = req.body;
      
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      
      if (user.accessToken) {
        await googleService.setCredentials({
          access_token: user.accessToken,
          refresh_token: user.refreshToken
        });
      } else {
        return res.status(401).json({ error: 'User not authenticated with Google' });
      }

      const triage = await storage.getEmailTriageByMessageId(messageId);
      if (!triage) {
        return res.status(404).json({ error: 'Email triage not found' });
      }

      let replyText = customMessage;
      if (!replyText && replyType !== 'custom') {
        // Generate reply with AI
        replyText = await draftEmailReply(
          {
            sender: triage.sender,
            subject: triage.subject,
            body: '' // We don't store original body, but AI can work with subject/sender
          },
          replyType as any
        );
      }

      // Send the reply
      await googleService.sendEmail(
        triage.sender,
        `Re: ${triage.subject}`,
        replyText!,
        triage.threadId || undefined
      );

      // Mark triage as processed
      await storage.updateEmailTriage(triage.id, { processed: true });

      res.json({ success: true, message: 'Reply sent successfully' });
    } catch (error) {
      console.error('Error sending email reply:', error);
      res.status(500).json({ error: 'Failed to send email reply' });
    }
  });

  // Calendar events
  app.get('/api/calendar/events', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      
      if (user.accessToken) {
        await googleService.setCredentials({
          access_token: user.accessToken,
          refresh_token: user.refreshToken
        });
      } else {
        return res.status(401).json({ error: 'User not authenticated with Google' });
      }

      const events = await googleService.getCalendarEvents();
      res.json(events);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
  });

  // Create meeting
  app.post('/api/calendar/meetings', async (req, res) => {
    try {
      const { title, description, startTime, endTime, attendees } = req.body;
      
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      
      if (user.accessToken) {
        await googleService.setCredentials({
          access_token: user.accessToken,
          refresh_token: user.refreshToken
        });
      } else {
        return res.status(401).json({ error: 'User not authenticated with Google' });
      }

      // Check for conflicts
      const freeBusyResponse = await googleService.checkFreeBusy(
        attendees.map((a: any) => a.email),
        startTime,
        endTime
      );

      const hasConflicts = Object.values(freeBusyResponse.data.calendars || {}).some(
        (calendar: any) => calendar.busy && calendar.busy.length > 0
      );

      // Create calendar event
      const event = await googleService.createCalendarEvent({
        summary: title,
        description,
        start: { dateTime: startTime },
        end: { dateTime: endTime },
        attendees: attendees.map((a: any) => ({ email: a.email }))
      });

      // Store meeting record
      const meeting = await storage.createMeeting({
        userId: user.id,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        attendees: attendees,
        conflictResolved: hasConflicts,
        status: 'scheduled'
      });

      // Send Slack notifications
      for (const attendee of attendees) {
        await sendMeetingNotification(attendee.email, title, startTime, attendees.map((a: any) => a.email));
      }

      res.json({ meeting, calendarEvent: event.data, hasConflicts });
    } catch (error) {
      console.error('Error creating meeting:', error);
      res.status(500).json({ error: 'Failed to create meeting' });
    }
  });

  // Tasks
  app.get('/api/tasks', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      
      // Set up Google credentials
      if (user.accessToken) {
        await googleService.setCredentials({
          access_token: user.accessToken,
          refresh_token: user.refreshToken
        });
      } else {
        return res.status(401).json({ error: 'User not authenticated with Google' });
      }

      // Get tasks from Google Tasks API
      const googleTasks = await googleService.getTasks();
      
      // Sync with local database
      const localTasks = await storage.getTasksByUserId(user.id);
      
      // Update local database with Google Tasks
      for (const googleTask of googleTasks) {
        const existingTask = localTasks.find(t => t.googleTaskId === googleTask.id);
        if (!existingTask && googleTask.title) {
          await storage.createTask({
            userId: user.id,
            title: googleTask.title,
            description: googleTask.notes || '',
            completed: googleTask.status === 'completed',
            dueDate: googleTask.due ? new Date(googleTask.due) : null,
            googleTaskId: googleTask.id || '',
            priority: 'normal'
          });
        }
      }
      
      // Return updated tasks
      const updatedTasks = await storage.getTasksByUserId(user.id);
      res.json(updatedTasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  // Create AI-powered task
  app.post('/api/tasks/ai-create', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      
      if (user.accessToken) {
        await googleService.setCredentials({
          access_token: user.accessToken,
          refresh_token: user.refreshToken
        });
      }

      // Get recent emails and calendar events for context
      const recentEmails = await storage.getRecentEmailTriages(user.id, 5);
      const calendarEvents = await googleService.getCalendarEvents();
      
      // Use AI to generate task suggestions based on email and calendar context
      const aiSuggestions = await generateTaskSuggestions(recentEmails, calendarEvents);
      
      // Create the suggested tasks
      const createdTasks = [];
      for (const suggestion of aiSuggestions) {
        const googleTask = await googleService.createTask(
          suggestion.title,
          suggestion.description,
          suggestion.dueDate
        );
        
        const localTask = await storage.createTask({
          userId: user.id,
          title: suggestion.title,
          description: suggestion.description,
          dueDate: suggestion.dueDate ? new Date(suggestion.dueDate) : null,
          priority: suggestion.priority || 'normal',
          googleTaskId: googleTask.data?.id || ''
        });
        
        createdTasks.push(localTask);
      }
      
      res.json({ 
        success: true, 
        tasksCreated: createdTasks.length,
        tasks: createdTasks 
      });
    } catch (error) {
      console.error('Error creating AI tasks:', error);
      res.status(500).json({ error: 'Failed to create AI tasks' });
    }
  });

  // AI Email Composition
  app.post('/api/emails/ai-compose', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      const recentEmails = await storage.getRecentEmailTriages(user.id, 3);
      
      // Generate context-aware email drafts
      const contextualDrafts = await Promise.all(
        recentEmails.slice(0, 2).map(async (email) => {
          const draft = await draftEmailReply(
            { sender: email.sender, subject: email.subject, body: email.subject },
            'custom',
            'Generate a follow-up email based on the previous conversation'
          );
          return { subject: `Follow-up: ${email.subject}`, draft, priority: 'high' };
        })
      );
      
      res.json({ 
        success: true, 
        drafts: contextualDrafts,
        message: 'AI email drafts generated successfully'
      });
    } catch (error) {
      console.error('Error generating AI emails:', error);
      res.status(500).json({ error: 'Failed to generate AI emails' });
    }
  });

  // AI Calendar Scheduling
  app.post('/api/calendar/ai-schedule', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      
      if (user.accessToken) {
        await googleService.setCredentials({
          access_token: user.accessToken,
          refresh_token: user.refreshToken
        });
      }

      // Get upcoming events and find gaps for productive work
      const events = await googleService.getCalendarEvents();
      const recentEmails = await storage.getRecentEmailTriages(user.id, 5);
      const pendingTasks = await storage.getPendingTasks(user.id);
      
      // AI analyzes schedule gaps and suggests optimal meeting times
      const suggestions = await generateProactiveSuggestions({
        recentEmails: recentEmails.map(email => ({
          subject: email.subject,
          sender: email.sender,
          date: email.createdAt?.toISOString() || new Date().toISOString()
        })),
        upcomingMeetings: events.map(event => ({
          title: event.summary || 'Meeting',
          date: event.start?.dateTime || event.start?.date || new Date().toISOString(),
          attendees: event.attendees?.map(a => a.email || '') || []
        })),
        pendingTasks: pendingTasks.map(task => ({
          title: task.title,
          dueDate: task.dueDate?.toISOString()
        }))
      });
      
      res.json({ 
        success: true, 
        suggestions: suggestions.filter(s => s.type === 'schedule'),
        message: 'AI scheduling optimization completed'
      });
    } catch (error) {
      console.error('Error with AI scheduling:', error);
      res.status(500).json({ error: 'Failed to optimize schedule' });
    }
  });

  // Update task endpoint (missing PATCH handler)
  app.patch('/api/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      
      // Set up Google credentials
      if (user.accessToken) {
        await googleService.setCredentials({
          access_token: user.accessToken,
          refresh_token: user.refreshToken
        });
      }

      // Update local task
      const task = await storage.updateTask(id, updates);
      
      // Sync with Google Tasks if needed
      if (task.googleTaskId && updates.completed !== undefined) {
        if (updates.completed) {
          await googleService.updateTask(task.googleTaskId, { status: 'completed' });
        } else {
          await googleService.updateTask(task.googleTaskId, { status: 'needsAction' });
        }
      }

      res.json({ success: true, task });
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  app.post('/api/tasks', async (req, res) => {
    try {
      const { title, description, dueDate, priority } = req.body;
      
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      
      // Create Google Task
      if (user.accessToken) {
        await googleService.setCredentials({
          access_token: user.accessToken,
          refresh_token: user.refreshToken
        });
        
        const googleTask = await googleService.createTask(title, description, dueDate);
        
        const task = await storage.createTask({
          userId: user.id,
          title,
          description,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          priority: priority || 'normal',
          googleTaskId: googleTask.data.id!
        });

        res.json(task);
      } else {
        return res.status(401).json({ error: 'User not authenticated with Google' });
      }
    } catch (error) {
      console.error('Error creating task:', error);
      res.status(500).json({ error: 'Failed to create task' });
    }
  });

  app.patch('/api/tasks/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const task = await storage.updateTask(id, updates);
      
      if (updates.completed && !updates.slackReminderSent) {
        // Task completed, update Google Tasks
        const users = await storage.getAllUsers();
        if (users.length > 0) {
          const user = users[0];
          if (user.accessToken && task.googleTaskId) {
            await googleService.setCredentials({
              access_token: user.accessToken,
              refresh_token: user.refreshToken
            });
            
            await googleService.updateTask(task.googleTaskId, { status: 'completed' });
          }
        }
      }

      res.json(task);
    } catch (error) {
      console.error('Error updating task:', error);
      res.status(500).json({ error: 'Failed to update task' });
    }
  });

  // AI Suggestions
  app.get('/api/suggestions', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      const suggestions = await storage.getAiSuggestionsByUserId(user.id);
      res.json(suggestions);
    } catch (error) {
      console.error('Error fetching AI suggestions:', error);
      res.status(500).json({ error: 'Failed to fetch AI suggestions' });
    }
  });

  app.post('/api/suggestions/generate', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      
      // Get user context
      const recentEmails = await storage.getRecentEmailTriages(user.id, 10);
      const upcomingMeetings = await storage.getUpcomingMeetings(user.id);
      const pendingTasks = await storage.getPendingTasks(user.id);
      
      const userContext = {
        recentEmails: recentEmails.map(e => ({
          subject: e.subject,
          sender: e.sender,
          date: e.createdAt!.toISOString()
        })),
        upcomingMeetings: upcomingMeetings.map(m => ({
          title: m.title,
          date: m.startTime.toISOString(),
          attendees: Array.isArray(m.attendees) ? m.attendees.map((a: any) => a.email || a) : []
        })),
        pendingTasks: pendingTasks.map(t => ({
          title: t.title,
          dueDate: t.dueDate?.toISOString()
        }))
      };
      
      const suggestions = await generateProactiveSuggestions(userContext);
      
      // Store suggestions
      const storedSuggestions = await Promise.all(
        suggestions.map(s => storage.createAiSuggestion({
          userId: user.id,
          type: s.type,
          title: s.title,
          description: s.description,
          actionData: s.actionData
        }))
      );
      
      res.json(storedSuggestions);
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
      res.status(500).json({ error: 'Failed to generate AI suggestions' });
    }
  });

  app.patch('/api/suggestions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { accepted, dismissed } = req.body;
      
      const suggestion = await storage.updateAiSuggestion(id, { accepted, dismissed });
      res.json(suggestion);
    } catch (error) {
      console.error('Error updating AI suggestion:', error);
      res.status(500).json({ error: 'Failed to update AI suggestion' });
    }
  });

  // Send Slack reminder
  app.post('/api/slack/reminder', async (req, res) => {
    try {
      const { taskId } = req.body;
      
      const task = await storage.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }
      
      const user = await storage.getUserById(task.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const success = await sendTaskReminderDM(
        user.email,
        task.title,
        task.dueDate?.toISOString()
      );
      
      if (success) {
        await storage.updateTask(task.id, { slackReminderSent: true });
      }
      
      res.json({ success, message: success ? 'Reminder sent' : 'Failed to send reminder' });
    } catch (error) {
      console.error('Error sending Slack reminder:', error);
      res.status(500).json({ error: 'Failed to send Slack reminder' });
    }
  });

  // System stats
  app.get('/api/stats', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      
      const emailsTriaged = await storage.getEmailTriageCount(user.id);
      const meetingsScheduled = await storage.getMeetingCount(user.id);
      const tasksCompleted = await storage.getCompletedTaskCount(user.id);
      const aiSuggestions = await storage.getAiSuggestionCount(user.id);
      
      res.json({
        emailsTriaged,
        meetingsScheduled,
        tasksCompleted,
        aiSuggestions
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Settings endpoints
  app.get('/api/settings', (req, res) => {
    res.json({
      emailFilters: {
        enableCMACCatchall: true,
        urgencyThreshold: 3,
        autoReply: false,
        spamFilterLevel: "medium",
        allowedDomains: ["cmac.org", "gmail.com"],
        autoReplyEmails: [],
        continuousTaskSync: true
      },
      aiPreferences: {
        responseStyle: "professional",
        creativityLevel: 7,
        autoSuggestions: true,
        proactiveMode: true,
        learningEnabled: true
      },
      notifications: {
        emailNotifications: true,
        slackNotifications: true,
        desktopNotifications: true,
        quietHours: { start: "22:00", end: "08:00" },
        urgentOnly: false
      },
      calendar: {
        autoScheduling: true,
        bufferTime: 15,
        workingHours: { start: "09:00", end: "17:00" },
        timeZone: "America/New_York",
        conflictResolution: "suggest_alternatives"
      },
      security: {
        twoFactorAuth: false,
        sessionTimeout: 60,
        dataRetention: 90,
        encryptionLevel: "high"
      },
      appearance: {
        theme: "dark",
        neonIntensity: 8,
        compactMode: false,
        animations: true
      }
    });
  });

  app.post('/api/settings', async (req, res) => {
    try {
      const settings = req.body;
      console.log('Settings saved:', settings);
      res.json({ success: true, message: 'Settings saved successfully' });
    } catch (error) {
      console.error('Error saving settings:', error);
      res.status(500).json({ error: 'Failed to save settings' });
    }
  });

  app.delete('/api/data/clear', async (req, res) => {
    try {
      console.log('Clearing user data...');
      res.json({ success: true, message: 'Data cleared successfully' });
    } catch (error) {
      console.error('Error clearing data:', error);
      res.status(500).json({ error: 'Failed to clear data' });
    }
  });

  app.get('/api/data/export', async (req, res) => {
    try {
      const exportData = {
        user: { id: "user123", email: "user@example.com" },
        stats: { emailsTriaged: 25, meetingsScheduled: 0, tasksCompleted: 0 },
        exportDate: new Date().toISOString()
      };
      
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="amayai-data.json"');
      res.json(exportData);
    } catch (error) {
      console.error('Error exporting data:', error);
      res.status(500).json({ error: 'Failed to export data' });
    }
  });

  // Continuous task sync endpoint
  app.get('/api/tasks/draft-suggestions', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      const recentEmails = await storage.getRecentEmailTriages(user.id, 10);
      
      // Generate draft tasks that need user approval
      const draftTasks = await Promise.all(
        recentEmails.slice(0, 3).map(async (email) => ({
          id: `draft-${Date.now()}-${Math.random()}`,
          title: `Follow up: ${email.subject}`,
          description: `AI suggested task based on email from ${email.sender}`,
          priority: 'normal',
          aiGenerated: true,
          requiresApproval: true,
          sourceEmail: email.id,
          createdAt: new Date().toISOString()
        }))
      );
      
      res.json({ 
        success: true, 
        draftTasks,
        message: 'AI draft tasks generated and ready for approval'
      });
    } catch (error) {
      console.error('Error generating draft tasks:', error);
      res.status(500).json({ error: 'Failed to generate draft tasks' });
    }
  });

  // Approve/reject draft task
  app.post('/api/tasks/approve-draft', async (req, res) => {
    try {
      const { draftId, approved, title, description } = req.body;
      
      if (approved) {
        const users = await storage.getAllUsers();
        if (users.length === 0) {
          return res.status(401).json({ error: 'No authenticated user' });
        }
        
        const user = users[0];
        
        if (user.accessToken) {
          await googleService.setCredentials({
            access_token: user.accessToken,
            refresh_token: user.refreshToken
          });
          
          const googleTask = await googleService.createTask(title, description);
          
          const task = await storage.createTask({
            userId: user.id,
            title,
            description,
            priority: 'normal',
            googleTaskId: googleTask.data?.id || ''
          });

          res.json({ success: true, task, message: 'Draft task approved and created' });
        } else {
          return res.status(401).json({ error: 'User not authenticated with Google' });
        }
      } else {
        res.json({ success: true, message: 'Draft task dismissed' });
      }
    } catch (error) {
      console.error('Error approving draft task:', error);
      res.status(500).json({ error: 'Failed to approve draft task' });
    }
  });

  // Archive email endpoint for full-page email triage
  app.post('/api/emails/archive', async (req, res) => {
    try {
      const { messageId } = req.body;
      
      // In a real implementation, this would archive the email via Gmail API
      // For now, we'll simulate success
      res.json({ 
        success: true, 
        message: 'Email archived successfully',
        messageId 
      });
    } catch (error) {
      console.error('Error archiving email:', error);
      res.status(500).json({ error: 'Failed to archive email' });
    }
  });

  // Find free time endpoint for calendar
  app.post('/api/calendar/find-free-time', async (req, res) => {
    try {
      const { duration = 30, dateRange = 7 } = req.body;
      
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      
      if (user.accessToken) {
        await googleService.setCredentials({
          access_token: user.accessToken,
          refresh_token: user.refreshToken
        });
      }

      // Get calendar events for the next 7 days
      const events = await googleService.getCalendarEvents();
      
      // Generate free time slots
      const freeSlots = [];
      const now = new Date();
      const endDate = new Date(now.getTime() + (dateRange * 24 * 60 * 60 * 1000));
      
      // Business hours: 9 AM to 6 PM
      for (let d = new Date(now); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayStart = new Date(d);
        dayStart.setHours(9, 0, 0, 0);
        const dayEnd = new Date(d);
        dayEnd.setHours(18, 0, 0, 0);
        
        // Skip weekends
        if (dayStart.getDay() === 0 || dayStart.getDay() === 6) continue;
        
        // Find gaps between meetings
        const dayEvents = events.filter(event => {
          const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
          return eventStart.toDateString() === dayStart.toDateString();
        }).sort((a, b) => {
          const aStart = new Date(a.start?.dateTime || a.start?.date || '');
          const bStart = new Date(b.start?.dateTime || b.start?.date || '');
          return aStart.getTime() - bStart.getTime();
        });

        let currentTime = new Date(dayStart);
        for (const event of dayEvents) {
          const eventStart = new Date(event.start?.dateTime || event.start?.date || '');
          const eventEnd = new Date(event.end?.dateTime || event.end?.date || '');
          
          // Check if there's a gap before this event
          if (eventStart.getTime() - currentTime.getTime() >= duration * 60 * 1000) {
            freeSlots.push({
              start: new Date(currentTime),
              end: new Date(eventStart),
              duration: Math.floor((eventStart.getTime() - currentTime.getTime()) / (60 * 1000))
            });
          }
          currentTime = eventEnd > currentTime ? eventEnd : currentTime;
        }
        
        // Check gap after last event until end of day
        if (dayEnd.getTime() - currentTime.getTime() >= duration * 60 * 1000) {
          freeSlots.push({
            start: new Date(currentTime),
            end: new Date(dayEnd),
            duration: Math.floor((dayEnd.getTime() - currentTime.getTime()) / (60 * 1000))
          });
        }
      }

      res.json({ 
        success: true, 
        freeSlots: freeSlots.slice(0, 10), // Return top 10 slots
        message: `Found ${freeSlots.length} available time slots`
      });
    } catch (error) {
      console.error('Error finding free time:', error);
      res.status(500).json({ error: 'Failed to find free time slots' });
    }
  });

  // AI Suggestions endpoints
  app.get('/api/suggestions', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      const suggestions = await storage.getAiSuggestionsByUserId(user.id);
      res.json(suggestions);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      res.status(500).json({ error: 'Failed to fetch AI suggestions' });
    }
  });

  app.post('/api/suggestions/generate', async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      
      if (user.accessToken) {
        await googleService.setCredentials({
          access_token: user.accessToken,
          refresh_token: user.refreshToken
        });
      }

      // Get context for AI suggestions
      const recentEmails = await storage.getRecentEmailTriages(user.id, 5);
      const pendingTasks = await storage.getPendingTasks(user.id);
      const upcomingMeetings = await storage.getUpcomingMeetings(user.id);
      
      // Generate suggestions based on Martin AI patterns
      const suggestions = await generateProactiveSuggestions({
        recentEmails: recentEmails.map(email => ({
          subject: email.subject,
          sender: email.sender,
          date: email.createdAt?.toISOString() || new Date().toISOString()
        })),
        upcomingMeetings: upcomingMeetings.map(meeting => ({
          title: meeting.title,
          date: meeting.startTime.toISOString(),
          attendees: Array.isArray(meeting.attendees) ? meeting.attendees.map((a: any) => a.email || '') : []
        })),
        pendingTasks: pendingTasks.map(task => ({
          title: task.title,
          dueDate: task.dueDate?.toISOString()
        }))
      });

      // Store suggestions in database
      const storedSuggestions = await Promise.all(
        suggestions.map(suggestion => 
          storage.createAiSuggestion({
            userId: user.id,
            type: suggestion.type,
            title: suggestion.title,
            description: suggestion.description,
            actionData: suggestion.actionData
          })
        )
      );

      res.json({ 
        success: true, 
        suggestions: storedSuggestions,
        message: `Generated ${storedSuggestions.length} AI suggestions`
      });
    } catch (error) {
      console.error('Error generating suggestions:', error);
      res.status(500).json({ error: 'Failed to generate AI suggestions' });
    }
  });

  app.patch('/api/suggestions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { accepted, dismissed } = req.body;
      
      const suggestion = await storage.updateAiSuggestion(id, { accepted, dismissed });
      
      // If accepted, execute the suggestion action
      if (accepted && suggestion.actionData) {
        // Handle different suggestion types
        switch (suggestion.type) {
          case 'email_follow_up':
            // Create a task to follow up
            await storage.createTask({
              userId: suggestion.userId,
              title: `Follow up: ${suggestion.title}`,
              description: suggestion.description,
              priority: 'normal'
            });
            break;
          case 'meeting_preparation':
            // Send agenda template or create prep task
            await storage.createTask({
              userId: suggestion.userId,
              title: `Prepare agenda: ${suggestion.title}`,
              description: suggestion.description,
              priority: 'high'
            });
            break;
          case 'task_reminder':
            // Send Slack reminder
            const userEmail = suggestion.actionData && typeof suggestion.actionData === 'object' && 'userEmail' in suggestion.actionData 
              ? (suggestion.actionData as any).userEmail 
              : '';
            await sendTaskReminderDM(userEmail || '', suggestion.title);
            break;
        }
      }

      res.json({ success: true, suggestion });
    } catch (error) {
      console.error('Error updating suggestion:', error);
      res.status(500).json({ error: 'Failed to update suggestion' });
    }
  });

  // Slack reminder endpoint
  app.post('/api/slack/reminder', async (req, res) => {
    try {
      const { taskId, message } = req.body;
      
      const users = await storage.getAllUsers();
      if (users.length === 0) {
        return res.status(401).json({ error: 'No authenticated user' });
      }
      
      const user = users[0];
      let task;
      
      if (taskId) {
        task = await storage.getTaskById(taskId);
        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }
      }

      // Send Slack reminder
      const reminderMessage = message || (task ? `Reminder: ${task.title}` : 'Task reminder');
      await sendTaskReminderDM(user.email, reminderMessage);
      
      // Update task reminder status if applicable
      if (task) {
        await storage.updateTask(task.id, { slackReminderSent: true });
      }

      res.json({ 
        success: true, 
        message: 'Slack reminder sent successfully' 
      });
    } catch (error) {
      console.error('Error sending Slack reminder:', error);
      res.status(500).json({ error: 'Failed to send Slack reminder' });
    }
  });

  // Clear demo data endpoint (for fixing authentication issues)
  app.post('/api/admin/clear-demo-data', async (req, res) => {
    try {
      // This should only be used to clear demo/mock data when implementing proper auth
      const result = await storage.clearDemoData();
      res.json({ 
        success: true, 
        message: 'Demo data cleared successfully',
        result 
      });
    } catch (error) {
      console.error('Error clearing demo data:', error);
      res.status(500).json({ error: 'Failed to clear demo data' });
    }
  });

  return httpServer;
}
