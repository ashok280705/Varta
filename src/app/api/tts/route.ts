import { NextResponse } from "next/server";
import { synthesizeSpeech } from "@/lib/voice/tts";

export async function POST(request: Request) {
  try {
    const { text, language } = await request.json();

    if (!text) {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    const audioBuffer = await synthesizeSpeech(text, language);

    return new NextResponse(Buffer.from(audioBuffer), {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": "inline; filename=\"speech.mp3\"",
      },
    });
  } catch (error: any) {
    console.error("TTS Route Error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate speech" }, { status: 500 });
  }
}
