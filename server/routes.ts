import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";
import passport from "passport";
import bcrypt from "bcrypt";
import { insertMeetingSchema, insertIntegrationSchema } from "@shared/schema";
import { transcribeAudio, summarizeMeeting } from "./openai";
import { sendSlackMessage } from "./slack";
import { sendEmail } from "./email";
import { ZodError } from "zod";

// Configure multer for file uploads
const upload = multer({
  dest: "uploads/",
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.mp3', '.mp4', '.m4a', '.wav'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only .mp3, .mp4, .m4a, and .wav files are allowed.'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      // Create user
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        firstName: null,
        lastName: null,
      });

      // Login user
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed after signup" });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Signup failed" });
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', (err: any, user: any, info: any) => {
      if (err) {
        return res.status(500).json({ message: "Authentication error" });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: "Login failed" });
        }
        res.json(user);
      });
    })(req, res, next);
  });

  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const { password: _, ...userWithoutPassword } = req.user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Meeting routes
  app.post('/api/meetings', isAuthenticated, upload.single('audio'), async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { title, date, duration, participants } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ message: "No audio file provided" });
      }

      const meetingData = insertMeetingSchema.parse({
        userId,
        title: title || `Meeting ${new Date().toLocaleDateString()}`,
        date: date ? new Date(date) : new Date(),
        duration,
        participants,
        audioUrl: req.file.path,
        status: "uploading"
      });

      const meeting = await storage.createMeeting(meetingData);

      // Start background processing
      processAudioFile(meeting.id, req.file.path);

      res.json(meeting);
    } catch (error) {
      console.error("Error creating meeting:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid meeting data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create meeting" });
    }
  });

  app.get('/api/meetings', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { search } = req.query;
      
      let meetings;
      if (search) {
        meetings = await storage.searchMeetings(userId, search as string);
      } else {
        meetings = await storage.getMeetingsByUser(userId);
      }
      
      res.json(meetings);
    } catch (error) {
      console.error("Error fetching meetings:", error);
      res.status(500).json({ message: "Failed to fetch meetings" });
    }
  });

  app.get('/api/meetings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const meetingId = parseInt(req.params.id);
      
      const meeting = await storage.getMeeting(meetingId, userId);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }
      
      res.json(meeting);
    } catch (error) {
      console.error("Error fetching meeting:", error);
      res.status(500).json({ message: "Failed to fetch meeting" });
    }
  });

  app.delete('/api/meetings/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const meetingId = parseInt(req.params.id);
      
      const meeting = await storage.getMeeting(meetingId, userId);
      if (!meeting) {
        return res.status(404).json({ message: "Meeting not found" });
      }

      // Delete audio file if it exists
      if (meeting.audioUrl && fs.existsSync(meeting.audioUrl)) {
        fs.unlinkSync(meeting.audioUrl);
      }

      await storage.deleteMeeting(meetingId, userId);
      res.json({ message: "Meeting deleted successfully" });
    } catch (error) {
      console.error("Error deleting meeting:", error);
      res.status(500).json({ message: "Failed to delete meeting" });
    }
  });

  // Integration routes
  app.get('/api/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrations = await storage.getIntegrations(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Error fetching integrations:", error);
      res.status(500).json({ message: "Failed to fetch integrations" });
    }
  });

  app.post('/api/integrations', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrationData = insertIntegrationSchema.parse({
        ...req.body,
        userId,
      });

      const integration = await storage.createIntegration(integrationData);
      res.json(integration);
    } catch (error) {
      console.error("Error creating integration:", error);
      if (error instanceof ZodError) {
        return res.status(400).json({ message: "Invalid integration data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create integration" });
    }
  });

  app.put('/api/integrations/:id', isAuthenticated, async (req: any, res) => {
    try {
      const integrationId = parseInt(req.params.id);
      const updates = req.body;

      const updatedIntegration = await storage.updateIntegration(integrationId, updates);
      res.json(updatedIntegration);
    } catch (error) {
      console.error("Error updating integration:", error);
      res.status(500).json({ message: "Failed to update integration" });
    }
  });

  // Background processing function
  async function processAudioFile(meetingId: number, audioPath: string) {
    try {
      // Update status to transcribing
      await storage.updateMeeting(meetingId, { status: "transcribing" });

      // Transcribe audio
      const transcription = await transcribeAudio(audioPath);
      await storage.updateMeeting(meetingId, { 
        transcription: transcription.text,
        status: "summarizing" 
      });

      // Generate summary
      const summary = await summarizeMeeting(transcription.text);
      await storage.updateMeeting(meetingId, {
        summary: summary.summary,
        keyDecisions: summary.keyDecisions,
        actionItems: summary.actionItems,
        status: "completed"
      });

      // Send notifications if integrations are enabled
      const meeting = await storage.getMeeting(meetingId, 1); // We'll need to get the actual user ID
      if (meeting) {
        await sendNotifications(meeting);
      }

      // Clean up audio file
      if (fs.existsSync(audioPath)) {
        fs.unlinkSync(audioPath);
      }
    } catch (error) {
      console.error(`Error processing audio file for meeting ${meetingId}:`, error);
      await storage.updateMeeting(meetingId, { status: "failed" });
    }
  }

  async function sendNotifications(meeting: any) {
    try {
      const integrations = await storage.getIntegrations(meeting.userId);
      
      for (const integration of integrations) {
        if (!integration.isEnabled) continue;

        if (integration.type === "slack") {
          try {
            const settings = integration.settings as { channelId: string; webhookUrl?: string };
            await sendSlackMessage({
              channel: settings.channelId,
              text: `Meeting Summary: ${meeting.title}`,
              blocks: [
                {
                  type: "section",
                  text: {
                    type: "mrkdwn",
                    text: `*${meeting.title}*\n${meeting.summary}`
                  }
                }
              ]
            });
          } catch (error) {
            console.error("Failed to send Slack notification:", error);
          }
        }

        if (integration.type === "email") {
          try {
            const settings = integration.settings as { recipients: string | string[]; subject: string };
            await sendEmail({
              to: settings.recipients,
              subject: `Meeting Summary: ${meeting.title}`,
              html: `
                <h2>${meeting.title}</h2>
                <p><strong>Date:</strong> ${new Date(meeting.date).toLocaleDateString()}</p>
                <p><strong>Duration:</strong> ${meeting.duration}</p>
                <h3>Summary:</h3>
                <p>${meeting.summary}</p>
                ${meeting.keyDecisions?.length ? `
                  <h3>Key Decisions:</h3>
                  <ul>${meeting.keyDecisions.map((decision: string) => `<li>${decision}</li>`).join('')}</ul>
                ` : ''}
                ${meeting.actionItems?.length ? `
                  <h3>Action Items:</h3>
                  <ul>${meeting.actionItems.map((item: string) => `<li>${item}</li>`).join('')}</ul>
                ` : ''}
              `
            });
          } catch (error) {
            console.error("Failed to send email notification:", error);
          }
        }
      }
    } catch (error) {
      console.error("Error sending notifications:", error);
    }
  }

  const httpServer = createServer(app);
  return httpServer;
}
