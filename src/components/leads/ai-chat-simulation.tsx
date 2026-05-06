"use client";

import { useRef, useEffect } from "react";
import { useAIChat } from "@/hooks/use-ai-chat";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Loader2, Zap, Mic, Square, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Lead, Message } from "@/lib/types";

interface AIChatSimulationProps {
  lead: Lead;
  onUpdate: () => void;
  demoMode?: boolean;
}

export function AIChatSimulation({ lead, onUpdate, demoMode }: AIChatSimulationProps) {
  const { 
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
  } = useAIChat({
    leadId: lead.id,
    initialLanguage: lead.language,
    onUpdate
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  return (
    <div className={`flex flex-col h-[500px] border rounded-xl bg-background overflow-hidden shadow-sm transition-all duration-300 ${demoMode ? 'ring-2 ring-primary ring-offset-2' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Zap className={`h-4 w-4 ${demoMode ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <p className="text-sm font-semibold">
              Live AI Sales Agent {demoMode && <span className="text-[10px] text-primary ml-1 font-black underline">DEMO</span>}
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full animate-pulse ${isSpeaking ? 'bg-blue-500' : isListening ? 'bg-red-500' : 'bg-emerald-500'}`} />
              {isSpeaking ? "Speaking..." : isListening ? "Listening..." : "Connected to Groq"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {demoMode && (
             <Badge variant="secondary" className="text-[10px] uppercase font-bold bg-primary/10 text-primary border-primary/20">
               Stage: {stage}
             </Badge>
          )}
          <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
            {lead.language}
          </Badge>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-3 opacity-60">
              <Bot className="h-10 w-10 text-primary" />
              <div>
                <p className="text-sm font-medium">Ready to engage {lead.name}?</p>
                <p className="text-xs">Type a greeting or use voice to start.</p>
              </div>
            </div>
          )}
          
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.2 }}
                className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}
              >
                <div className={`flex gap-2 max-w-[85%] ${msg.role === "assistant" ? "flex-row" : "flex-row-reverse"}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    msg.role === "assistant" ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}>
                    {msg.role === "assistant" ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-2xl px-4 py-2 text-sm shadow-sm ${
                    msg.role === "assistant" 
                      ? "bg-background border border-border text-foreground rounded-tl-none" 
                      : "bg-primary text-primary-foreground rounded-tr-none"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-2 bg-muted/50 rounded-2xl px-4 py-2 text-sm italic text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                VĀRTĀ is thinking...
              </div>
            </motion.div>
          )}
          
          {isSpeaking && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="flex gap-2 items-center text-xs font-medium text-blue-500 ml-10">
                <Volume2 className="h-3 w-3 animate-pulse" />
                Speaking...
              </div>
            </motion.div>
          )}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      {/* Input */}
        {demoMode && (
          <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-dashed border-primary/20">
            <p className="text-[10px] uppercase font-bold text-primary w-full mb-1">Demo Scenarios:</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-[10px] h-7 bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100"
              onClick={() => {
                setInput("I am very interested in this program. Can you tell me how to sign up?");
              }}
            >
              👍 Interested (Hot)
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-[10px] h-7 bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100"
              onClick={() => {
                setInput("I'm a bit confused. Is this safe for my clients? How do you compare to Zerodha?");
              }}
            >
              🤔 Confused (Warm)
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-[10px] h-7 bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              onClick={() => {
                setInput("No thanks, I'm happy with my current broker. Stop calling me.");
              }}
            >
              👎 Rejecting (Cold)
            </Button>
          </div>
        )}
        <div className="flex gap-2">
          {isListening ? (
             <Button type="button" variant="destructive" onClick={stopRecording} className="shrink-0 animate-pulse">
               <Square className="h-4 w-4 mr-2" fill="currentColor" /> Stop
             </Button>
          ) : (
             <Button type="button" variant="outline" onClick={startRecording} disabled={isTyping || isSpeaking} className="shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50">
               <Mic className="h-4 w-4" />
             </Button>
          )}
          <form onSubmit={sendMessage} className="flex-1 flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Reply to ${lead.name}...`}
              className="flex-1 bg-background"
              disabled={isTyping || isListening}
            />
            <Button type="submit" size="icon" disabled={!input.trim() || isTyping || isListening}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
        <p className="text-[10px] text-muted-foreground mt-2 text-center flex justify-center gap-2">
          <span>🧠 Groq</span> • <span>🎤 Deepgram</span> • <span>🗣️ Google Cloud</span>
        </p>
      </div>
   
  );
}
