import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Mail, Clock, Bot, Check, X, Calendar, Reply, AlertTriangle } from 'lucide-react';

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

interface EmailApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EmailApprovalModal({ isOpen, onClose }: EmailApprovalModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedEmail, setSelectedEmail] = useState<EmailTriage | null>(null);

  const { data: emails = [], isLoading } = useQuery<EmailTriage[]>({
    queryKey: ['/api/emails/triage'],
    enabled: isOpen
  });

  const replyMutation = useMutation({
    mutationFn: async ({ messageId, replyType, customMessage }: { 
      messageId: string; 
      replyType: string; 
      customMessage?: string;
    }) => {
      const response = await apiRequest('POST', '/api/emails/reply', {
        messageId,
        replyType,
        customMessage
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Email reply sent successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/emails/triage'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to send reply: ${error.message}`,
        variant: 'destructive',
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

  const getClassificationIcon = (classification: string) => {
    switch (classification) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4" />;
      case 'normal':
        return <Mail className="w-4 h-4" />;
      case 'low':
        return <Clock className="w-4 h-4" />;
      case 'spam':
        return <X className="w-4 h-4" />;
      default:
        return <Mail className="w-4 h-4" />;
    }
  };

  const getSenderInitials = (sender: string) => {
    const names = sender.split(' ');
    return names.map(name => name.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const handleReply = (messageId: string, replyType: string, customMessage?: string) => {
    replyMutation.mutate({ messageId, replyType, customMessage });
  };

  const pendingEmails = emails.filter(email => !email.processed);
  const processedEmails = emails.filter(email => email.processed);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center text-xl font-bold gradient-text">
              <Mail className="w-5 h-5 mr-2 text-neon-green" />
              Email Triage & Approval Center
            </div>
            <div className="text-sm text-gray-400">
              {emails.length} emails triaged • {pendingEmails.length} pending approval
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex h-[70vh]">
          {/* Email List */}
          <div className="w-1/2 border-r border-gray-700 pr-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-neon-cyan mb-2">
                Pending Approval ({pendingEmails.length})
              </h3>
              <ScrollArea className="h-[30vh] custom-scrollbar">
                <div className="space-y-2">
                  {pendingEmails.map((email) => (
                    <div
                      key={email.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-300 ${
                        selectedEmail?.id === email.id
                          ? 'border-neon-green bg-neon-green/10'
                          : 'border-gray-700 hover:border-neon-green/50 bg-gray-800/30'
                      }`}
                      onClick={() => setSelectedEmail(email)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                            {getSenderInitials(email.sender)}
                          </div>
                          <Badge className={`${getClassificationColor(email.classification)} text-xs`}>
                            {getClassificationIcon(email.classification)}
                            <span className="ml-1">{email.classification}</span>
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-400">
                          {new Date(email.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="font-medium text-sm truncate">{email.sender}</p>
                      <p className="text-xs text-gray-300 truncate">{email.subject}</p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{email.aiSummary}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            <Separator className="my-4" />

            <div>
              <h3 className="text-lg font-semibold text-gray-400 mb-2">
                Processed ({processedEmails.length})
              </h3>
              <ScrollArea className="h-[30vh] custom-scrollbar">
                <div className="space-y-2">
                  {processedEmails.map((email) => (
                    <div
                      key={email.id}
                      className="p-3 rounded-lg border border-gray-700 bg-gray-800/20 opacity-60 cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedEmail(email)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center space-x-2">
                          <Check className="w-4 h-4 text-green-400" />
                          <Badge className={`${getClassificationColor(email.classification)} text-xs opacity-70`}>
                            {email.classification}
                          </Badge>
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(email.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="font-medium text-sm truncate text-gray-300">{email.sender}</p>
                      <p className="text-xs text-gray-400 truncate">{email.subject}</p>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          {/* Email Details & Actions */}
          <div className="w-1/2 pl-4">
            {selectedEmail ? (
              <div className="h-full flex flex-col">
                <div className="flex-1">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={`${getClassificationColor(selectedEmail.classification)}`}>
                        {getClassificationIcon(selectedEmail.classification)}
                        <span className="ml-1 capitalize">{selectedEmail.classification}</span>
                      </Badge>
                      <div className="text-sm text-gray-400">
                        <Clock className="w-4 h-4 inline mr-1" />
                        {new Date(selectedEmail.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-1">{selectedEmail.sender}</h3>
                    <p className="text-gray-300">{selectedEmail.subject}</p>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-neon-cyan mb-2">
                      <Bot className="w-4 h-4 inline mr-1" />
                      AI Summary
                    </h4>
                    <p className="text-sm text-gray-300 bg-gray-800/50 p-3 rounded-lg">
                      {selectedEmail.aiSummary}
                    </p>
                  </div>

                  {selectedEmail.suggestedReplies && selectedEmail.suggestedReplies.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-sm font-semibold text-neon-magenta mb-2">
                        <Reply className="w-4 h-4 inline mr-1" />
                        Suggested Replies
                      </h4>
                      <div className="space-y-2">
                        {selectedEmail.suggestedReplies.map((reply, index) => (
                          <div key={index} className="bg-gray-800/50 p-3 rounded-lg">
                            <p className="text-sm text-gray-300 mb-2">{reply}</p>
                            <Button
                              size="sm"
                              className="neon-button-green text-xs"
                              onClick={() => handleReply(selectedEmail.messageId, 'custom', reply)}
                              disabled={replyMutation.isPending || selectedEmail.processed}
                            >
                              Send This Reply
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {!selectedEmail.processed && (
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        className="neon-button-green"
                        onClick={() => handleReply(selectedEmail.messageId, 'approve')}
                        disabled={replyMutation.isPending}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Quick Approve
                      </Button>
                      <Button
                        size="sm"
                        className="neon-button-blue"
                        onClick={() => handleReply(selectedEmail.messageId, 'schedule_meeting')}
                        disabled={replyMutation.isPending}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Schedule Meeting
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-gray-300"
                        onClick={() => {
                          const customReply = prompt('Enter your custom reply:');
                          if (customReply) {
                            handleReply(selectedEmail.messageId, 'custom', customReply);
                          }
                        }}
                        disabled={replyMutation.isPending}
                      >
                        <Reply className="w-4 h-4 mr-1" />
                        Custom Reply
                      </Button>
                    </div>
                  </div>
                )}

                {selectedEmail.processed && (
                  <div className="border-t border-gray-700 pt-4">
                    <div className="flex items-center text-green-400">
                      <Check className="w-4 h-4 mr-2" />
                      <span className="text-sm">This email has been processed</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select an email to view details and actions</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}