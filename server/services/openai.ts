import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface EmailClassification {
  classification: "urgent" | "normal" | "low" | "spam";
  confidence: number;
  summary: string;
  suggestedReplies: string[];
  actionRequired: boolean;
  priority: number;
}

export async function classifyEmail(
  sender: string,
  subject: string,
  body: string
): Promise<EmailClassification> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI email assistant that classifies emails and generates helpful responses. Analyze the email and provide:
1. Classification (urgent/normal/low/spam)
2. Confidence score (0-1)
3. Brief summary (1-2 sentences)
4. 3 suggested reply options
5. Whether action is required
6. Priority score (1-10)

Respond with JSON in this exact format: {
  "classification": "urgent|normal|low|spam",
  "confidence": 0.85,
  "summary": "Brief summary here",
  "suggestedReplies": ["Reply 1", "Reply 2", "Reply 3"],
  "actionRequired": true,
  "priority": 8
}`
        },
        {
          role: "user",
          content: `Email from: ${sender}\nSubject: ${subject}\nBody: ${body}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return result;
  } catch (error) {
    console.error("Failed to classify email:", error);
    throw new Error("Failed to classify email: " + (error as Error).message);
  }
}

export interface MeetingAgenda {
  title: string;
  objectives: string[];
  agenda_items: Array<{
    topic: string;
    duration: number;
    presenter?: string;
  }>;
  preparation_notes: string[];
}

export async function generateMeetingAgenda(
  meetingTitle: string,
  attendees: string[],
  duration: number,
  context?: string
): Promise<MeetingAgenda> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI meeting assistant that creates professional meeting agendas. Generate a structured agenda with clear objectives, time-boxed items, and preparation notes. Respond with JSON in this format: {
  "title": "Meeting Title",
  "objectives": ["Objective 1", "Objective 2"],
  "agenda_items": [
    {"topic": "Topic name", "duration": 15, "presenter": "Name or null"}
  ],
  "preparation_notes": ["Note 1", "Note 2"]
}`
        },
        {
          role: "user",
          content: `Create agenda for: ${meetingTitle}
Attendees: ${attendees.join(", ")}
Duration: ${duration} minutes
Context: ${context || "General business meeting"}`
        }
      ],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content!);
  } catch (error) {
    console.error("Failed to generate meeting agenda:", error);
    throw new Error("Failed to generate meeting agenda: " + (error as Error).message);
  }
}

export interface ProactiveSuggestion {
  type: string;
  title: string;
  description: string;
  priority: number;
  actionData: Record<string, any>;
}

export async function generateProactiveSuggestions(
  userContext: {
    recentEmails: Array<{ subject: string; sender: string; date: string }>;
    upcomingMeetings: Array<{ title: string; date: string; attendees: string[] }>;
    pendingTasks: Array<{ title: string; dueDate?: string }>;
  }
): Promise<ProactiveSuggestion[]> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI productivity assistant that analyzes user patterns and suggests proactive actions. Based on the user's recent activity, generate helpful suggestions. Respond with JSON array of suggestions in this format:
[
  {
    "type": "email_follow_up|meeting_preparation|task_reminder|schedule_optimization",
    "title": "Short actionable title",
    "description": "Detailed description of the suggestion",
    "priority": 1-10,
    "actionData": {"key": "value"}
  }
]`
        },
        {
          role: "user",
          content: `User context:
Recent emails: ${JSON.stringify(userContext.recentEmails)}
Upcoming meetings: ${JSON.stringify(userContext.upcomingMeetings)}
Pending tasks: ${JSON.stringify(userContext.pendingTasks)}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content!);
    return Array.isArray(result) ? result : result.suggestions || [];
  } catch (error) {
    console.error("Failed to generate proactive suggestions:", error);
    throw new Error("Failed to generate proactive suggestions: " + (error as Error).message);
  }
}

export async function draftEmailReply(
  originalEmail: {
    sender: string;
    subject: string;
    body: string;
  },
  replyType: "approve" | "decline" | "request_info" | "schedule_meeting" | "custom",
  customInstructions?: string
): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI email assistant that drafts professional email replies. Write a clear, concise, and appropriate response based on the original email and reply type requested.`
        },
        {
          role: "user",
          content: `Original email from ${originalEmail.sender}:
Subject: ${originalEmail.subject}
Body: ${originalEmail.body}

Draft a ${replyType} reply${customInstructions ? ` with these instructions: ${customInstructions}` : ""}.`
        }
      ],
    });

    return response.choices[0].message.content!;
  } catch (error) {
    console.error("Failed to draft email reply:", error);
    throw new Error("Failed to draft email reply: " + (error as Error).message);
  }
}
