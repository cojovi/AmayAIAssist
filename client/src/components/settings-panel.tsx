import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import {
  Settings,
  Mail,
  Calendar,
  Bell,
  Brain,
  Shield,
  Palette,
  Zap,
  Filter,
  Clock,
  MessageSquare,
  Database,
  Trash2,
  Download,
  RefreshCw,
  Save
} from "lucide-react";

interface SettingsData {
  emailFilters: {
    enableCMACCatchall: boolean;
    urgencyThreshold: number;
    autoReply: boolean;
    spamFilterLevel: string;
    allowedDomains: string[];
    autoReplyEmails: string[];
    continuousTaskSync: boolean;
  };
  aiPreferences: {
    responseStyle: string;
    creativityLevel: number;
    autoSuggestions: boolean;
    proactiveMode: boolean;
    learningEnabled: boolean;
  };
  notifications: {
    emailNotifications: boolean;
    slackNotifications: boolean;
    desktopNotifications: boolean;
    quietHours: { start: string; end: string };
    urgentOnly: boolean;
  };
  calendar: {
    autoScheduling: boolean;
    bufferTime: number;
    workingHours: { start: string; end: string };
    timeZone: string;
    conflictResolution: string;
  };
  security: {
    twoFactorAuth: boolean;
    sessionTimeout: number;
    dataRetention: number;
    encryptionLevel: string;
  };
  appearance: {
    theme: string;
    neonIntensity: number;
    compactMode: boolean;
    animations: boolean;
  };
}

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ open, onClose }: SettingsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<SettingsData>({
    emailFilters: {
      enableCMACCatchall: true,
      urgencyThreshold: 3,
      autoReply: false,
      spamFilterLevel: "medium",
      allowedDomains: ["cmac.org", "gmail.com"],
      autoReplyEmails: [],
      continuousTaskSync: true
    },
    aiPreferences: {
      responseStyle: "professional",
      creativityLevel: 7,
      autoSuggestions: true,
      proactiveMode: true,
      learningEnabled: true
    },
    notifications: {
      emailNotifications: true,
      slackNotifications: true,
      desktopNotifications: true,
      quietHours: { start: "22:00", end: "08:00" },
      urgentOnly: false
    },
    calendar: {
      autoScheduling: true,
      bufferTime: 15,
      workingHours: { start: "09:00", end: "17:00" },
      timeZone: "America/New_York",
      conflictResolution: "suggest_alternatives"
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 60,
      dataRetention: 90,
      encryptionLevel: "high"
    },
    appearance: {
      theme: "dark",
      neonIntensity: 8,
      compactMode: false,
      animations: true
    }
  });

  // Load settings from API
  const { data: userSettings } = useQuery({
    queryKey: ["/api/settings"],
    enabled: open
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: SettingsData) => {
      const response = await apiRequest("POST", "/api/settings", newSettings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your preferences have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to save settings: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Clear data mutation
  const clearDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("DELETE", "/api/data/clear", {});
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Data Cleared",
        description: "All cached data has been cleared",
      });
      queryClient.invalidateQueries();
    }
  });

  // Export data mutation
  const exportDataMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/data/export", {});
      return response.blob();
    },
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `amayai-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast({
        title: "Data Exported",
        description: "Your data has been downloaded successfully",
      });
    }
  });

  useEffect(() => {
    if (userSettings) {
      setSettings({ ...settings, ...userSettings });
    }
  }, [userSettings]);

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const updateSetting = (section: keyof SettingsData, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const addDomain = (domain: string) => {
    if (domain && !settings.emailFilters.allowedDomains.includes(domain)) {
      setSettings(prev => ({
        ...prev,
        emailFilters: {
          ...prev.emailFilters,
          allowedDomains: [...prev.emailFilters.allowedDomains, domain]
        }
      }));
    }
  };

  const removeDomain = (domain: string) => {
    setSettings(prev => ({
      ...prev,
      emailFilters: {
        ...prev.emailFilters,
        allowedDomains: prev.emailFilters.allowedDomains.filter(d => d !== domain)
      }
    }));
  };

  const addAutoReplyEmail = (email: string) => {
    if (email && !settings.emailFilters.autoReplyEmails.includes(email)) {
      setSettings(prev => ({
        ...prev,
        emailFilters: {
          ...prev.emailFilters,
          autoReplyEmails: [...prev.emailFilters.autoReplyEmails, email]
        }
      }));
    }
  };

  const removeAutoReplyEmail = (email: string) => {
    setSettings(prev => ({
      ...prev,
      emailFilters: {
        ...prev.emailFilters,
        autoReplyEmails: prev.emailFilters.autoReplyEmails.filter(e => e !== email)
      }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden glass-card border-neon-cyan/30">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl gradient-text">
            <Settings className="w-6 h-6" />
            AmayAI Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-6 glass-card border-neon-cyan/20">
            <TabsTrigger value="email" className="flex items-center gap-1 data-[state=active]:bg-neon-cyan/20">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-1 data-[state=active]:bg-neon-magenta/20">
              <Brain className="w-4 h-4" />
              AI
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-1 data-[state=active]:bg-neon-green/20">
              <Calendar className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 data-[state=active]:bg-neon-orange/20">
              <Bell className="w-4 h-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-1 data-[state=active]:bg-red-500/20">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-1 data-[state=active]:bg-purple-500/20">
              <Palette className="w-4 h-4" />
              Theme
            </TabsTrigger>
          </TabsList>

          <div className="overflow-y-auto max-h-[60vh] pr-4">
            {/* Email Settings */}
            <TabsContent value="email" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neon-cyan">Email Filtering</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">CMAC Catchall Filter</Label>
                    <p className="text-xs text-gray-400">Enhanced filtering for CMAC organization emails</p>
                  </div>
                  <Switch
                    checked={settings.emailFilters.enableCMACCatchall}
                    onCheckedChange={(checked) => updateSetting('emailFilters', 'enableCMACCatchall', checked)}
                    data-testid="switch-cmac-filter"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Urgency Threshold (1-5)</Label>
                  <Input
                    type="number"
                    min="1"
                    max="5"
                    value={settings.emailFilters.urgencyThreshold}
                    onChange={(e) => updateSetting('emailFilters', 'urgencyThreshold', parseInt(e.target.value))}
                    data-testid="input-urgency-threshold"
                  />
                  <p className="text-xs text-gray-400">Emails above this level will be prioritized</p>
                </div>

                <div className="space-y-2">
                  <Label>Spam Filter Level</Label>
                  <Select value={settings.emailFilters.spamFilterLevel} onValueChange={(value) => updateSetting('emailFilters', 'spamFilterLevel', value)}>
                    <SelectTrigger data-testid="select-spam-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - Allow most emails</SelectItem>
                      <SelectItem value="medium">Medium - Balanced filtering</SelectItem>
                      <SelectItem value="high">High - Strict filtering</SelectItem>
                      <SelectItem value="custom">Custom - AI learning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Reply to Important Emails</Label>
                    <p className="text-xs text-gray-400">AI-generated responses for urgent emails</p>
                  </div>
                  <Switch
                    checked={settings.emailFilters.autoReply}
                    onCheckedChange={(checked) => updateSetting('emailFilters', 'autoReply', checked)}
                    data-testid="switch-auto-reply"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Allowed Domains</Label>
                  <p className="text-xs text-gray-400 mb-2">
                    Domains that bypass strict filtering. Emails from these domains are automatically trusted and will receive faster processing. 
                    This helps ensure important communications from your organization and key partners are never missed.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {settings.emailFilters.allowedDomains.map((domain) => (
                      <Badge key={domain} variant="secondary" className="flex items-center gap-1">
                        {domain}
                        <button
                          onClick={() => removeDomain(domain)}
                          className="ml-1 hover:text-red-400"
                          data-testid={`button-remove-domain-${domain}`}
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter domain (e.g., company.com)"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addDomain((e.target as HTMLInputElement).value);
                          (e.target as HTMLInputElement).value = '';
                        }
                      }}
                      data-testid="input-add-domain"
                    />
                    <Button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        addDomain(input.value);
                        input.value = '';
                      }}
                      variant="outline"
                      data-testid="button-add-domain"
                    >
                      Add
                    </Button>
                  </div>
                </div>

                {settings.emailFilters.autoReply && (
                  <div className="space-y-2">
                    <Label>Auto-Reply Email Addresses</Label>
                    <p className="text-xs text-gray-400 mb-2">
                      Specific email addresses that will receive AI-generated auto-replies. The AI will analyze 
                      previous email history with these contacts to match their communication style and tone.
                    </p>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {settings.emailFilters.autoReplyEmails.map((email) => (
                        <Badge key={email} variant="secondary" className="flex items-center gap-1">
                          {email}
                          <button
                            onClick={() => removeAutoReplyEmail(email)}
                            className="ml-1 hover:text-red-400"
                            data-testid={`button-remove-email-${email.replace('@', '-at-')}`}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Enter email address (e.g., boss@company.com)"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            addAutoReplyEmail((e.target as HTMLInputElement).value);
                            (e.target as HTMLInputElement).value = '';
                          }
                        }}
                        data-testid="input-add-auto-reply-email"
                      />
                      <Button
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          addAutoReplyEmail(input.value);
                          input.value = '';
                        }}
                        variant="outline"
                        data-testid="button-add-auto-reply-email"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 mt-2">
                      <p className="text-sm text-blue-400">
                        🧠 AI Learning: When enabled, AmayAI analyzes email history with these contacts to adapt 
                        response tone, formality level, and communication patterns for personalized auto-replies.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Continuous Google Tasks Sync</Label>
                    <p className="text-xs text-gray-400">Automatically sync and generate AI draft tasks from email/calendar activity</p>
                  </div>
                  <Switch
                    checked={settings.emailFilters.continuousTaskSync}
                    onCheckedChange={(checked) => updateSetting('emailFilters', 'continuousTaskSync', checked)}
                    data-testid="switch-continuous-task-sync"
                  />
                </div>

                {settings.emailFilters.continuousTaskSync && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
                    <p className="text-sm text-purple-400">
                      🔄 Continuous Sync Active: AmayAI continuously monitors your emails and calendar events to automatically 
                      generate draft tasks in Google Tasks. These AI-suggested tasks appear as drafts that you can approve or dismiss. 
                      The system learns from your approval patterns to improve future suggestions.
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* AI Settings */}
            <TabsContent value="ai" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neon-magenta">AI Preferences</h3>
                
                <div className="space-y-2">
                  <Label>Response Style</Label>
                  <Select value={settings.aiPreferences.responseStyle} onValueChange={(value) => updateSetting('aiPreferences', 'responseStyle', value)}>
                    <SelectTrigger data-testid="select-response-style">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional - Formal tone</SelectItem>
                      <SelectItem value="friendly">Friendly - Casual and warm</SelectItem>
                      <SelectItem value="concise">Concise - Brief and direct</SelectItem>
                      <SelectItem value="detailed">Detailed - Comprehensive responses</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Creativity Level: {settings.aiPreferences.creativityLevel}/10</Label>
                  <Input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.aiPreferences.creativityLevel}
                    onChange={(e) => updateSetting('aiPreferences', 'creativityLevel', parseInt(e.target.value))}
                    className="w-full"
                    data-testid="slider-creativity"
                  />
                  <p className="text-xs text-gray-400">Higher values generate more creative and varied responses</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Suggestions</Label>
                    <p className="text-xs text-gray-400">Proactive task and email suggestions</p>
                  </div>
                  <Switch
                    checked={settings.aiPreferences.autoSuggestions}
                    onCheckedChange={(checked) => updateSetting('aiPreferences', 'autoSuggestions', checked)}
                    data-testid="switch-auto-suggestions"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Proactive Mode</Label>
                    <p className="text-xs text-gray-400">AI anticipates needs and takes initiative</p>
                  </div>
                  <Switch
                    checked={settings.aiPreferences.proactiveMode}
                    onCheckedChange={(checked) => updateSetting('aiPreferences', 'proactiveMode', checked)}
                    data-testid="switch-proactive-mode"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Learning Mode</Label>
                    <p className="text-xs text-gray-400">AI learns from your preferences and patterns</p>
                  </div>
                  <Switch
                    checked={settings.aiPreferences.learningEnabled}
                    onCheckedChange={(checked) => updateSetting('aiPreferences', 'learningEnabled', checked)}
                    data-testid="switch-learning-mode"
                  />
                </div>
                
                {settings.aiPreferences.learningEnabled && (
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-sm text-green-400">
                      📚 Learning Mode Active: AmayAI is analyzing your email patterns, response times, communication style, 
                      and task preferences to provide increasingly personalized assistance. 
                      <a href="/AI_LEARNING_MODE.md" target="_blank" className="underline ml-1">
                        View detailed learning documentation
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Calendar Settings */}
            <TabsContent value="calendar" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neon-green">Calendar Management</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto-Scheduling</Label>
                    <p className="text-xs text-gray-400">Automatically schedule meetings from emails</p>
                  </div>
                  <Switch
                    checked={settings.calendar.autoScheduling}
                    onCheckedChange={(checked) => updateSetting('calendar', 'autoScheduling', checked)}
                    data-testid="switch-auto-scheduling"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Working Hours Start</Label>
                    <Input
                      type="time"
                      value={settings.calendar.workingHours.start}
                      onChange={(e) => updateSetting('calendar', 'workingHours', { ...settings.calendar.workingHours, start: e.target.value })}
                      data-testid="input-work-start"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Working Hours End</Label>
                    <Input
                      type="time"
                      value={settings.calendar.workingHours.end}
                      onChange={(e) => updateSetting('calendar', 'workingHours', { ...settings.calendar.workingHours, end: e.target.value })}
                      data-testid="input-work-end"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Buffer Time (minutes)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="60"
                    value={settings.calendar.bufferTime}
                    onChange={(e) => updateSetting('calendar', 'bufferTime', parseInt(e.target.value))}
                    data-testid="input-buffer-time"
                  />
                  <p className="text-xs text-gray-400">Time between meetings for transitions</p>
                </div>

                <div className="space-y-2">
                  <Label>Time Zone</Label>
                  <Select value={settings.calendar.timeZone} onValueChange={(value) => updateSetting('calendar', 'timeZone', value)}>
                    <SelectTrigger data-testid="select-timezone">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="UTC">UTC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Conflict Resolution</Label>
                  <Select value={settings.calendar.conflictResolution} onValueChange={(value) => updateSetting('calendar', 'conflictResolution', value)}>
                    <SelectTrigger data-testid="select-conflict-resolution">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="suggest_alternatives">Suggest Alternatives</SelectItem>
                      <SelectItem value="reschedule_existing">Reschedule Existing</SelectItem>
                      <SelectItem value="decline_new">Decline New</SelectItem>
                      <SelectItem value="ask_user">Ask User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-neon-orange">Notification Preferences</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-xs text-gray-400">Browser notifications and WebSocket alerts in dashboard</p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'emailNotifications', checked)}
                    data-testid="switch-email-notifications"
                  />
                </div>
                
                {settings.notifications.emailNotifications && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
                    <p className="text-sm text-yellow-400">
                      📨 Notification Delivery: Email notifications appear as browser push notifications (if enabled), 
                      real-time updates in the dashboard via WebSocket connections, and status changes in the system status panel. 
                      For external notifications like test emails, ensure your browser allows notifications from this domain.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Slack Notifications</Label>
                    <p className="text-xs text-gray-400">Send updates to Slack channels</p>
                  </div>
                  <Switch
                    checked={settings.notifications.slackNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'slackNotifications', checked)}
                    data-testid="switch-slack-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Desktop Notifications</Label>
                    <p className="text-xs text-gray-400">Browser push notifications</p>
                  </div>
                  <Switch
                    checked={settings.notifications.desktopNotifications}
                    onCheckedChange={(checked) => updateSetting('notifications', 'desktopNotifications', checked)}
                    data-testid="switch-desktop-notifications"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Urgent Only Mode</Label>
                    <p className="text-xs text-gray-400">Only notify for high-priority items</p>
                  </div>
                  <Switch
                    checked={settings.notifications.urgentOnly}
                    onCheckedChange={(checked) => updateSetting('notifications', 'urgentOnly', checked)}
                    data-testid="switch-urgent-only"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Quiet Hours Start</Label>
                    <Input
                      type="time"
                      value={settings.notifications.quietHours.start}
                      onChange={(e) => updateSetting('notifications', 'quietHours', { ...settings.notifications.quietHours, start: e.target.value })}
                      data-testid="input-quiet-start"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quiet Hours End</Label>
                    <Input
                      type="time"
                      value={settings.notifications.quietHours.end}
                      onChange={(e) => updateSetting('notifications', 'quietHours', { ...settings.notifications.quietHours, end: e.target.value })}
                      data-testid="input-quiet-end"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-400">Security & Privacy</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-xs text-gray-400">Add extra security to your account</p>
                  </div>
                  <Switch
                    checked={settings.security.twoFactorAuth}
                    onCheckedChange={(checked) => updateSetting('security', 'twoFactorAuth', checked)}
                    data-testid="switch-2fa"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <Input
                    type="number"
                    min="15"
                    max="480"
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                    data-testid="input-session-timeout"
                  />
                  <p className="text-xs text-gray-400">Automatically log out after inactivity</p>
                </div>

                <div className="space-y-2">
                  <Label>Data Retention (days)</Label>
                  <Input
                    type="number"
                    min="30"
                    max="365"
                    value={settings.security.dataRetention}
                    onChange={(e) => updateSetting('security', 'dataRetention', parseInt(e.target.value))}
                    data-testid="input-data-retention"
                  />
                  <p className="text-xs text-gray-400">How long to keep processed data</p>
                </div>

                <div className="space-y-2">
                  <Label>Encryption Level</Label>
                  <Select value={settings.security.encryptionLevel} onValueChange={(value) => updateSetting('security', 'encryptionLevel', value)}>
                    <SelectTrigger data-testid="select-encryption">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="standard">Standard - AES-128</SelectItem>
                      <SelectItem value="high">High - AES-256</SelectItem>
                      <SelectItem value="maximum">Maximum - AES-256 + Key Rotation</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium text-gray-300">Data Management</h4>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => exportDataMutation.mutate()}
                      disabled={exportDataMutation.isPending}
                      className="flex items-center gap-2"
                      data-testid="button-export-data"
                    >
                      <Download className="w-4 h-4" />
                      {exportDataMutation.isPending ? "Exporting..." : "Export Data"}
                    </Button>
                    
                    <Button
                      variant="outline"
                      onClick={() => clearDataMutation.mutate()}
                      disabled={clearDataMutation.isPending}
                      className="flex items-center gap-2 text-red-400 border-red-400/30 hover:bg-red-400/10"
                      data-testid="button-clear-data"
                    >
                      <Trash2 className="w-4 h-4" />
                      {clearDataMutation.isPending ? "Clearing..." : "Clear All Data"}
                    </Button>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Appearance Settings */}
            <TabsContent value="appearance" className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-purple-400">Appearance & Theme</h3>
                
                <div className="space-y-2">
                  <Label>Theme</Label>
                  <Select value={settings.appearance.theme} onValueChange={(value) => updateSetting('appearance', 'theme', value)}>
                    <SelectTrigger data-testid="select-theme">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dark">Dark - Full cyberpunk experience</SelectItem>
                      <SelectItem value="light">Light - Clean and minimal</SelectItem>
                      <SelectItem value="auto">Auto - Follow system preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Neon Intensity: {settings.appearance.neonIntensity}/10</Label>
                  <Input
                    type="range"
                    min="1"
                    max="10"
                    value={settings.appearance.neonIntensity}
                    onChange={(e) => updateSetting('appearance', 'neonIntensity', parseInt(e.target.value))}
                    className="w-full"
                    data-testid="slider-neon-intensity"
                  />
                  <p className="text-xs text-gray-400">Control the brightness of neon effects</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Compact Mode</Label>
                    <p className="text-xs text-gray-400">Reduce spacing for more content</p>
                  </div>
                  <Switch
                    checked={settings.appearance.compactMode}
                    onCheckedChange={(checked) => updateSetting('appearance', 'compactMode', checked)}
                    data-testid="switch-compact-mode"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Animations</Label>
                    <p className="text-xs text-gray-400">Enable smooth transitions and effects</p>
                  </div>
                  <Switch
                    checked={settings.appearance.animations}
                    onCheckedChange={(checked) => updateSetting('appearance', 'animations', checked)}
                    data-testid="switch-animations"
                  />
                </div>
              </div>
            </TabsContent>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={onClose} data-testid="button-cancel">
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSettings({
                    emailFilters: { enableCMACCatchall: true, urgencyThreshold: 3, autoReply: false, spamFilterLevel: "medium", allowedDomains: ["cmac.org", "gmail.com"] },
                    aiPreferences: { responseStyle: "professional", creativityLevel: 7, autoSuggestions: true, proactiveMode: true, learningEnabled: true },
                    notifications: { emailNotifications: true, slackNotifications: true, desktopNotifications: true, quietHours: { start: "22:00", end: "08:00" }, urgentOnly: false },
                    calendar: { autoScheduling: true, bufferTime: 15, workingHours: { start: "09:00", end: "17:00" }, timeZone: "America/New_York", conflictResolution: "suggest_alternatives" },
                    security: { twoFactorAuth: false, sessionTimeout: 60, dataRetention: 90, encryptionLevel: "high" },
                    appearance: { theme: "dark", neonIntensity: 8, compactMode: false, animations: true }
                  });
                }}
                data-testid="button-reset"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveSettingsMutation.isPending}
                className="neon-button neon-button-cyan"
                data-testid="button-save"
              >
                <Save className="w-4 h-4 mr-2" />
                {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}