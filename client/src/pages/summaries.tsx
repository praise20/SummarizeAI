import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Sidebar } from "@/components/layout/sidebar";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { 
  Search, 
  FileText, 
  Users, 
  Share2, 
  Download, 
  MoreHorizontal, 
  Plus,
  CheckCircle,
  ListTodo,
  Calendar,
  Clock,
  Trash2,
  X
} from "lucide-react";
import { Link } from "wouter";
import { useEffect } from "react";
import type { Meeting } from "@shared/schema";

export default function Summaries() {
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  
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

  const { data: meetings, isLoading: meetingsLoading } = useQuery({
    queryKey: ["/api/meetings", { search: searchQuery }],
    enabled: isAuthenticated,
  });

  const deleteMutation = useMutation({
    mutationFn: async (meetingId: number) => {
      await apiRequest("DELETE", `/api/meetings/${meetingId}`);
    },
    onSuccess: () => {
      toast({
        title: "Meeting deleted",
        description: "The meeting summary has been deleted successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
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
        title: "Delete failed",
        description: error.message || "Failed to delete meeting",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (meetingId: number) => {
    if (confirm("Are you sure you want to delete this meeting summary?")) {
      deleteMutation.mutate(meetingId);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    queryClient.invalidateQueries({ queryKey: ["/api/meetings"] });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400">Completed</Badge>;
      case "transcribing":
        return <Badge className="bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400">Transcribing</Badge>;
      case "summarizing":
        return <Badge className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400">Summarizing</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  const filteredMeetings = meetings?.filter((meeting: Meeting) => {
    // Apply date filter
    if (dateFilter !== "all") {
      const meetingDate = new Date(meeting.date);
      const now = new Date();
      
      switch (dateFilter) {
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (meetingDate < weekAgo) return false;
          break;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          if (meetingDate < monthAgo) return false;
          break;
        case "quarter":
          const quarterAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          if (meetingDate < quarterAgo) return false;
          break;
      }
    }

    return true;
  }) || [];

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <div className="p-8">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Summaries</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">All your meeting summaries in one place</p>
            </div>
            <Link href="/upload">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Summary
              </Button>
            </Link>
          </div>

          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <form onSubmit={handleSearch} className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search summaries..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="flex space-x-4">
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Dates</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">Last 3 Months</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="team">Team Meetings</SelectItem>
                      <SelectItem value="client">Client Calls</SelectItem>
                      <SelectItem value="interview">Interviews</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Summaries Grid */}
          {meetingsLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredMeetings.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {searchQuery ? "No summaries found" : "No meetings yet"}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {searchQuery 
                    ? "Try adjusting your search terms or filters" 
                    : "Upload your first meeting recording to get started."
                  }
                </p>
                <Link href="/upload">
                  <Button>Upload Recording</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMeetings.map((meeting: Meeting) => (
                <Card key={meeting.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{meeting.title}</h3>
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-2">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(meeting.date).toLocaleDateString()}</span>
                          {meeting.duration && (
                            <>
                              <span>•</span>
                              <Clock className="w-3 h-3" />
                              <span>{meeting.duration}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Share2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(meeting.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="flex items-center justify-between">
                        {getStatusBadge(meeting.status)}
                        <div className="flex items-center space-x-2">
                          {meeting.keyDecisions && meeting.keyDecisions.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              {meeting.keyDecisions.length} Decisions
                            </Badge>
                          )}
                          {meeting.actionItems && meeting.actionItems.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <ListTodo className="w-3 h-3 mr-1" />
                              {meeting.actionItems.length} Actions
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {meeting.summary && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                          {(() => {
                            try {
                              const parsed = JSON.parse(meeting.summary);
                              if (Array.isArray(parsed)) {
                                const text = parsed.join('. ');
                                return text.length > 120 ? `${text.substring(0, 120)}...` : text;
                              }
                              return meeting.summary.length > 120 
                                ? `${meeting.summary.substring(0, 120)}...` 
                                : meeting.summary;
                            } catch {
                              return meeting.summary.length > 120 
                                ? `${meeting.summary.substring(0, 120)}...` 
                                : meeting.summary;
                            }
                          })()}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                        <Users className="w-4 h-4" />
                        <span>
                          {meeting.participants 
                            ? `${meeting.participants.split(',').length} participants`
                            : "No participants listed"
                          }
                        </span>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-xl font-bold">{meeting.title}</DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-6">
                            {/* Meeting Info */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">
                                  {new Date(meeting.date).toLocaleDateString()}
                                </span>
                              </div>
                              {meeting.duration && (
                                <div className="flex items-center space-x-2">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm">{meeting.duration}</span>
                                </div>
                              )}
                              <div className="flex items-center space-x-2">
                                <Users className="w-4 h-4 text-gray-500" />
                                <span className="text-sm">
                                  {meeting.participants 
                                    ? `${meeting.participants.split(',').length} participants`
                                    : "No participants listed"
                                  }
                                </span>
                              </div>
                            </div>

                            {/* Status */}
                            <div>
                              <h3 className="font-semibold mb-2">Status</h3>
                              {getStatusBadge(meeting.status)}
                            </div>

                            {/* Participants */}
                            {meeting.participants && (
                              <div>
                                <h3 className="font-semibold mb-2">Participants</h3>
                                <div className="flex flex-wrap gap-2">
                                  {meeting.participants.split(',').map((participant, index) => (
                                    <Badge key={index} variant="outline">
                                      {participant.trim()}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Summary */}
                            {meeting.summary && (
                              <div>
                                <h3 className="font-semibold mb-2">Summary</h3>
                                <div className="prose prose-sm max-w-none dark:prose-invert">
                                  <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
                                    {(() => {
                                      try {
                                        // Try to parse if it's a JSON array
                                        const parsed = JSON.parse(meeting.summary);
                                        if (Array.isArray(parsed)) {
                                          return (
                                            <ul className="space-y-1">
                                              {parsed.map((item: string, index: number) => (
                                                <li key={index} className="flex items-start space-x-2">
                                                  <span className="text-gray-400">•</span>
                                                  <span>{item}</span>
                                                </li>
                                              ))}
                                            </ul>
                                          );
                                        }
                                        return <p>{parsed}</p>;
                                      } catch {
                                        // If parsing fails, display as plain text
                                        return <p>{meeting.summary}</p>;
                                      }
                                    })()}
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Key Decisions */}
                            {meeting.keyDecisions && Array.isArray(meeting.keyDecisions) && meeting.keyDecisions.length > 0 && (
                              <div>
                                <h3 className="font-semibold mb-2 flex items-center">
                                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                                  Key Decisions
                                </h3>
                                <ul className="space-y-2">
                                  {meeting.keyDecisions
                                    .filter(decision => typeof decision === 'string' && decision !== '[object Object]')
                                    .map((decision, index) => (
                                    <li key={index} className="flex items-start space-x-2">
                                      <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                                      <span className="text-gray-700 dark:text-gray-300">{decision}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Action Items */}
                            {(() => {
                              const validActionItems = meeting.actionItems && Array.isArray(meeting.actionItems) 
                                ? meeting.actionItems.filter(action => typeof action === 'string' && action !== '[object Object]' && action.trim() !== '')
                                : [];
                              
                              return validActionItems.length > 0 && (
                                <div>
                                  <h3 className="font-semibold mb-2 flex items-center">
                                    <ListTodo className="w-4 h-4 mr-2 text-blue-600" />
                                    Action Items
                                  </h3>
                                  <ul className="space-y-2">
                                    {validActionItems.map((action, index) => (
                                      <li key={index} className="flex items-start space-x-2">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                                        <span className="text-gray-700 dark:text-gray-300">{action}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              );
                            })()}

                            {/* Transcription */}
                            {meeting.transcription && (
                              <div>
                                <h3 className="font-semibold mb-2">Full Transcription</h3>
                                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-64 overflow-y-auto">
                                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                    {meeting.transcription}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
