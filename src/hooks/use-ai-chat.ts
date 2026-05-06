import { useState, useCallback, useRef } from "react";
import { Message, Lead } from "@/lib/types";

interface UseAIChatProps {
  leadId: string;
  initialLanguage: string;
  onUpdate?: () => void;
}

export function useAIChat({ leadId, initialLanguage, onUpdate }: UseAIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopSpeaking = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const playVoiceResponse = async (text: string) => {
    try {
      stopSpeaking();
      setIsSpeaking(true);
      
      // Artificial delay for natural conversational flow
      await new Promise(resolve => setTimeout(resolve, 600));

      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language: initialLanguage }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(`TTS failed: ${errData.error || res.statusText}`);
      }
      
      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      audio.onended = () => {
        setIsSpeaking(false);
        audioRef.current = null;
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (e: any) {
      console.warn("GCP TTS Playback Error, falling back to browser synthesis:", e);
      if ("speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = initialLanguage.toLowerCase() === "hindi" ? "hi-IN" : "en-IN";
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
      } else {
        setError("Voice playback failed.");
        setIsSpeaking(false);
      }
    }
  };

  const [stage, setStage] = useState<string>("opening");

  const sendTextMessage = useCallback(async (textToSubmit: string) => {
    if (!textToSubmit.trim() || isTyping) return;

    const userMessage: Message = {
      role: "user",
      content: textToSubmit,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);
    setError(null);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId,
          message: textToSubmit,
          history: messages,
          currentLanguage: initialLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message to AI");
      }

      const data = await response.json();
      
      if (data.stage) setStage(data.stage);

      if (data.message) {
        const aiMessage: Message = {
          role: "assistant",
          content: data.message,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, aiMessage]);
        if (onUpdate) onUpdate();

        playVoiceResponse(data.message);
      }
    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err.message || "An error occurred");
    } finally {
      setIsTyping(false);
    }
  }, [isTyping, leadId, messages, initialLanguage, onUpdate]);

  const sendMessage = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await sendTextMessage(input);
  }, [input, sendTextMessage]);

  const startRecording = async () => {
    try {
      stopSpeaking();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsListening(false);
        setIsTyping(true);
        
        try {
          const formData = new FormData();
          formData.append("audio", audioBlob, "audio.webm");

          const res = await fetch("/api/stt", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) throw new Error("STT failed");
          const data = await res.json();
          if (data.transcript) {
            await sendTextMessage(data.transcript);
          } else {
             setIsTyping(false);
          }
        } catch(e) {
           console.error(e);
           setIsTyping(false);
        }

        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsListening(true);
    } catch (e) {
      console.error("Mic access denied or error:", e);
      setError("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  };

  return {
    messages,
    input,
    setInput,
    isTyping,
    isListening,
    isSpeaking,
    error,
    stage,
    sendMessage,
    startRecording,
    stopRecording
  };
}
