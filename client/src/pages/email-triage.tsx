import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { 
  Inbox, 
  Bot, 
  Check, 
  Edit2, 
  Calendar, 
  Clock, 
  ChevronLeft, 
  ChevronRight,
  ArrowLeft,
  Search,
  Filter,
  Mail,
  AlertTriangle,
  Archive,
  Forward,
  Reply,
  Trash2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Link } from "wouter";

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

export function EmailTriagePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const emailsPerPage = 15;

  const { data: emails = [], isLoading, refetch } = useQuery<EmailTriage[]>({
    queryKey: ["/api/emails/triage"],
    refetchInterval: 30000,
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

  const archiveMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiRequest("POST", "/api/emails/archive", { messageId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Email archived successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/emails/triage"] });
    }
  });

  // Filter and search emails
  const filteredEmails = emails.filter(email => {
    const matchesSearch = email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.aiSummary.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterCategory === "all" || email.classification === filterCategory;
    
    return matchesSearch && matchesFilter;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredEmails.length / emailsPerPage);
  const startIndex = (currentPage - 1) * emailsPerPage;
  const displayedEmails = filteredEmails.slice(startIndex, startIndex + emailsPerPage);

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

  const getPriorityIcon = (classification: string) => {
    switch (classification) {
      case 'urgent':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'normal':
        return <Mail className="w-4 h-4 text-blue-400" />;
      case 'low':
        return <Clock className="w-4 h-4 text-gray-400" />;
      case 'spam':
        return <Trash2 className="w-4 h-4 text-yellow-400" />;
      default:
        return <Mail className="w-4 h-4 text-gray-400" />;
    }
  };

  const getSenderInitials = (sender: string) => {
    const names = sender.split(' ');
    return names.map(name => name.charAt(0)).join('').toUpperCase().slice(0, 2);
  };

  const handleReply = (messageId: string, replyType: string) => {
    replyMutation.mutate({ messageId, replyType });
  };

  const handleArchive = (messageId: string) => {
    archiveMutation.mutate(messageId);
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <Link 
                href="/" 
                className="flex items-center gap-2 text-neon-cyan hover:text-neon-cyan/80 transition-colors"
                data-testid="button-back-dashboard"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold gradient-text flex items-center">
                <Inbox className="mr-3 text-neon-green animate-glow" />
                Email Triage & AI Analysis
              </h1>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-400">Live monitoring active</span>
            </div>
          </div>

          {/* Search and Filter Controls */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search emails, senders, or AI summaries..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-10 glass-card border-neon-cyan/30"
                data-testid="input-search-emails"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => {
                  setFilterCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="glass-card border-neon-cyan/30 rounded-md px-3 py-2 text-sm bg-gray-800/50"
                data-testid="select-filter-category"
              >
                <option value="all">All Categories</option>
                <option value="urgent">Urgent</option>
                <option value="normal">Normal</option>
                <option value="low">Low Priority</option>
                <option value="spam">Spam</option>
              </select>
            </div>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="border-neon-green/30 text-neon-green hover:bg-neon-green/10"
              data-testid="button-refresh-emails"
            >
              Refresh
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <GlassCard className="p-4 border-red-500/30">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <div>
                  <p className="text-sm text-gray-400">Urgent</p>
                  <p className="text-xl font-bold text-red-400">
                    {emails.filter(e => e.classification === 'urgent').length}
                  </p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4 border-blue-500/30">
              <div className="flex items-center space-x-2">
                <Mail className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm text-gray-400">Normal</p>
                  <p className="text-xl font-bold text-blue-400">
                    {emails.filter(e => e.classification === 'normal').length}
                  </p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4 border-gray-500/30">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-400">Low Priority</p>
                  <p className="text-xl font-bold text-gray-400">
                    {emails.filter(e => e.classification === 'low').length}
                  </p>
                </div>
              </div>
            </GlassCard>
            <GlassCard className="p-4 border-green-500/30">
              <div className="flex items-center space-x-2">
                <Check className="w-5 h-5 text-green-400" />
                <div>
                  <p className="text-sm text-gray-400">Processed</p>
                  <p className="text-xl font-bold text-green-400">
                    {emails.filter(e => e.processed).length}
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>

        {/* Email List */}
        <GlassCard className="border border-neon-green/30">
          <div className="p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="neon-spinner"></div>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="text-center py-12">
                <Inbox className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400">
                  {searchTerm || filterCategory !== "all" 
                    ? "No emails match your search criteria" 
                    : "No emails to triage"}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedEmails.map((email) => (
                  <div 
                    key={email.id}
                    className="bg-gray-800/50 p-6 rounded-lg border border-gray-700 hover:border-neon-green/50 transition-all duration-300"
                    data-testid={`email-detail-${email.id}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold">
                            {getSenderInitials(email.sender)}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-1">
                              <p className="font-semibold text-lg" data-testid={`sender-detail-${email.id}`}>
                                {email.sender}
                              </p>
                              <Badge className={getClassificationColor(email.classification)}>
                                <span className="flex items-center space-x-1">
                                  {getPriorityIcon(email.classification)}
                                  <span>{email.classification.toUpperCase()}</span>
                                </span>
                              </Badge>
                              {email.processed && (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                  <Check className="w-3 h-3 mr-1" />
                                  PROCESSED
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-400 flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {new Date(email.createdAt).toLocaleString()}
                              <span className="mx-2">•</span>
                              Message ID: {email.messageId.slice(0, 8)}...
                            </p>
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-base font-medium mb-2" data-testid={`subject-detail-${email.id}`}>
                            {email.subject}
                          </p>
                          <div className="bg-gray-700/50 p-4 rounded-lg">
                            <div className="flex items-start space-x-2 mb-2">
                              <Bot className="w-4 h-4 text-neon-cyan mt-0.5" />
                              <p className="text-sm font-medium text-neon-cyan">AI Analysis Summary:</p>
                            </div>
                            <p className="text-sm text-gray-300 leading-relaxed">
                              {email.aiSummary}
                            </p>
                          </div>
                        </div>

                        {email.suggestedReplies && email.suggestedReplies.length > 0 && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-neon-magenta mb-3 flex items-center">
                              <Bot className="w-4 h-4 mr-1" />
                              AI Suggested Replies:
                            </p>
                            <div className="space-y-2">
                              {email.suggestedReplies.map((reply, index) => (
                                <div 
                                  key={index}
                                  className="bg-gray-700/30 p-3 rounded-lg border border-neon-magenta/20"
                                >
                                  <p className="text-sm text-gray-300 mb-2">{reply}</p>
                                  <Button
                                    size="sm"
                                    className="neon-button-magenta text-xs"
                                    onClick={() => handleReply(email.messageId, 'custom')}
                                    disabled={replyMutation.isPending || email.processed}
                                    data-testid={`suggested-reply-detail-${email.id}-${index}`}
                                  >
                                    Use This Reply
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-3">
                          <Button
                            size="sm"
                            className="neon-button-green"
                            onClick={() => handleReply(email.messageId, 'approve')}
                            disabled={replyMutation.isPending || email.processed}
                            data-testid={`button-approve-detail-${email.id}`}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Quick Approve
                          </Button>
                          <Button
                            size="sm"
                            className="neon-button-blue"
                            onClick={() => handleReply(email.messageId, 'schedule_meeting')}
                            disabled={replyMutation.isPending || email.processed}
                            data-testid={`button-schedule-detail-${email.id}`}
                          >
                            <Calendar className="w-4 h-4 mr-1" />
                            Schedule Meeting
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                            onClick={() => handleReply(email.messageId, 'custom')}
                            disabled={replyMutation.isPending || email.processed}
                            data-testid={`button-custom-reply-${email.id}`}
                          >
                            <Reply className="w-4 h-4 mr-1" />
                            Custom Reply
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                            onClick={() => handleReply(email.messageId, 'forward')}
                            disabled={replyMutation.isPending || email.processed}
                            data-testid={`button-forward-${email.id}`}
                          >
                            <Forward className="w-4 h-4 mr-1" />
                            Forward
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
                            onClick={() => handleArchive(email.messageId)}
                            disabled={archiveMutation.isPending || email.processed}
                            data-testid={`button-archive-${email.id}`}
                          >
                            <Archive className="w-4 h-4 mr-1" />
                            Archive
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {filteredEmails.length > emailsPerPage && (
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-700">
                <div className="text-sm text-gray-400">
                  Showing {startIndex + 1}-{Math.min(startIndex + emailsPerPage, filteredEmails.length)} of {filteredEmails.length} emails
                  {searchTerm && ` (filtered from ${emails.length} total)`}
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                    data-testid="button-prev-page-detail"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages, currentPage - 3 + i));
                    return (
                      <Button
                        key={pageNum}
                        size="sm"
                        variant={currentPage === pageNum ? "default" : "outline"}
                        onClick={() => goToPage(pageNum)}
                        className={currentPage === pageNum 
                          ? "bg-neon-cyan/20 text-neon-cyan border-neon-cyan/50" 
                          : "border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                        }
                        data-testid={`button-page-detail-${pageNum}`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="border-neon-cyan/30 text-neon-cyan hover:bg-neon-cyan/10"
                    data-testid="button-next-page-detail"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}