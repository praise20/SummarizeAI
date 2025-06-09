import OpenAI from "openai";
import fs from "fs";

if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY environment variable must be set");
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

// Audio transcription
export async function transcribeAudio(audioFilePath: string): Promise<{ text: string, duration: number }> {
  try {
    const audioReadStream = fs.createReadStream(audioFilePath);

    const transcription = await openai.audio.transcriptions.create({
      file: audioReadStream,
      model: "whisper-1",
    });

    return {
      text: transcription.text,
      duration: 0, // Whisper doesn't return duration, would need separate calculation
    };
  } catch (error: any) {
    console.error("Error transcribing audio:", error);
    throw new Error("Failed to transcribe audio: " + (error?.message || String(error)));
  }
}

// Meeting summarization
export async function summarizeMeeting(transcription: string): Promise<{
  summary: string;
  keyDecisions: string[];
  actionItems: string[];
}> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert meeting summarizer. Analyze the meeting transcription and provide a structured summary in JSON format with the following fields:
          - summary: A single concise paragraph summarizing the main topics discussed (plain text string, not an array)
          - keyDecisions: An array of strings, each representing a key decision made during the meeting
          - actionItems: An array of strings, each representing a specific action item, task, or follow-up that needs to be completed
          
          For action items, look for:
          - Tasks that need to be done
          - Follow-up actions mentioned
          - Assignments given to people
          - Deadlines or commitments made
          - Things that "should be done" or "need to happen"
          
          Example format:
          {
            "summary": "The team discussed project progress and timeline updates. Key topics included budget considerations and upcoming deadlines.",
            "keyDecisions": ["Approved budget increase", "Changed deadline to next month"],
            "actionItems": ["John will finalize the proposal by Friday", "Each department to submit progress reports", "Schedule follow-up meeting next week"]
          }
          
          IMPORTANT: The summary field must be a single string, not an array. Respond with valid JSON only.`
        },
        {
          role: "user",
          content: `Please analyze this meeting transcription and provide a structured summary:\n\n${transcription}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    // Ensure we have proper string arrays
    const keyDecisions = Array.isArray(result.keyDecisions) 
      ? result.keyDecisions.filter((item: any) => typeof item === 'string')
      : [];
    
    const actionItems = Array.isArray(result.actionItems) 
      ? result.actionItems.filter((item: any) => typeof item === 'string')
      : [];

    return {
      summary: typeof result.summary === 'string' ? result.summary : "No summary available",
      keyDecisions,
      actionItems,
    };
  } catch (error: any) {
    console.error("Error summarizing meeting:", error);
    throw new Error("Failed to summarize meeting: " + (error?.message || String(error)));
  }
}
