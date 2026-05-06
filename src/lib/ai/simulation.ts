import { Language, SentimentType } from "../types";

export interface AIResponse {
  message: string;
  detectedLanguage: Language;
  objectionDetected?: string;
  resolved?: boolean;
  scoreDelta: number;
  sentiment: SentimentType;
  shouldHandoff: boolean;
}

const OBJECTIONS = {
  already_using: ["already using", "have a broker", "other broker", "already have", "with someone else"],
  not_interested: ["not interested", "don't want", "no thanks", "not now", "stop"],
  trust_issue: ["trust", "reliable", "scam", "safe", "secure"],
  no_contacts: ["no contacts", "where did you get my number", "who are you"],
  call_later: ["call later", "busy", "meeting", "tomorrow", "after some time"],
};

export async function simulateAIResponse(
  userInput: string,
  history: { role: string; content: string }[],
  leadLanguage: Language
): Promise<AIResponse> {
  const input = userInput.toLowerCase();
  
  // 1. Language Detection (Simplistic for simulation)
  let detectedLanguage: Language = leadLanguage;
  if (input.match(/[अ-ह]/)) {
    detectedLanguage = "hindi";
  } else if (input.match(/\b(hai|ki|ke|me|se|ka)\b/)) {
    detectedLanguage = "hinglish";
  } else {
    detectedLanguage = "english";
  }

  // 2. Objection Detection
  let objectionDetected: string | undefined;
  for (const [key, patterns] of Object.entries(OBJECTIONS)) {
    if (patterns.some(p => input.includes(p))) {
      objectionDetected = key;
      break;
    }
  }

  // 3. Logic & Response Generation (Phased Simulation)
  let message = "";
  let scoreDelta = 5;
  let resolved = false;
  let sentiment: SentimentType = "neutral";
  let shouldHandoff = false;

  if (objectionDetected) {
    sentiment = "negative";
    scoreDelta = -10;
    
    switch (objectionDetected) {
      case "already_using":
        message = detectedLanguage === "hindi" 
          ? "Sahi baat hai! Bahut se log doosre brokers use karte hain. Par VĀRTĀ ke saath aapko 2x faster execution aur better insights milte hain. Kya aap trial lena chahenge?"
          : "Understood! Most of our premium clients use multiple platforms. VĀRTĀ offers unique insights that others miss. Would you be open to a quick comparison?";
        resolved = true; // Attempting resolution
        scoreDelta = 5;
        break;
      case "call_later":
        message = detectedLanguage === "hindi"
          ? "Zaroor! Aap bataiye kab sahi waqt rahega? Main tabhi contact karungi."
          : "No problem at all! When would be a better time for us to connect? I will mark it down.";
        scoreDelta = 0;
        break;
      case "not_interested":
        message = "I understand. If your requirements change in the future, VĀRTĀ is always here to help. Have a great day!";
        scoreDelta = -20;
        break;
      default:
        message = "I appreciate your honesty. Let me address that specifically...";
    }
  } else {
    // Standard flow
    const turn = history.length;
    sentiment = "positive";
    
    if (turn === 0) {
      message = detectedLanguage === "hindi"
        ? "Namaste! Main VĀRTĀ se bol rahi hoon. Kya main aapke investments ke baare mein 2 minute baat kar sakti hoon?"
        : "Hello! This is VĀRTĀ. I noticed you were looking for better lead conversion tools. Do you have a moment to chat?";
    } else if (input.includes("yes") || input.includes("haan") || input.includes("tell me")) {
      message = detectedLanguage === "hindi"
        ? "Great! Hamara AI system aapke leads ko automatically engage karta hai aur qualified leads seedha aapko deta hai. Kya ye aapke liye useful hoga?"
        : "Excellent! Our AI system automatically engages leads and hands over only the qualified ones to you. How does that sound for your workflow?";
      scoreDelta = 15;
    } else {
      message = "That sounds interesting! Tell me more about your current process so I can show you how VĀRTĀ fits in.";
      scoreDelta = 10;
    }
  }

  // Handoff check
  if (scoreDelta > 10 || input.includes("call me") || input.includes("expert")) {
    shouldHandoff = true;
  }

  return {
    message,
    detectedLanguage,
    objectionDetected,
    resolved,
    scoreDelta,
    sentiment,
    shouldHandoff
  };
}
