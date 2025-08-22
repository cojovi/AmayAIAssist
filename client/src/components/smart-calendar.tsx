import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Calendar, ExternalLink, Clock, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: { dateTime: string };
  end: { dateTime: string };
  attendees?: Array<{ email: string }>;
}

interface Meeting {
  id: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees: any[];
  status: string;
}

export function SmartCalendar() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: events = [], isLoading } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar/events"],
    refetchInterval: 60000, // Refresh every minute
  });

  const createMeetingMutation = useMutation({
    mutationFn: async (meeting: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      attendees: Array<{ email: string }>;
    }) => {
      const response = await apiRequest("POST", "/api/calendar/meetings", meeting);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Meeting scheduled successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar/events"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to schedule meeting: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const findFreeTimeMutation = useMutation({
    mutationFn: async (params: { duration?: number; dateRange?: number } = {}) => {
      const response = await apiRequest("POST", "/api/calendar/find-free-time", params);
      return response.json();
    },
    onSuccess: (data) => {
      const slotsCount = data.freeSlots?.length || 0;
      toast({
        title: "Free Time Found",
        description: `Found ${slotsCount} available time slots`,
      });
      // Could open a modal or expand a section to show the slots
      console.log("Free time slots:", data.freeSlots);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to find free time: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const formatTime = (dateTime: string) => {
    const date = new Date(dateTime);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isToday = (dateTime: string) => {
    const date = new Date(dateTime);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isTomorrow = (dateTime: string) => {
    const date = new Date(dateTime);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return date.toDateString() === tomorrow.toDateString();
  };

  const getEventDateLabel = (dateTime: string) => {
    if (isToday(dateTime)) return "Today";
    if (isTomorrow(dateTime)) return "Tomorrow";
    return new Date(dateTime).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric'
    });
  };

  const todayEvents = events.filter(event => isToday(event.start.dateTime));
  const upcomingEvents = events.filter(event => !isToday(event.start.dateTime)).slice(0, 3);

  return (
    <GlassCard className="p-6 border border-neon-blue/30">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center">
          <Calendar className="mr-3 text-neon-blue animate-glow" />
          Smart Calendar
        </h3>
        <Button
          size="sm"
          variant="ghost"
          className="text-neon-blue hover:text-blue-400"
          data-testid="button-open-calendar"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="neon-spinner"></div>
          </div>
        ) : (
          <>
            {/* Today's Schedule */}
            <div className="border-l-4 border-neon-green pl-4">
              <p className="text-sm text-gray-400 mb-2">
                Today - {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
              <div className="space-y-2">
                {todayEvents.length === 0 ? (
                  <p className="text-sm text-gray-500">No meetings scheduled for today</p>
                ) : (
                  todayEvents.map((event) => (
                    <div 
                      key={event.id}
                      className="flex items-center justify-between p-2 bg-gray-800/50 rounded"
                      data-testid={`event-today-${event.id}`}
                    >
                      <div>
                        <p className="text-sm font-medium">{event.summary}</p>
                        <p className="text-xs text-gray-400">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatTime(event.start.dateTime)} - {formatTime(event.end.dateTime)}
                        </p>
                        {event.attendees && event.attendees.length > 0 && (
                          <p className="text-xs text-gray-500">
                            <Users className="w-3 h-3 inline mr-1" />
                            {event.attendees.length} attendee{event.attendees.length !== 1 ? 's' : ''}
                          </p>
                        )}
                      </div>
                      <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Upcoming Events */}
            {upcomingEvents.length > 0 && (
              <div className="border-l-4 border-neon-blue pl-4">
                <p className="text-sm text-gray-400 mb-2">Upcoming Events</p>
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <div 
                      key={event.id}
                      className="flex items-center justify-between p-2 bg-gray-800/50 rounded"
                      data-testid={`event-upcoming-${event.id}`}
                    >
                      <div>
                        <p className="text-sm font-medium">{event.summary}</p>
                        <p className="text-xs text-gray-400">
                          {getEventDateLabel(event.start.dateTime)} • {formatTime(event.start.dateTime)}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-neon-blue rounded-full"></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Scheduling Requests - Mock data for demo */}
            <div className="border-l-4 border-neon-magenta pl-4">
              <p className="text-sm text-gray-400 mb-2">Pending Requests</p>
              <div className="p-3 bg-neon-magenta/10 rounded border border-neon-magenta/30">
                <p className="text-sm mb-2">Meeting request pending confirmation</p>
                <p className="text-xs text-gray-400 mb-2">Suggested times:</p>
                <div className="flex space-x-2">
                  <Button
                    size="sm"
                    className="neon-button-magenta text-xs"
                    disabled={createMeetingMutation.isPending}
                    data-testid="button-accept-time-1"
                  >
                    Tomorrow 2PM
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs border-gray-600/30 text-gray-400 hover:bg-gray-600/30"
                    disabled={createMeetingMutation.isPending}
                    data-testid="button-accept-time-2"
                  >
                    Friday 10AM
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-4 border-t border-gray-700">
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  className="neon-button-blue"
                  data-testid="button-schedule-meeting"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-gray-600/30 text-gray-400 hover:bg-gray-600/30"
                  onClick={() => findFreeTimeMutation.mutate({ duration: 30, dateRange: 7 })}
                  disabled={findFreeTimeMutation.isPending}
                  data-testid="button-find-time"
                >
                  {findFreeTimeMutation.isPending ? (
                    <div className="neon-spinner w-4 h-4 mr-2" />
                  ) : null}
                  Find Free Time
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </GlassCard>
  );
}
