import { NextResponse } from "next/server";
import { generateFollowUpMessage } from "@/lib/ai/groq";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const { leadId } = await request.json();
    const supabase = await createClient();

    // Fetch lead details and conversation summary
    const { data: lead } = await supabase.from("leads").select("*").eq("id", leadId).single();
    const { data: conv } = await supabase.from("conversations").select("*").eq("lead_id", leadId).single();

    if (!lead) return NextResponse.json({ error: "Lead not found" }, { status: 404 });

    const summary = conv?.summary || "User expressed interest in Rupeezy partner program.";
    const message = await generateFollowUpMessage(lead.name, summary, lead.language);

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error("Generate Follow-up Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
