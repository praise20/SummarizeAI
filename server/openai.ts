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
          - summary: A concise bullet-point summary of the main topics discussed
          - keyDecisions: An array of key decisions made during the meeting
          - actionItems: An array of specific action items with assignees if mentioned
          
          Respond with valid JSON only.`
        },
        {
          role: "user",
          content: `Please analyze this meeting transcription and provide a structured summary:\n\n${transcription}`
        }
      ],
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");

    return {
      summary: result.summary || "No summary available",
      keyDecisions: Array.isArray(result.keyDecisions) ? result.keyDecisions : [],
      actionItems: Array.isArray(result.actionItems) ? result.actionItems : [],
    };
  } catch (error: any) {
    console.error("Error summarizing meeting:", error);
    throw new Error("Failed to summarize meeting: " + (error?.message || String(error)));
  }
}
