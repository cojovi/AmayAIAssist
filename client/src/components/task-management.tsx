import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { apiRequest } from "@/lib/queryClient";
import { CheckSquare, Plus, Clock, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string;
  completed: boolean;
  priority: string;
  createdAt: string;
  completedAt?: string;
}

export function TaskManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    refetchInterval: 30000,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: { title: string; description?: string; priority?: string }) => {
      const response = await apiRequest("POST", "/api/tasks", task);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      setNewTaskTitle("");
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to create task: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const response = await apiRequest("PATCH", `/api/tasks/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update task: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const sendReminderMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiRequest("POST", "/api/slack/reminder", { taskId });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Slack reminder sent successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to send reminder: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      createTaskMutation.mutate({ title: newTaskTitle.trim() });
    }
  };

  const handleToggleTask = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      updates: { 
        completed: !task.completed,
        completedAt: !task.completed ? new Date().toISOString() : undefined
      }
    });
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-400';
      case 'high':
        return 'bg-orange-400';
      case 'normal':
        return 'bg-blue-400';
      case 'low':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed).slice(0, 3);

  return (
    <GlassCard className="p-6 border border-neon-green/30">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold flex items-center">
          <CheckSquare className="mr-3 text-neon-green animate-glow" />
          Task Management
        </h3>
        <Button
          size="sm"
          variant="ghost"
          className="text-neon-green hover:text-green-400"
          data-testid="button-add-task"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-4">
        {/* Task Input */}
        <form onSubmit={handleAddTask} className="flex space-x-2">
          <Input
            type="text"
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            className="neon-input flex-1"
            data-testid="input-new-task"
          />
          <Button
            type="submit"
            className="neon-button neon-button-green"
            disabled={createTaskMutation.isPending || !newTaskTitle.trim()}
            data-testid="button-submit-task"
          >
            {createTaskMutation.isPending ? (
              <div className="neon-spinner w-4 h-4" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </form>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="neon-spinner"></div>
          </div>
        ) : (
          <>
            {/* Pending Tasks */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-gray-300">Pending Tasks</h4>
              {pendingTasks.length === 0 ? (
                <p className="text-sm text-gray-500 py-4">No pending tasks</p>
              ) : (
                pendingTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg hover:bg-gray-800/70 transition-colors"
                    data-testid={`task-item-${task.id}`}
                  >
                    <Checkbox
                      checked={task.completed}
                      onCheckedChange={() => handleToggleTask(task)}
                      className="border-neon-green data-[state=checked]:bg-neon-green data-[state=checked]:border-neon-green"
                      data-testid={`checkbox-task-${task.id}`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium" data-testid={`task-title-${task.id}`}>{task.title}</p>
                      {task.dueDate && (
                        <p className="text-xs text-gray-400">
                          <Clock className="w-3 h-3 inline mr-1" />
                          Due {formatDate(task.dueDate)}
                        </p>
                      )}
                    </div>
                    <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`}></div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-neon-cyan hover:text-cyan-400 p-1"
                      onClick={() => sendReminderMutation.mutate(task.id)}
                      disabled={sendReminderMutation.isPending}
                      data-testid={`button-remind-${task.id}`}
                    >
                      <Calendar className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold text-gray-300">Recently Completed</h4>
                {completedTasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-center space-x-3 p-3 bg-gray-800/50 rounded-lg opacity-60"
                    data-testid={`completed-task-${task.id}`}
                  >
                    <Checkbox
                      checked={true}
                      disabled
                      className="border-neon-green bg-neon-green"
                    />
                    <div className="flex-1">
                      <p className="text-sm line-through">{task.title}</p>
                      <p className="text-xs text-gray-400">
                        Completed {task.completedAt ? formatDate(task.completedAt) : 'recently'}
                      </p>
                    </div>
                    <div className="w-2 h-2 bg-neon-green rounded-full"></div>
                  </div>
                ))}
              </div>
            )}

            {/* AI Reminder Suggestions */}
            <div className="border-t border-gray-700 pt-4">
              <p className="text-sm text-gray-400 mb-3">AI Reminder Suggestions</p>
              <div className="space-y-2">
                <div className="p-2 bg-neon-cyan/10 rounded border border-neon-cyan/30">
                  <p className="text-xs">Slack DM reminder: "Follow up with vendor quote"</p>
                  <p className="text-xs text-gray-400">Suggested for tomorrow 9:00 AM</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-neon-cyan hover:text-cyan-400 mt-1 p-0 h-auto"
                    data-testid="button-accept-suggestion"
                  >
                    <CheckSquare className="w-3 h-3 mr-1" />
                    Accept
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </GlassCard>
  );
}
