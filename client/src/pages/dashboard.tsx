import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sidebar } from "@/components/layout/sidebar";
import { FileText, Clock, ListTodo, Users, Share2, Download } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { isUnauthorizedError } from "@/lib/authUtils";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: meetings, isLoading: meetingsLoading } = useQuery({
    queryKey: ["/api/meetings"],
    enabled: isAuthenticated,
  });

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

  const handleShare = async (meeting: any) => {
    const shareUrl = `${window.location.origin}/summaries?meeting=${meeting.id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Meeting Summary: ${meeting.title}`,
          text: `Check out this meeting summary from ${new Date(meeting.date).toLocaleDateString()}`,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast({
          title: "Link copied",
          description: "Meeting summary link copied to clipboard",
        });
      }
    } catch (error) {
      console.error('Share failed:', error);
      toast({
        title: "Share failed",
        description: "Could not share meeting summary",
        variant: "destructive",
      });
    }
  };

  const handleDownload = (meeting: any) => {
    const content = [
      `Meeting Summary: ${meeting.title}`,
      `Date: ${new Date(meeting.date).toLocaleDateString()}`,
      meeting.duration ? `Duration: ${meeting.duration}` : '',
      meeting.participants ? `Participants: ${meeting.participants}` : '',
      '',
      'Summary:',
      meeting.summary || 'No summary available',
      '',
    ];

    if (meeting.actionItems && meeting.actionItems.length > 0) {
      content.push('Action Items:');
      meeting.actionItems
        .filter((item: any) => typeof item === 'string' && item !== '[object Object]')
        .forEach((item: string, index: number) => {
          content.push(`${index + 1}. ${item}`);
        });
      content.push('');
    }

    if (meeting.keyDecisions && meeting.keyDecisions.length > 0) {
      content.push('Key Decisions:');
      meeting.keyDecisions
        .filter((decision: any) => typeof decision === 'string' && decision !== '[object Object]')
        .forEach((decision: string, index: number) => {
          content.push(`${index + 1}. ${decision}`);
        });
      content.push('');
    }

    if (meeting.transcription) {
      content.push('Full Transcription:');
      content.push(meeting.transcription);
    }

    const blob = new Blob([content.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${meeting.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summary.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download started",
      description: "Meeting summary downloaded successfully",
    });
  };

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  const stats = {
    totalSummaries: meetings?.length || 0,
    hoursTranscribed: meetings?.reduce((acc, meeting) => {
      const duration = meeting.duration ? parseInt(meeting.duration) : 30;
      return acc + duration;
    }, 0) || 0,
    actionItems: meetings?.reduce((acc, meeting) => acc + (meeting.actionItems?.length || 0), 0) || 0,
    participants: meetings?.reduce((acc, meeting) => {
      const participantCount = meeting.participants ? meeting.participants.split(',').length : 3;
      return acc + participantCount;
    }, 0) || 0,
  };

  const recentMeetings = meetings?.slice(0, 3) || [];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Welcome back! Here's your meeting summary overview.</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                    <FileText className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalSummaries}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Summaries</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(stats.hoursTranscribed / 60)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Hours Transcribed</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                    <ListTodo className="w-5 h-5 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.actionItems}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Action Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                    <Users className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{Math.round(stats.participants / Math.max(stats.totalSummaries, 1))}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Avg Participants</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Summaries */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Summaries</CardTitle>
                <Link href="/summaries">
                  <Button variant="outline" size="sm">View all</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {meetingsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : recentMeetings.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No meetings yet</h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">Upload your first meeting recording to get started.</p>
                  <Link href="/upload">
                    <Button>Upload Recording</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {recentMeetings.map((meeting) => (
                    <div key={meeting.id} className="py-6 px-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-lg -mx-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 dark:text-white">{meeting.title}</h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(meeting.date).toLocaleDateString()} • {meeting.duration || '30 minutes'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            {meeting.keyDecisions && meeting.keyDecisions.length > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">
                                <FileText className="w-3 h-3 mr-1" />
                                {meeting.keyDecisions.length} Decisions
                              </span>
                            )}
                            {meeting.actionItems && meeting.actionItems.length > 0 && (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400">
                                <ListTodo className="w-3 h-3 mr-1" />
                                {meeting.actionItems.length} Action Items
                              </span>
                            )}
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              meeting.status === 'completed' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400' :
                              meeting.status === 'failed' ? 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400' :
                              'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400'
                            }`}>
                              {meeting.status}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleShare(meeting)}
                          >
                            <Share2 className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDownload(meeting)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
