import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { GlassCard } from "@/components/ui/glass-card";
import { EmailTriage } from "@/components/email-triage";
import { SmartCalendar } from "@/components/smart-calendar";
import { TaskManagement } from "@/components/task-management";
import { AiSuggestions } from "@/components/ai-suggestions";
import { QuickActions } from "@/components/quick-actions";
import { SystemStatus } from "@/components/system-status";
import { useWebSocket } from "@/hooks/use-websocket";
import { Bot, Settings, ChevronDown, Mail, Calendar, CheckCircle, Lightbulb, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { SettingsPanel } from "@/components/settings-panel";
import { EmailApprovalModal } from "@/components/email-approval-modal";

export default function Dashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    emailsTriaged: 0,
    meetingsScheduled: 0,
    tasksCompleted: 0,
    aiSuggestions: 0
  });
  const [showSettings, setShowSettings] = useState(false);
  const [showEmailApproval, setShowEmailApproval] = useState(false);
  const [showTaskManagement, setShowTaskManagement] = useState(false);

  // WebSocket connection for real-time updates
  const { lastMessage, isConnected } = useWebSocket(user?.id);

  // Fetch user profile
  const { data: userProfile, isLoading: userLoading } = useQuery({
    queryKey: ["/api/user/profile"],
    refetchInterval: false,
  });

  // Fetch system stats
  const { data: systemStats } = useQuery({
    queryKey: ["/api/stats"],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (userProfile) {
      setUser(userProfile);
    }
  }, [userProfile]);

  useEffect(() => {
    if (systemStats && typeof systemStats === 'object') {
      setStats({
        emailsTriaged: (systemStats as any).emailsTriaged || 0,
        meetingsScheduled: (systemStats as any).meetingsScheduled || 0,
        tasksCompleted: (systemStats as any).tasksCompleted || 0,
        aiSuggestions: (systemStats as any).aiSuggestions || 0
      });
    }
  }, [systemStats]);

  // Handle real-time updates
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage);
      console.log("WebSocket message:", data);
      // Handle different message types
      switch (data.type) {
        case 'email_triaged':
          setStats(prev => ({ ...prev, emailsTriaged: prev.emailsTriaged + 1 }));
          break;
        case 'meeting_scheduled':
          setStats(prev => ({ ...prev, meetingsScheduled: prev.meetingsScheduled + 1 }));
          break;
        case 'task_completed':
          setStats(prev => ({ ...prev, tasksCompleted: prev.tasksCompleted + 1 }));
          break;
      }
    }
  }, [lastMessage]);

  const handleGoogleAuth = () => {
    window.location.href = '/api/auth/google';
  };

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="neon-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <GlassCard className="p-8 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-neon-cyan/50 shadow-lg shadow-neon-cyan/25 mx-auto mb-4 animate-pulse-neon">
              <img 
                src="/amayai-logo.png" 
                alt="AmayAI Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-2xl font-bold gradient-text mb-4">Welcome to AmayAI</h1>
            <p className="text-gray-300 mb-6">
              Your AI personal assistant for Google Workspace. Connect your Google account to get started.
            </p>
            <Button 
              onClick={handleGoogleAuth}
              className="neon-button neon-button-cyan w-full"
              data-testid="button-google-auth"
            >
              Connect Google Workspace
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <>
      {/* Navigation */}
      <nav className="glass-card border-b border-neon-cyan/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-neon-cyan/50 shadow-sm shadow-neon-cyan/25 animate-pulse-neon">
                  <img 
                    src="/amayai-logo.png" 
                    alt="AmayAI Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="text-xl font-bold gradient-text">AmayAI</h1>
              </div>
              <div className="hidden md:flex items-center space-x-1 ml-8">
                <div className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-neon-green' : 'bg-red-500'}`}></div>
                <span className={`text-sm ${isConnected ? 'text-neon-green' : 'text-red-500'}`}>
                  {isConnected ? 'System Online' : 'Connecting...'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                className="neon-button neon-button-blue"
                onClick={() => setShowSettings(true)}
                data-testid="button-settings"
              >
                <Settings className="w-4 h-4 mr-2 text-neon-blue" />
                <span className="hidden sm:inline">Settings</span>
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                  {user.name?.charAt(0) || 'U'}
                </div>
                <span className="hidden sm:block text-sm text-gray-300" data-testid="text-username">{user.name}</span>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <GlassCard className="p-6 rounded-xl neon-border border-neon-cyan/30 hover:border-neon-cyan/60 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2 gradient-text" data-testid="text-welcome">
                  Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {user.name?.split(' ')[0]}!
                </h2>
                <p className="text-gray-300">Your AI assistant is ready to help optimize your workflow</p>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <GlassCard 
            className="p-6 border border-neon-green/30 hover:border-neon-green hover:shadow-lg hover:shadow-neon-green/20 transition-all duration-300 group cursor-pointer"
            onClick={() => setShowEmailApproval(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Emails Triaged</p>
                <p className="text-2xl font-bold text-neon-green" data-testid="stat-emails-triaged">{stats.emailsTriaged}</p>
              </div>
              <Mail className="w-8 h-8 text-neon-green group-hover:animate-pulse" />
            </div>
            <div className="mt-4">
              <div className="neon-progress">
                <div className="neon-progress-bar w-3/4"></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Processing active • Click to review</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border border-neon-blue/30 hover:border-neon-blue hover:shadow-lg hover:shadow-neon-blue/20 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Meetings Scheduled</p>
                <p className="text-2xl font-bold text-neon-blue" data-testid="stat-meetings-scheduled">{stats.meetingsScheduled}</p>
              </div>
              <Calendar className="w-8 h-8 text-neon-blue group-hover:animate-pulse" />
            </div>
            <div className="mt-4">
              <div className="neon-progress">
                <div className="neon-progress-bar w-1/2" style={{ background: 'linear-gradient(90deg, var(--neon-blue), var(--neon-cyan))' }}></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Conflicts resolved</p>
            </div>
          </GlassCard>

          <GlassCard 
            className="p-6 border border-neon-magenta/30 hover:border-neon-magenta hover:shadow-lg hover:shadow-neon-magenta/20 transition-all duration-300 group cursor-pointer"
            onClick={() => setShowTaskManagement(true)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Tasks Completed</p>
                <p className="text-2xl font-bold text-neon-magenta" data-testid="stat-tasks-completed">{stats.tasksCompleted}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-neon-magenta group-hover:animate-pulse" />
            </div>
            <div className="mt-4">
              <div className="neon-progress">
                <div className="neon-progress-bar w-4/5" style={{ background: 'linear-gradient(90deg, var(--neon-magenta), var(--neon-pink))' }}></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Google Tasks • Click to manage</p>
            </div>
          </GlassCard>

          <GlassCard className="p-6 border border-neon-cyan/30 hover:border-neon-cyan hover:shadow-lg hover:shadow-neon-cyan/20 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">AI Suggestions</p>
                <p className="text-2xl font-bold text-neon-cyan" data-testid="stat-ai-suggestions">{stats.aiSuggestions}</p>
              </div>
              <Lightbulb className="w-8 h-8 text-neon-cyan group-hover:animate-pulse" />
            </div>
            <div className="mt-4">
              <div className="neon-progress">
                <div className="neon-progress-bar w-2/3"></div>
              </div>
              <p className="text-xs text-gray-400 mt-1">Pending actions</p>
            </div>
          </GlassCard>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8 min-h-[600px]">
          {/* Email Triage Panel */}
          <div className="lg:col-span-2 flex">
            <EmailTriage />
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            <AiSuggestions />
            <QuickActions />
            <SystemStatus />
          </div>
        </div>

        {/* Calendar & Tasks Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <SmartCalendar />
          <TaskManagement />
        </div>
      </main>

      {/* Settings Panel */}
      <SettingsPanel open={showSettings} onClose={() => setShowSettings(false)} />

      {showEmailApproval && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold gradient-text">Email Triage & Approval</h2>
              <button onClick={() => setShowEmailApproval(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <p className="text-gray-300 mb-4">
              You have triaged {stats.emailsTriaged} emails. The AI has processed and classified your emails, filtering out [CMAC_CATCHALL] messages as requested.
            </p>
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400">✓ Email filtering active</p>
              <p className="text-sm text-gray-400 mt-1">
                Emails with "[CMAC_CATCHALL]" prefix are automatically filtered from triage. 
                Full approval interface coming soon with detailed email review and response management.
              </p>
            </div>
          </div>
        </div>
      )}

      {showTaskManagement && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="glass-card max-w-3xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold gradient-text">AI Task Management</h2>
              <button onClick={() => setShowTaskManagement(false)} className="text-gray-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-gray-300">Sync with Google Tasks and get AI-powered task suggestions</p>
                <button 
                  className="neon-button neon-button-magenta"
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/tasks/ai-create', { method: 'POST' });
                      const result = await response.json();
                      if (result.success) {
                        alert(`Created ${result.tasksCreated} AI-suggested tasks!`);
                        window.location.reload(); // Simple refresh to update stats
                      }
                    } catch (error) {
                      alert('Error creating AI tasks. Please try again.');
                    }
                  }}
                >
                  ✨ Generate AI Tasks
                </button>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400">🚀 AI Task Generation</p>
                <p className="text-sm text-gray-400 mt-2">
                  Click "Generate AI Tasks" to analyze your recent emails and calendar events, 
                  then automatically create actionable tasks in Google Tasks based on your activity patterns.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
