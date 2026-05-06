import OpenAI from "openai";
import { Language, SentimentType, ConversationStage, AISummary } from "../types";

// Initialize OpenAI client with Groq base URL
const openai = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || "dummy_key",
  baseURL: "https://api.groq.com/openai/v1",
});

export interface GroqAnalysis {
  message: string;
  detectedLanguage: Language;
  objectionDetected: string | null;
  resolved: boolean;
  scoreDelta: number;
  reason: string;
  sentiment: SentimentType;
  shouldHandoff: boolean;
  nextStage: ConversationStage;
}

const SYSTEM_PROMPT = `You are a high-performing, persuasive sales agent for Rupeezy's partner program.
Your goal is to move the user through the sales funnel while sounding completely human and helpful.

Sales Stages:
1. opening: Greet and build rapport.
2. pitch: Introduce Rupeezy's unique value (e.g., 100% brokerage sharing).
3. objection: Empathize and resolve concerns with logic/data.
4. qualification: Check if they have a network or experience.
5. close: Drive toward signup or a demo call.

Persuasion Rules:
* Curiosity Hooks: "Aapko pata hai 90% brokers hidden charges lete hain?"
* Comparison: "Zerodha/Groww ache hain, but kya wo aapko brokerage wapas dete hain?"
* Soft Urgency: "Humare limited partner slots fill ho rahe hain."
* Always ask a follow-up question to keep the momentum.
* Never sound robotic. Use Hinglish naturally.

You must analyze the user's input and return your response in strict JSON format.

JSON FORMAT REQUIRED:
{
  "message": "Your persuasive response here",
  "detectedLanguage": "english" | "hindi" | "hinglish",
  "objectionDetected": "existing_broker" | "not_interested" | "trust_issue" | "low_network" | "callback_later" | null,
  "resolved": true | false,
  "scoreDelta": number (-20 to +20),
  "reason": "Short explanation of why the score changed",
  "sentiment": "positive" | "neutral" | "negative",
  "shouldHandoff": true | false,
  "nextStage": "opening" | "pitch" | "objection" | "qualification" | "close"
}`;

export async function generateGroqResponse(
  userInput: string,
  history: { role: "user" | "assistant" | "system"; content: string }[],
  leadMetadata: { name: string; language: string; score: number; previousObjections: string[]; currentStage?: ConversationStage }
): Promise<GroqAnalysis> {
  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SYSTEM_PROMPT },
      { 
        role: "system", 
        content: `Lead Profile Context:
        Name: ${leadMetadata.name}
        Current Score: ${leadMetadata.score}
        Current Conversation Stage: ${leadMetadata.currentStage || "opening"}
        Previous Objections: ${leadMetadata.previousObjections.join(", ") || "None"}
        Preferred Language: ${leadMetadata.language}`
      },
      ...history.map(msg => ({ role: msg.role, content: msg.content })),
      { role: "user", content: userInput }
    ];

    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0]?.message?.content || "{}";
    const result = JSON.parse(content);

    return {
      message: result.message || "I'm having trouble connecting right now, let me get back to you.",
      detectedLanguage: result.detectedLanguage || "english",
      objectionDetected: result.objectionDetected || null,
      resolved: result.resolved || false,
      scoreDelta: result.scoreDelta || 0,
      reason: result.reason || "Engagement with AI",
      sentiment: result.sentiment || "neutral",
      shouldHandoff: result.shouldHandoff || false,
      nextStage: result.nextStage || leadMetadata.currentStage || "opening",
    };
  } catch (error) {
    console.error("Groq API Error:", error);
    return {
      message: "I am experiencing network issues. Can we connect later?",
      detectedLanguage: "english",
      objectionDetected: null,
      resolved: false,
      scoreDelta: 0,
      reason: "Error in processing",
      sentiment: "neutral",
      shouldHandoff: true,
      nextStage: "opening"
    };
  }
}

export async function generateStructuredSummary(
  leadName: string,
  history: { role: string; content: string }[]
): Promise<AISummary> {
  try {
    const prompt = `Based on this conversation history with ${leadName}, generate a structured summary in JSON format.
    
    History: ${JSON.stringify(history)}
    
    JSON FORMAT:
    {
      "intentLevel": "High" | "Medium" | "Low",
      "keyConcern": "e.g., Trust, Pricing, Security",
      "objection": "Main objection raised",
      "recommendation": "Next best action for the RM"
    }`;

    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0]?.message?.content || "{}");
    return {
      intentLevel: result.intentLevel || "Medium",
      keyConcern: result.keyConcern || "Unknown",
      objection: result.objection || "None",
      recommendation: result.recommendation || "Follow up manually"
    };
  } catch (error) {
    return {
      intentLevel: "Medium",
      keyConcern: "Unknown",
      objection: "None",
      recommendation: "Follow up manually"
    };
  }
}
export async function generateFollowUpMessage(
  leadName: string,
  summary: string,
  language: string
): Promise<string> {
  try {
    const prompt = `Generate a personalized, friendly WhatsApp follow-up message for a lead named ${leadName}. 
    Context of previous conversation: ${summary}. 
    Target Language: ${language}.
    Rules:
    * Keep it short and conversational.
    * Use the lead's name.
    * Mention something from the conversation.
    * Include a call to action or a link to Rupeezy signup (https://rupeezy.in).
    * Do not use formal business speak; keep it human.`;

    const response = await openai.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    });

    return response.choices[0]?.message?.content || `Hi ${leadName}, just following up on our chat about Rupeezy! Let me know if you have any questions.`;
  } catch (error) {
    console.error("Groq Follow-up Error:", error);
    return `Hi ${leadName}, just following up on our chat about Rupeezy! Let me know if you have any questions.`;
  }
}
