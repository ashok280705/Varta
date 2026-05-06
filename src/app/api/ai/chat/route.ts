import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { generateGroqResponse } from "@/lib/ai/groq";
import { sendWhatsAppFollowUp } from "@/lib/followup/twilio";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { leadId, message, history, currentLanguage } = await request.json();

  if (!leadId || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // 1. Get lead data
  const { data: lead } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // 2. Fetch conversation stage
  const { data: conv } = await supabase
    .from("conversations")
    .select("current_stage")
    .eq("lead_id", leadId)
    .single();
    
  const currentStage = conv?.current_stage || "opening";

  // 3. Fetch past objections for context
  const { data: interactions } = await supabase
    .from("interactions")
    .select("objection_type")
    .eq("lead_id", leadId);
    
  const previousObjections = interactions 
    ? interactions.map(i => i.objection_type).filter(Boolean) as string[]
    : [];

  // 4. Generate Real AI Response via Groq
  const aiResult = await generateGroqResponse(message, history, {
    name: lead.name,
    language: currentLanguage || lead.language,
    score: lead.score,
    previousObjections,
    currentStage
  });

  // 5. Update Lead Score, Status, and Reason
  const newScore = Math.min(100, Math.max(0, lead.score + aiResult.scoreDelta));
  let newStatus = lead.status;
  
  if (aiResult.shouldHandoff || newScore > 75) {
    newStatus = "hot";
  } else if (newScore > 45) {
    newStatus = "warm";
  } else if (newScore < 20) {
    newStatus = "cold";
  } else {
    newStatus = "contacted";
  }

  await supabase
    .from("leads")
    .update({ 
      score: newScore, 
      status: newStatus,
      language: aiResult.detectedLanguage,
      last_score_reason: aiResult.reason 
    })
    .eq("id", leadId);

  // 6. Save Conversation and Update Stage
  const { data: existingConv } = await supabase
    .from("conversations")
    .select("*")
    .eq("lead_id", leadId)
    .single();

  const newMessage = { role: "user", content: message, timestamp: new Date().toISOString() };
  const assistantMessage = { role: "assistant", content: aiResult.message, timestamp: new Date().toISOString() };
  
  const updatedMessages = existingConv 
    ? [...existingConv.messages, newMessage, assistantMessage]
    : [newMessage, assistantMessage];

  if (existingConv) {
    await supabase
      .from("conversations")
      .update({ 
        messages: updatedMessages,
        language: aiResult.detectedLanguage,
        current_stage: aiResult.nextStage,
        updated_at: new Date().toISOString()
      })
      .eq("id", existingConv.id);
  } else {
    await supabase
      .from("conversations")
      .insert({
        lead_id: leadId,
        messages: updatedMessages,
        language: aiResult.detectedLanguage,
        current_stage: aiResult.nextStage
      });
  }

  // 7. Save Interaction if objection detected
  if (aiResult.objectionDetected) {
    await supabase
      .from("interactions")
      .insert({
        lead_id: leadId,
        objection_type: aiResult.objectionDetected,
        resolved: aiResult.resolved || false,
        sentiment: aiResult.sentiment
      });
  }

  // 8. Trigger Handoff Summary if Hot
  if (newStatus === "hot" && lead.status !== "hot") {
    const { generateStructuredSummary } = require("@/lib/ai/groq");
    const summary = await generateStructuredSummary(lead.name, updatedMessages);
    await supabase.from("leads").update({ 
      notes: JSON.stringify(summary) 
    }).eq("id", leadId);
  }

  return NextResponse.json({
    message: aiResult.message,
    newScore,
    newStatus,
    detectedLanguage: aiResult.detectedLanguage,
    stage: aiResult.nextStage,
    reason: aiResult.reason
  });
}
