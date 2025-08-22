import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Mail, Plus, Zap, Sparkles, Brain, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function QuickActions() {
  const { toast } = useToast();

  const handleAIEmailCompose = async () => {
    try {
      const response = await fetch('/api/emails/ai-compose', { method: 'POST' });
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "AI Email Compose",
          description: "AI has analyzed your recent emails and suggested 3 draft responses. Check your email drafts.",
        });
      } else {
        throw new Error('Failed to compose emails');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to compose AI emails",
        variant: "destructive",
      });
    }
  };

  const handleAISchedule = async () => {
    try {
      const response = await fetch('/api/calendar/ai-schedule', { method: 'POST' });
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "AI Schedule Optimization",
          description: `Found ${result.suggestions?.length || 0} scheduling improvements. Check your calendar for optimized meeting suggestions.`,
        });
      } else {
        throw new Error('Failed to optimize schedule');
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to optimize schedule",
        variant: "destructive",
      });
    }
  };

  const handleAITasks = async () => {
    try {
      const response = await fetch('/api/tasks/ai-create', { method: 'POST' });
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "AI Task Generation",
          description: `Generated ${result.tasks?.length || 'several'} intelligent task suggestions based on your recent activity.`,
        });
      } else {
        throw new Error('Failed to generate tasks');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate AI tasks", 
        variant: "destructive",
      });
    }
  };

  const handleAIOptimize = async () => {
    try {
      const response = await fetch('/api/suggestions/generate', { method: 'POST' });
      if (response.ok) {
        const result = await response.json();
        toast({
          title: "AI Optimization Complete",
          description: `Generated ${result.suggestions?.length || 'new'} productivity suggestions. Check the AI Suggestions panel.`,
        });
      } else {
        throw new Error('Failed to optimize');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to run AI optimization",
        variant: "destructive",
      });
    }
  };

  return (
    <GlassCard className="p-4 border border-neon-yellow/30">
      <div className="flex items-center gap-2 mb-4">
        <Zap className="w-4 h-4 text-neon-yellow" />
        <h3 className="font-semibold text-neon-yellow">AI Quick Actions</h3>
        <div className="w-1.5 h-1.5 bg-neon-yellow rounded-full animate-pulse ml-auto"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <button 
          className="neon-button neon-button-yellow text-xs p-2 h-auto"
          data-testid="button-ai-compose-email"
          onClick={handleAIEmailCompose}
        >
          <Mail className="w-3 h-3 mb-1" />
          <span>AI Email</span>
        </button>
        
        <button 
          className="neon-button neon-button-yellow text-xs p-2 h-auto"
          data-testid="button-ai-schedule-meeting"
          onClick={handleAISchedule}
        >
          <Calendar className="w-3 h-3 mb-1" />
          <span>AI Schedule</span>
        </button>
        
        <button 
          className="neon-button neon-button-yellow text-xs p-2 h-auto"
          data-testid="button-ai-create-task"
          onClick={handleAITasks}
        >
          <Sparkles className="w-3 h-3 mb-1" />
          <span>AI Tasks</span>
        </button>
        
        <button 
          className="neon-button neon-button-yellow text-xs p-2 h-auto"
          data-testid="button-ai-optimize"
          onClick={handleAIOptimize}
        >
          <Brain className="w-3 h-3 mb-1" />
          <span>AI Optimize</span>
        </button>
      </div>
      
      {/* AI Productivity Booster Section */}
      <div className="mt-4 pt-4 border-t border-neon-yellow/20">
        <div className="flex items-center gap-2 mb-2">
          <Target className="w-3 h-3 text-neon-cyan" />
          <span className="text-xs text-neon-cyan font-medium">Productivity Boost</span>
        </div>
        <div className="space-y-2 text-xs">
          <div className="bg-green-500/10 border border-green-500/30 rounded px-2 py-1">
            <span className="text-green-400">✓ Email Filtering Active</span>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded px-2 py-1">
            <span className="text-blue-400">🧠 AI Analysis Running</span>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded px-2 py-1">
            <span className="text-purple-400">📅 Smart Scheduling On</span>
          </div>
        </div>
      </div>
    </GlassCard>
  );
}
