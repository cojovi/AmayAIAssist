import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { Inbox, Bot, Check, Edit2, Calendar, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailTriage {
  id: string;
  messageId: string;
  sender: string;
  subject: string;
  classification: string;
  aiSummary: string;
  suggestedReplies: string[];
  processed: boolean;
  createdAt: string;
}

export function EmailTriage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: emails = [], isLoading, refetch } = useQuery<EmailTriage[]>({
    queryKey: ["/api/emails/triage"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const replyMutation = useMutation({
    mutationFn: async ({ messageId, replyType, customMessage }: { 
      messageId: string; 
      replyType: string; 
      customMessage?: string;
    }) => {
      const response = await apiRequest("POST", "/api/emails/reply", {
        messageId,
        replyType,
        customMessage
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email reply sent successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/emails/triage"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send reply: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'urgent':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'normal':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'low':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'spam':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getSenderInitials = (sender: string) => {
    const names = sender.split(' ');
    return names.map(name => name.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const handleReply = (messageId: string, replyType: string) => {
    replyMutation.mutate({ messageId, replyType });
  };

  return (
    <GlassCard className="p-6 border border-neon-green/30 h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center">
          <Inbox className="mr-3 text-neon-green animate-glow" />
          Email Triage & Drafts
        </h3>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
          <span className="text-sm text-gray-400">Live monitoring</span>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="neon-spinner"></div>
          </div>
        ) : emails.length === 0 ? (
          <div className="text-center py-8">
            <Inbox className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No emails to triage</p>
          </div>
        ) : (
          emails.map((email) => (
            <div 
              key={email.id}
              className="bg-gray-800/50 p-4 rounded-lg border border-gray-700 hover:border-neon-green/50 transition-all duration-300"
              data-testid={`email-item-${email.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {getSenderInitials(email.sender)}
                    </div>
                    <div>
                      <p className="font-semibold" data-testid={`sender-${email.id}`}>{email.sender}</p>
                      <p className="text-xs text-gray-400">
                        <Clock className="w-3 h-3 inline mr-1" />
                        {new Date(email.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Badge className={getClassificationColor(email.classification)}>
                      {email.classification}
                    </Badge>
                  </div>
                  <p className="text-sm mb-3" data-testid={`subject-${email.id}`}>{email.subject}</p>
                  <p className="text-xs text-gray-400 mb-3">
                    <Bot className="w-3 h-3 inline mr-1 text-neon-cyan" />
                    AI Summary: {email.aiSummary}
                  </p>
                  {email.suggestedReplies && email.suggestedReplies.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-3">
                      {email.suggestedReplies.slice(0, 2).map((reply, index) => (
                        <Button
                          key={index}
                          size="sm"
                          variant="outline"
                          className="text-xs border-neon-green/30 text-neon-green hover:bg-neon-green/10"
                          onClick={() => handleReply(email.messageId, 'custom')}
                          disabled={replyMutation.isPending}
                          data-testid={`suggested-reply-${email.id}-${index}`}
                        >
                          {reply.length > 50 ? reply.substring(0, 50) + '...' : reply}
                        </Button>
                      ))}
                    </div>
                  )}
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      className="neon-button-green text-xs"
                      onClick={() => handleReply(email.messageId, 'approve')}
                      disabled={replyMutation.isPending || email.processed}
                      data-testid={`button-approve-${email.id}`}
                    >
                      Quick Reply: "Approved"
                    </Button>
                    <Button
                      size="sm"
                      className="neon-button-blue text-xs"
                      onClick={() => handleReply(email.messageId, 'schedule_meeting')}
                      disabled={replyMutation.isPending || email.processed}
                      data-testid={`button-schedule-call-${email.id}`}
                    >
                      <Calendar className="w-3 h-3 mr-1" />
                      Schedule Call
                    </Button>
                  </div>
                  {email.processed && (
                    <p className="text-xs text-green-400 mt-2">✓ Reply sent</p>
                  )}
                </div>
                <div className="flex flex-col space-y-2 ml-4">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-neon-green hover:text-green-400 p-2"
                    onClick={() => handleReply(email.messageId, 'approve')}
                    disabled={replyMutation.isPending || email.processed}
                    data-testid={`button-approve-reply-${email.id}`}
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-neon-magenta hover:text-pink-400 p-2"
                    data-testid={`button-edit-reply-${email.id}`}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Processing indicator */}
        <div className="bg-gray-800/50 p-4 rounded-lg border border-neon-cyan/30 hover:border-neon-cyan/50 transition-all duration-300">
          <div className="flex items-center space-x-3">
            <div className="neon-spinner"></div>
            <div>
              <p className="text-sm">Processing new emails...</p>
              <p className="text-xs text-gray-400">Monitoring for incoming messages</p>
            </div>
            <div className="ml-auto">
              <div className="neon-progress w-16">
                <div className="neon-progress-bar w-3/4 data-flow"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
