import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Bell, MessageSquare, Calendar, Mail } from "lucide-react";

export function QuickActions() {
  const handleAction = (action: string) => {
    console.log(`Quick action: ${action}`);
    // TODO: Implement actual quick actions
  };

  return (
    <GlassCard className="p-6 border border-neon-blue/30">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <Bell className="mr-3 text-neon-blue animate-glow" />
        Quick Actions
      </h3>
      <div className="space-y-3">
        <Button
          className="neon-button neon-button-cyan w-full justify-start"
          onClick={() => handleAction('add_reminder')}
          data-testid="button-add-reminder"
        >
          <Bell className="mr-2 w-4 h-4" />
          Add Quick Reminder
        </Button>
        <Button
          className="neon-button neon-button-green w-full justify-start"
          onClick={() => handleAction('schedule_slack')}
          data-testid="button-schedule-slack"
        >
          <MessageSquare className="mr-2 w-4 h-4" />
          Schedule Slack Message
        </Button>
        <Button
          className="neon-button neon-button-magenta w-full justify-start"
          onClick={() => handleAction('find_meeting_time')}
          data-testid="button-find-meeting-time"
        >
          <Calendar className="mr-2 w-4 h-4" />
          Find Meeting Time
        </Button>
        <Button
          className="neon-button neon-button-blue w-full justify-start"
          onClick={() => handleAction('draft_email')}
          data-testid="button-draft-email"
        >
          <Mail className="mr-2 w-4 h-4" />
          Draft Email Template
        </Button>
      </div>
    </GlassCard>
  );
}
