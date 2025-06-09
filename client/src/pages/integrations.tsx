import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Sidebar } from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Zap, 
  Mail, 
  Calendar, 
  Settings,
  MessageSquare,
  CheckCircle,
  X
} from "lucide-react";
import { useEffect } from "react";
import type { Integration } from "@shared/schema";

interface SlackIntegrationForm {
  channelId: string;
  webhookUrl: string;
}

interface EmailIntegrationForm {
  recipients: string;
  subject: string;
}

export default function Integrations() {
  const [slackForm, setSlackForm] = useState<SlackIntegrationForm>({
    channelId: "",
    webhookUrl: "",
  });
  const [emailForm, setEmailForm] = useState<EmailIntegrationForm>({
    recipients: "",
    subject: "Meeting Summary: {title}",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: integrations, isLoading: integrationsLoading } = useQuery({
    queryKey: ["/api/integrations"],
    enabled: isAuthenticated,
  });

  const createIntegrationMutation = useMutation({
    mutationFn: async (integrationData: { type: string; settings: any }) => {
      const response = await apiRequest("POST", "/api/integrations", integrationData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Integration created",
        description: "Your integration has been set up successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Integration failed",
        description: error.message || "Failed to create integration",
        variant: "destructive",
      });
    },
  });

  const updateIntegrationMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Integration> }) => {
      const response = await apiRequest("PUT", `/api/integrations/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Integration updated",
        description: "Your integration settings have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Update failed",
        description: error.message || "Failed to update integration",
        variant: "destructive",
      });
    },
  });

  const handleSlackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!slackForm.channelId) {
      toast({
        title: "Missing channel ID",
        description: "Please enter a Slack channel ID",
        variant: "destructive",
      });
      return;
    }

    createIntegrationMutation.mutate({
      type: "slack",
      settings: {
        channelId: slackForm.channelId,
        webhookUrl: slackForm.webhookUrl,
      },
    });
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!emailForm.recipients) {
      toast({
        title: "Missing recipients",
        description: "Please enter email recipients",
        variant: "destructive",
      });
      return;
    }

    createIntegrationMutation.mutate({
      type: "email",
      settings: {
        recipients: emailForm.recipients.split(',').map(email => email.trim()),
        subject: emailForm.subject,
      },
    });
  };

  const handleToggleIntegration = (integration: Integration) => {
    updateIntegrationMutation.mutate({
      id: integration.id,
      updates: { isEnabled: !integration.isEnabled },
    });
  };

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  const slackIntegration = integrations?.find((i: Integration) => i.type === "slack");
  const emailIntegration = integrations?.find((i: Integration) => i.type === "email");

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Integrations</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Connect SummarizeAI with your favorite tools</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Slack Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle>Slack</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Send summaries to Slack channels</p>
                    </div>
                  </div>
                  {slackIntegration ? (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-accent" />
                      <Switch
                        checked={slackIntegration.isEnabled}
                        onCheckedChange={() => handleToggleIntegration(slackIntegration)}
                      />
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                {!slackIntegration ? (
                  <form onSubmit={handleSlackSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="channelId">Channel ID</Label>
                      <Input
                        id="channelId"
                        placeholder="C1234567890"
                        value={slackForm.channelId}
                        onChange={(e) => setSlackForm(prev => ({ ...prev, channelId: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Find your channel ID in Slack channel settings
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="webhookUrl">Webhook URL (Optional)</Label>
                      <Input
                        id="webhookUrl"
                        placeholder="https://hooks.slack.com/..."
                        value={slackForm.webhookUrl}
                        onChange={(e) => setSlackForm(prev => ({ ...prev, webhookUrl: e.target.value }))}
                      />
                    </div>
                    <Button 
                      type="submit" 
                      disabled={createIntegrationMutation.isPending}
                      className="w-full"
                    >
                      Connect Slack
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Connected to channel: <code className="font-mono">{slackIntegration.settings.channelId}</code>
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Settings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Email Integration */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                      <Mail className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Email</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Send summaries via email</p>
                    </div>
                  </div>
                  {emailIntegration ? (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-accent" />
                      <Switch
                        checked={emailIntegration.isEnabled}
                        onCheckedChange={() => handleToggleIntegration(emailIntegration)}
                      />
                    </div>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                {!emailIntegration ? (
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="recipients">Recipients</Label>
                      <Input
                        id="recipients"
                        placeholder="john@company.com, team@company.com"
                        value={emailForm.recipients}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, recipients: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Separate multiple emails with commas
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="subject">Subject Template</Label>
                      <Input
                        id="subject"
                        value={emailForm.subject}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Use {"{title}"} to include meeting title
                      </p>
                    </div>
                    <Button 
                      type="submit" 
                      disabled={createIntegrationMutation.isPending}
                      className="w-full"
                    >
                      Connect Email
                    </Button>
                  </form>
                ) : (
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Sending to: {Array.isArray(emailIntegration.settings.recipients) 
                          ? emailIntegration.settings.recipients.join(', ') 
                          : emailIntegration.settings.recipients}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure Settings
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Coming Soon Integrations */}
            <Card className="opacity-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-xl flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <CardTitle>Google Calendar</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Auto-detect meeting details</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Coming Soon</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Automatically pull meeting titles, participants, and dates from your Google Calendar events.
                </p>
              </CardContent>
            </Card>

            <Card className="opacity-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle>Microsoft Teams</CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Connect with Teams meetings</p>
                    </div>
                  </div>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Coming Soon</span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Share meeting summaries directly in Teams channels and access meeting recordings seamlessly.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Global Integration Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Global Integration Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Auto-send summaries</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Automatically send summaries after processing</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Include transcription</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Attach full transcription to summaries</p>
                  </div>
                  <Switch />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">Weekly digest</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Send weekly summary of all meetings</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
