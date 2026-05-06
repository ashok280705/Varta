export interface STTResponse {
  transcript: string;
  confidence: number;
}

export async function transcribeAudioDeepgram(audioBuffer: ArrayBuffer): Promise<STTResponse> {
  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;
  if (!DEEPGRAM_API_KEY) {
    throw new Error("Missing DEEPGRAM_API_KEY");
  }

  const response = await fetch("https://api.deepgram.com/v1/listen?model=nova-2&language=en-IN&smart_format=true", {
    method: "POST",
    headers: {
      "Authorization": `Token ${DEEPGRAM_API_KEY}`,
      "Content-Type": "audio/webm",
    },
    body: audioBuffer,
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Deepgram API error: ${err}`);
  }

  const data = await response.json();
  const transcript = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
  const confidence = data.results?.channels?.[0]?.alternatives?.[0]?.confidence || 0;

  return { transcript, confidence };
}
