import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];

export class GoogleService {
  private oauth2Client: OAuth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || `https://${process.env.REPLIT_DOMAINS?.split(',')[0] || 'localhost:5000'}/auth/google/callback`
    );
  }

  getAuthUrl() {
    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
  }

  async getTokens(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code);
    return tokens;
  }

  async setCredentials(tokens: any) {
    this.oauth2Client.setCredentials(tokens);
  }

  async refreshAccessToken(refreshToken: string) {
    this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    const { credentials } = await this.oauth2Client.refreshAccessToken();
    return credentials;
  }

  // Gmail API methods
  async getEmails(userId: string, maxResults: number = 10) {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      q: 'is:unread'
    });

    if (!response.data.messages) return [];

    const emails = await Promise.all(
      response.data.messages.map(async (message) => {
        const email = await gmail.users.messages.get({
          userId: 'me',
          id: message.id!
        });
        
        const headers = email.data.payload?.headers || [];
        const getHeader = (name: string) => headers.find(h => h.name === name)?.value || '';
        
        return {
          id: email.data.id!,
          threadId: email.data.threadId!,
          sender: getHeader('From'),
          subject: getHeader('Subject'),
          date: getHeader('Date'),
          body: this.extractEmailBody(email.data.payload),
          labelIds: email.data.labelIds || []
        };
      })
    );

    return emails;
  }

  async sendEmail(to: string, subject: string, body: string, threadId?: string) {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    const raw = this.createRawEmail(to, subject, body, threadId);
    
    return await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw }
    });
  }

  async markEmailAsRead(messageId: string) {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    return await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    });
  }

  async addLabelToEmail(messageId: string, labelName: string) {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });
    
    // First, get or create the label
    const labels = await gmail.users.labels.list({ userId: 'me' });
    let labelId = labels.data.labels?.find(l => l.name === labelName)?.id;
    
    if (!labelId) {
      const newLabel = await gmail.users.labels.create({
        userId: 'me',
        requestBody: {
          name: labelName,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show'
        }
      });
      labelId = newLabel.data.id!;
    }
    
    return await gmail.users.messages.modify({
      userId: 'me',
      id: messageId,
      requestBody: {
        addLabelIds: [labelId]
      }
    });
  }

  // Calendar API methods
  async getCalendarEvents(timeMin?: string, timeMax?: string) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      maxResults: 20,
      singleEvents: true,
      orderBy: 'startTime'
    });

    return response.data.items || [];
  }

  async createCalendarEvent(event: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    attendees?: Array<{ email: string }>;
  }) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    return await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event
    });
  }

  async checkFreeBusy(emails: string[], timeMin: string, timeMax: string) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
    
    return await calendar.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: emails.map(email => ({ id: email }))
      }
    });
  }

  // Tasks API methods
  async getTasks() {
    const tasks = google.tasks({ version: 'v1', auth: this.oauth2Client });
    
    const taskLists = await tasks.tasklists.list();
    if (!taskLists.data.items?.length) return [];
    
    const defaultList = taskLists.data.items[0];
    const response = await tasks.tasks.list({
      tasklist: defaultList.id!
    });

    return response.data.items || [];
  }

  async createTask(title: string, notes?: string, due?: string) {
    const tasks = google.tasks({ version: 'v1', auth: this.oauth2Client });
    
    const taskLists = await tasks.tasklists.list();
    if (!taskLists.data.items?.length) {
      throw new Error('No task lists found');
    }
    
    const defaultList = taskLists.data.items[0];
    
    return await tasks.tasks.insert({
      tasklist: defaultList.id!,
      requestBody: {
        title,
        notes,
        due
      }
    });
  }

  async updateTask(taskId: string, updates: { title?: string; notes?: string; status?: string }) {
    const tasks = google.tasks({ version: 'v1', auth: this.oauth2Client });
    
    const taskLists = await tasks.tasklists.list();
    if (!taskLists.data.items?.length) {
      throw new Error('No task lists found');
    }
    
    const defaultList = taskLists.data.items[0];
    
    return await tasks.tasks.update({
      tasklist: defaultList.id!,
      task: taskId,
      requestBody: updates
    });
  }

  // Helper methods
  private extractEmailBody(payload: any): string {
    if (payload.body?.data) {
      return Buffer.from(payload.body.data, 'base64').toString('utf-8');
    }
    
    if (payload.parts) {
      for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          return Buffer.from(part.body.data, 'base64').toString('utf-8');
        }
      }
    }
    
    return '';
  }

  private createRawEmail(to: string, subject: string, body: string, threadId?: string): string {
    const headers = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=UTF-8',
      'MIME-Version: 1.0'
    ];
    
    if (threadId) {
      headers.push(`In-Reply-To: ${threadId}`);
      headers.push(`References: ${threadId}`);
    }
    
    const email = headers.join('\r\n') + '\r\n\r\n' + body;
    return Buffer.from(email).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}

export const googleService = new GoogleService();
