import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Sidebar } from "@/components/layout/sidebar";
import { FileUpload } from "@/components/ui/file-upload";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CloudUpload, Check, Clock, Loader2 } from "lucide-react";
import { useEffect } from "react";

interface UploadResponse {
  id: number;
  status: string;
}

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [meetingDetails, setMeetingDetails] = useState({
    title: "",
    date: "",
    duration: "",
    participants: "",
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

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      // Simulate upload progress
      const uploadInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(uploadInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await apiRequest("POST", "/api/meetings", formData);
      clearInterval(uploadInterval);
      setUploadProgress(100);
      return response.json();
    },
    onSuccess: (data: UploadResponse) => {
      toast({
        title: "Upload successful",
        description: "Your meeting is being processed...",
      });
      setProcessingStatus("transcribing");
      // Poll for status updates
      pollMeetingStatus(data.id);
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
        title: "Upload failed",
        description: error.message || "Failed to upload file",
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const pollMeetingStatus = async (meetingId: number) => {
    const pollInterval = setInterval(async () => {
      try {
        const response = await fetch(`/api/meetings/${meetingId}`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const meeting = await response.json();
          setProcessingStatus(meeting.status);
          
          if (meeting.status === "completed" || meeting.status === "failed") {
            clearInterval(pollInterval);
            if (meeting.status === "completed") {
              toast({
                title: "Processing complete",
                description: "Your meeting summary is ready!",
              });
            } else {
              toast({
                title: "Processing failed",
                description: "There was an error processing your meeting",
                variant: "destructive",
              });
            }
            setProcessingStatus(null);
            setUploadProgress(0);
            setFile(null);
            setMeetingDetails({
              title: "",
              date: "",
              duration: "",
              participants: "",
            });
          }
        }
      } catch (error) {
        console.error("Error polling meeting status:", error);
      }
    }, 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select an audio file to upload",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("audio", file);
    formData.append("title", meetingDetails.title || `Meeting ${new Date().toLocaleDateString()}`);
    formData.append("date", meetingDetails.date || new Date().toISOString());
    formData.append("duration", meetingDetails.duration);
    formData.append("participants", meetingDetails.participants);

    setUploadProgress(5);
    uploadMutation.mutate(formData);
  };

  if (isLoading || !isAuthenticated) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      
      <div className="flex-1 ml-64">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Upload Recording</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Upload your meeting recording to generate an AI summary</p>
          </div>

          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* File Upload */}
              <Card>
                <CardContent className="p-8">
                  <FileUpload
                    file={file}
                    onFileSelect={setFile}
                    accept=".mp3,.mp4,.m4a,.wav"
                    maxSize={100 * 1024 * 1024} // 100MB
                  />
                </CardContent>
              </Card>

              {/* Upload Progress */}
              {uploadProgress > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900 dark:text-white">{file?.name}</h3>
                      <span className="text-sm text-gray-500 dark:text-gray-400">{uploadProgress}% Complete</span>
                    </div>
                    <Progress value={uploadProgress} className="mb-4" />
                    <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                      <span>
                        {file && `${Math.round(uploadProgress * file.size / 100 / 1024 / 1024)} MB of ${Math.round(file.size / 1024 / 1024)} MB`}
                      </span>
                      <span>{uploadProgress < 100 ? "Uploading..." : "Upload complete"}</span>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Processing Status */}
              {processingStatus && (
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">Processing your recording...</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">This usually takes 2-5 minutes depending on the length</p>
                      </div>
                    </div>
                    <div className="mt-6 space-y-3">
                      <div className="flex items-center space-x-3">
                        <Check className="w-4 h-4 text-accent" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">File uploaded successfully</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        {processingStatus === "transcribing" ? (
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        ) : (
                          <Check className="w-4 h-4 text-accent" />
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">Transcribing audio with OpenAI Whisper...</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        {processingStatus === "summarizing" ? (
                          <Loader2 className="w-4 h-4 text-primary animate-spin" />
                        ) : processingStatus === "completed" ? (
                          <Check className="w-4 h-4 text-accent" />
                        ) : (
                          <Clock className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-600 dark:text-gray-400">Generating AI summary...</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Meeting Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Meeting Details (Optional)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="title">Meeting Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Weekly Team Standup"
                      value={meetingDetails.title}
                      onChange={(e) => setMeetingDetails(prev => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={meetingDetails.date}
                        onChange={(e) => setMeetingDetails(prev => ({ ...prev, date: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        placeholder="e.g., 45 minutes"
                        value={meetingDetails.duration}
                        onChange={(e) => setMeetingDetails(prev => ({ ...prev, duration: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="participants">Participants</Label>
                    <Input
                      id="participants"
                      placeholder="e.g., John, Sarah, Mike"
                      value={meetingDetails.participants}
                      onChange={(e) => setMeetingDetails(prev => ({ ...prev, participants: e.target.value }))}
                    />
                  </div>
                </CardContent>
              </Card>

              <Button 
                type="submit" 
                size="lg" 
                disabled={!file || uploadMutation.isPending || processingStatus !== null}
                className="w-full"
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <CloudUpload className="w-4 h-4 mr-2" />
                    Upload and Process
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
