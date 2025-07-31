import { useQuery } from "@tanstack/react-query";
import { GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Server, Wifi, Cloud, Bot, MessageSquare, Calendar, Mail } from "lucide-react";

interface SystemStatus {
  service: string;
  status: 'online' | 'processing' | 'warning' | 'error';
  lastCheck: string;
  responseTime?: number;
}

export function SystemStatus() {
  // Mock system status for now - in production this would check actual API health
  const systemServices: SystemStatus[] = [
    { service: 'Gmail API', status: 'online', lastCheck: new Date().toISOString(), responseTime: 150 },
    { service: 'Calendar API', status: 'online', lastCheck: new Date().toISOString(), responseTime: 120 },
    { service: 'Tasks API', status: 'processing', lastCheck: new Date().toISOString(), responseTime: 300 },
    { service: 'Slack Integration', status: 'online', lastCheck: new Date().toISOString(), responseTime: 80 },
    { service: 'OpenAI GPT-4', status: 'online', lastCheck: new Date().toISOString(), responseTime: 250 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'status-online';
      case 'processing':
        return 'status-processing';
      case 'warning':
        return 'status-warning';
      case 'error':
        return 'status-error';
      default:
        return 'text-gray-400';
    }
  };

  const getStatusIcon = (service: string) => {
    switch (service) {
      case 'Gmail API':
        return <Mail className="w-4 h-4" />;
      case 'Calendar API':
        return <Calendar className="w-4 h-4" />;
      case 'Tasks API':
        return <Server className="w-4 h-4" />;
      case 'Slack Integration':
        return <MessageSquare className="w-4 h-4" />;
      case 'OpenAI GPT-4':
        return <Bot className="w-4 h-4" />;
      default:
        return <Cloud className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'processing':
        return 'Syncing';
      case 'warning':
        return 'Warning';
      case 'error':
        return 'Error';
      default:
        return 'Unknown';
    }
  };

  return (
    <GlassCard className="p-6 border border-gray-600/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Server className="mr-3 text-gray-400" />
          System Status
        </h3>
        <div className="flex items-center space-x-1">
          <Wifi className="w-4 h-4 text-neon-green" />
          <span className="text-xs text-gray-400">Live</span>
        </div>
      </div>

      <div className="space-y-3">
        {systemServices.map((service, index) => (
          <div 
            key={service.service}
            className="flex items-center justify-between p-2 bg-gray-800/30 rounded-lg hover:bg-gray-800/50 transition-colors"
            data-testid={`system-status-${service.service.toLowerCase().replace(/\s+/g, '-')}`}
          >
            <div className="flex items-center space-x-3">
              <div className="text-gray-400">
                {getStatusIcon(service.service)}
              </div>
              <div>
                <span className="text-sm font-medium">{service.service}</span>
                {service.responseTime && (
                  <p className="text-xs text-gray-500">{service.responseTime}ms</p>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                service.status === 'online' ? 'bg-neon-green animate-pulse' :
                service.status === 'processing' ? 'bg-neon-blue animate-pulse' :
                service.status === 'warning' ? 'bg-neon-yellow animate-pulse' :
                'bg-red-500 animate-pulse'
              }`}></div>
              <span className={`text-xs ${getStatusColor(service.status)}`}>
                {getStatusText(service.status)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Integration Summary */}
      <div className="mt-6 pt-4 border-t border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <h4 className="text-sm font-semibold text-neon-green mb-1">Google Workspace</h4>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-neon-blue rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">Connected</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neon-magenta mb-1">AI Services</h4>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">Active</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-neon-blue mb-1">Communication</h4>
            <div className="flex justify-center space-x-1">
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-neon-green rounded-full animate-pulse"></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">Online</p>
          </div>
        </div>
      </div>

      {/* Last Update */}
      <div className="mt-4 pt-3 border-t border-gray-700/50">
        <p className="text-xs text-gray-500 text-center">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </GlassCard>
  );
}
