import { NextResponse } from "next/server";
import { sendWhatsAppFollowUp } from "@/lib/followup/twilio";

export async function POST(request: Request) {
  try {
    const { phone, message } = await request.json();

    if (!phone || !message) {
      return NextResponse.json({ error: "Phone and message are required" }, { status: 400 });
    }

    const result = await sendWhatsAppFollowUp(phone, message);

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId, mock: result.mock });
    } else {
      return NextResponse.json({ error: "Failed to send WhatsApp message" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Send WhatsApp Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
