import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Settings, Bot, Mail, Bell, Filter, Lightbulb } from 'lucide-react';

interface UserSettings {
  emailFilters: {
    skipCatchAll: boolean;
    skipPrefixes: string[];
    autoClassify: boolean;
  };
  aiSettings: {
    autoTaskCreation: boolean;
    proactiveSuggestions: boolean;
    meetingPrep: boolean;
    smartReplies: boolean;
  };
  notifications: {
    slack: boolean;
    urgentOnly: boolean;
  };
}

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<UserSettings>({
    emailFilters: {
      skipCatchAll: true,
      skipPrefixes: ['[CMAC_CATCHALL]'],
      autoClassify: true
    },
    aiSettings: {
      autoTaskCreation: true,
      proactiveSuggestions: true,
      meetingPrep: true,
      smartReplies: true
    },
    notifications: {
      slack: true,
      urgentOnly: false
    }
  });

  const { data: userSettings } = useQuery({
    queryKey: ['/api/user/settings'],
    enabled: isOpen
  });

  const saveSettingsMutation = useMutation({
    mutationFn: async (newSettings: UserSettings) => {
      const response = await apiRequest('PUT', '/api/user/settings', newSettings);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Settings Saved',
        description: 'Your preferences have been updated successfully.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/user/profile'] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to save settings: ${error.message}`,
        variant: 'destructive',
      });
    }
  });

  useEffect(() => {
    if (userSettings && typeof userSettings === 'object') {
      setSettings(userSettings as UserSettings);
    }
  }, [userSettings]);

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const addEmailPrefix = () => {
    const newPrefix = prompt('Enter email prefix to filter (e.g., [SPAM]):');
    if (newPrefix && !settings.emailFilters.skipPrefixes.includes(newPrefix)) {
      setSettings(prev => ({
        ...prev,
        emailFilters: {
          ...prev.emailFilters,
          skipPrefixes: [...prev.emailFilters.skipPrefixes, newPrefix]
        }
      }));
    }
  };

  const removeEmailPrefix = (prefix: string) => {
    setSettings(prev => ({
      ...prev,
      emailFilters: {
        ...prev.emailFilters,
        skipPrefixes: prev.emailFilters.skipPrefixes.filter(p => p !== prefix)
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-card max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl font-bold gradient-text">
            <Settings className="w-5 h-5 mr-2 text-neon-cyan" />
            AmayAI Settings
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="email" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="email" className="flex items-center">
              <Mail className="w-4 h-4 mr-1" />
              Email
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center">
              <Bot className="w-4 h-4 mr-1" />
              AI Features
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <Bell className="w-4 h-4 mr-1" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="advanced" className="flex items-center">
              <Lightbulb className="w-4 h-4 mr-1" />
              Advanced
            </TabsTrigger>
          </TabsList>

          <TabsContent value="email" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neon-green">Email Filtering</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-classify">Auto-classify emails with AI</Label>
                  <p className="text-sm text-gray-400">Automatically categorize incoming emails</p>
                </div>
                <Switch
                  id="auto-classify"
                  checked={settings.emailFilters.autoClassify}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      emailFilters: { ...prev.emailFilters, autoClassify: checked }
                    }))
                  }
                />
              </div>

              <Separator />

              <div>
                <Label>Email Prefixes to Skip</Label>
                <p className="text-sm text-gray-400 mb-3">
                  Emails with these prefixes will be ignored during triage
                </p>
                <div className="space-y-2">
                  {settings.emailFilters.skipPrefixes.map((prefix, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-700/50 p-2 rounded">
                      <span className="text-sm">{prefix}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-400 hover:text-red-300"
                        onClick={() => removeEmailPrefix(prefix)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10"
                    onClick={addEmailPrefix}
                  >
                    Add Prefix
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neon-magenta">AI Productivity Features</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-task-creation">Auto Task Creation</Label>
                  <p className="text-sm text-gray-400">Create tasks from emails and calendar events</p>
                </div>
                <Switch
                  id="auto-task-creation"
                  checked={settings.aiSettings.autoTaskCreation}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      aiSettings: { ...prev.aiSettings, autoTaskCreation: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="proactive-suggestions">Proactive Suggestions</Label>
                  <p className="text-sm text-gray-400">Get AI suggestions based on your activity</p>
                </div>
                <Switch
                  id="proactive-suggestions"
                  checked={settings.aiSettings.proactiveSuggestions}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      aiSettings: { ...prev.aiSettings, proactiveSuggestions: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="meeting-prep">Smart Meeting Preparation</Label>
                  <p className="text-sm text-gray-400">Auto-generate agendas and prep materials</p>
                </div>
                <Switch
                  id="meeting-prep"
                  checked={settings.aiSettings.meetingPrep}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      aiSettings: { ...prev.aiSettings, meetingPrep: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="smart-replies">Smart Reply Suggestions</Label>
                  <p className="text-sm text-gray-400">AI-generated email reply options</p>
                </div>
                <Switch
                  id="smart-replies"
                  checked={settings.aiSettings.smartReplies}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      aiSettings: { ...prev.aiSettings, smartReplies: checked }
                    }))
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neon-blue">Notification Settings</h3>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="slack-notifications">Slack Notifications</Label>
                  <p className="text-sm text-gray-400">Send updates to Slack</p>
                </div>
                <Switch
                  id="slack-notifications"
                  checked={settings.notifications.slack}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, slack: checked }
                    }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="urgent-only">Urgent Notifications Only</Label>
                  <p className="text-sm text-gray-400">Only notify for urgent items</p>
                </div>
                <Switch
                  id="urgent-only"
                  checked={settings.notifications.urgentOnly}
                  onCheckedChange={(checked) => 
                    setSettings(prev => ({
                      ...prev,
                      notifications: { ...prev.notifications, urgentOnly: checked }
                    }))
                  }
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-neon-yellow">Advanced Settings</h3>
              <p className="text-sm text-gray-400">
                Advanced configuration options for power users. Changes here may affect system performance.
              </p>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                <p className="text-sm text-yellow-400">
                  🔧 Advanced features coming soon! These will include custom AI prompts, 
                  API integrations, and workflow automation settings.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            className="neon-button neon-button-cyan"
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
          >
            {saveSettingsMutation.isPending ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}