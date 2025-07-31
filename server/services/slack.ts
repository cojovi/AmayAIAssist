import { WebClient } from '@slack/web-api';

if (!process.env.SLACK_BOT_TOKEN) {
  throw new Error("SLACK_BOT_TOKEN environment variable must be set");
}

const slack = new WebClient(process.env.SLACK_BOT_TOKEN);

export async function sendSlackDM(userId: string, message: string): Promise<string | undefined> {
  try {
    // Open a DM channel with the user
    const dmChannel = await slack.conversations.open({
      users: userId
    });

    if (!dmChannel.channel?.id) {
      throw new Error('Failed to open DM channel');
    }

    // Send the message
    const response = await slack.chat.postMessage({
      channel: dmChannel.channel.id,
      text: message,
      as_user: true
    });

    return response.ts;
  } catch (error) {
    console.error('Error sending Slack DM:', error);
    throw error;
  }
}

export async function sendSlackReminder(userId: string, message: string, time: string): Promise<string | undefined> {
  try {
    const response = await slack.reminders.add({
      text: message,
      time,
      user: userId
    });

    return response.reminder?.id;
  } catch (error) {
    console.error('Error sending Slack reminder:', error);
    throw error;
  }
}

export async function scheduleSlackMessage(channelId: string, message: string, postAt: number): Promise<string | undefined> {
  try {
    const response = await slack.chat.scheduleMessage({
      channel: channelId,
      text: message,
      post_at: postAt
    });

    return response.scheduled_message_id;
  } catch (error) {
    console.error('Error scheduling Slack message:', error);
    throw error;
  }
}

export async function getUserByEmail(email: string): Promise<string | null> {
  try {
    const response = await slack.users.lookupByEmail({
      email
    });

    return response.user?.id || null;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return null;
  }
}

export async function sendTaskReminderDM(userEmail: string, taskTitle: string, dueDate?: string): Promise<boolean> {
  try {
    const userId = await getUserByEmail(userEmail);
    if (!userId) {
      console.error('User not found in Slack:', userEmail);
      return false;
    }

    const dueText = dueDate ? ` (due ${new Date(dueDate).toLocaleString()})` : '';
    const message = `⏰ Task Reminder: "${taskTitle}"${dueText}`;

    await sendSlackDM(userId, message);
    return true;
  } catch (error) {
    console.error('Failed to send task reminder DM:', error);
    return false;
  }
}

export async function sendMeetingNotification(userEmail: string, meetingTitle: string, startTime: string, attendees: string[]): Promise<boolean> {
  try {
    const userId = await getUserByEmail(userEmail);
    if (!userId) {
      console.error('User not found in Slack:', userEmail);
      return false;
    }

    const attendeeList = attendees.length > 0 ? `\nAttendees: ${attendees.join(', ')}` : '';
    const message = `📅 Meeting starting soon: "${meetingTitle}" at ${new Date(startTime).toLocaleString()}${attendeeList}`;

    await sendSlackDM(userId, message);
    return true;
  } catch (error) {
    console.error('Failed to send meeting notification:', error);
    return false;
  }
}

export { slack };
