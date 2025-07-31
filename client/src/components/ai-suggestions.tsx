import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Brain, ArrowRight, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AiSuggestion {
  id: string;
  type: string;
  title: string;
  description: string;
  actionData: Record<string, any>;
  accepted: boolean;
  dismissed: boolean;
  createdAt: string;
}

export function AiSuggestions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suggestions = [], isLoading } = useQuery<AiSuggestion[]>({
    queryKey: ["/api/suggestions"],
    refetchInterval: 60000, // Refresh every minute
  });

  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/suggestions/generate", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "New AI suggestions generated",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to generate suggestions: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateSuggestionMutation = useMutation({
    mutationFn: async ({ id, accepted, dismissed }: { 
      id: string; 
      accepted?: boolean; 
      dismissed?: boolean; 
    }) => {
      const response = await apiRequest("PATCH", `/api/suggestions/${id}`, {
        accepted,
        dismissed
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/suggestions"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update suggestion: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleAcceptSuggestion = (id: string) => {
    updateSuggestionMutation.mutate({ id, accepted: true });
    toast({
      title: "Suggestion Accepted",
      description: "The AI suggestion has been implemented",
    });
  };

  const handleDismissSuggestion = (id: string) => {
    updateSuggestionMutation.mutate({ id, dismissed: true });
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'email_follow_up':
        return '📧';
      case 'meeting_preparation':
        return '📅';
      case 'task_reminder':
        return '⏰';
      case 'schedule_optimization':
        return '⚡';
      default:
        return '💡';
    }
  };

  const getSuggestionColor = (type: string) => {
    switch (type) {
      case 'email_follow_up':
        return 'border-neon-magenta/30 bg-neon-magenta/10';
      case 'meeting_preparation':
        return 'border-neon-blue/30 bg-neon-blue/10';
      case 'task_reminder':
        return 'border-neon-cyan/30 bg-neon-cyan/10';
      case 'schedule_optimization':
        return 'border-neon-green/30 bg-neon-green/10';
      default:
        return 'border-gray-600/30 bg-gray-800/10';
    }
  };

  const activeSuggestions = suggestions.filter(s => !s.accepted && !s.dismissed);

  return (
    <GlassCard className="p-6 border border-neon-magenta/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Brain className="mr-3 text-neon-magenta animate-glow" />
          AI Suggestions
        </h3>
        <Button
          size="sm"
          variant="ghost"
          className="text-neon-magenta hover:text-pink-400"
          onClick={() => generateSuggestionsMutation.mutate()}
          disabled={generateSuggestionsMutation.isPending}
          data-testid="button-refresh-suggestions"
        >
          {generateSuggestionsMutation.isPending ? (
            <div className="neon-spinner w-4 h-4" />
          ) : (
            <RefreshCw className="w-4 h-4" />
          )}
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="neon-spinner"></div>
          </div>
        ) : activeSuggestions.length === 0 ? (
          <div className="text-center py-6">
            <Brain className="w-8 h-8 text-gray-500 mx-auto mb-3" />
            <p className="text-sm text-gray-400">No AI suggestions available</p>
            <Button
              size="sm"
              className="neon-button-magenta mt-3"
              onClick={() => generateSuggestionsMutation.mutate()}
              disabled={generateSuggestionsMutation.isPending}
              data-testid="button-generate-suggestions"
            >
              Generate Suggestions
            </Button>
          </div>
        ) : (
          activeSuggestions.map((suggestion) => (
            <div 
              key={suggestion.id}
              className={`p-3 rounded-lg border ${getSuggestionColor(suggestion.type)} transition-all duration-300 hover:shadow-md`}
              data-testid={`suggestion-${suggestion.id}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-sm">{getSuggestionIcon(suggestion.type)}</span>
                    <p className="text-sm font-medium" data-testid={`suggestion-title-${suggestion.id}`}>
                      {suggestion.title}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400 mb-2" data-testid={`suggestion-description-${suggestion.id}`}>
                    {suggestion.description}
                  </p>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-neon-green hover:text-green-400 p-0 h-auto"
                      onClick={() => handleAcceptSuggestion(suggestion.id)}
                      disabled={updateSuggestionMutation.isPending}
                      data-testid={`button-accept-suggestion-${suggestion.id}`}
                    >
                      <ArrowRight className="w-3 h-3 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-gray-400 hover:text-gray-300 p-0 h-auto"
                      onClick={() => handleDismissSuggestion(suggestion.id)}
                      disabled={updateSuggestionMutation.isPending}
                      data-testid={`button-dismiss-suggestion-${suggestion.id}`}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Demo suggestions when no real ones are available */}
        {!isLoading && activeSuggestions.length === 0 && (
          <div className="space-y-3">
            <div className="p-3 bg-neon-magenta/10 rounded-lg border border-neon-magenta/30">
              <p className="text-sm mb-2">📧 You have an unread invoice from Vendor Inc.</p>
              <button 
                className="text-xs text-neon-magenta hover:text-pink-400 transition-colors"
                data-testid="demo-suggestion-1"
              >
                <ArrowRight className="w-3 h-3 inline mr-1" />
                Set payment reminder?
              </button>
            </div>
            <div className="p-3 bg-neon-cyan/10 rounded-lg border border-neon-cyan/30">
              <p className="text-sm mb-2">📅 Meeting with client tomorrow has no agenda</p>
              <button 
                className="text-xs text-neon-cyan hover:text-cyan-400 transition-colors"
                data-testid="demo-suggestion-2"
              >
                <ArrowRight className="w-3 h-3 inline mr-1" />
                Draft agenda template?
              </button>
            </div>
            <div className="p-3 bg-neon-green/10 rounded-lg border border-neon-green/30">
              <p className="text-sm mb-2">⏰ Weekly report due tomorrow</p>
              <button 
                className="text-xs text-neon-green hover:text-green-400 transition-colors"
                data-testid="demo-suggestion-3"
              >
                <ArrowRight className="w-3 h-3 inline mr-1" />
                Prepare draft now?
              </button>
            </div>
          </div>
        )}
      </div>
    </GlassCard>
  );
}
