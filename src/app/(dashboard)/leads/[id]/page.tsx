"use client";

import { useEffect, useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Phone,
  Mail,
  Globe,
  Flame,
  Send,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Loader2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";
import type { Lead, Conversation, Interaction, AISummary } from "@/lib/types";
import { formatDate, getScoreLabel } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AIChatSimulation } from "@/components/leads/ai-chat-simulation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [followUpLoading, setFollowUpLoading] = useState(false);
  const [followUpStatus, setFollowUpStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const [previewMessage, setPreviewMessage] = useState<string | null>(null);

  async function generateFollowUp() {
    if (!lead) return;
    setFollowUpLoading(true);
    setFollowUpStatus(null);
    try {
      const genRes = await fetch("/api/generate-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      });
      const genData = await genRes.json();
      if (genData.error) throw new Error(genData.error);
      setPreviewMessage(genData.message);
    } catch (error: any) {
      setFollowUpStatus({ success: false, message: error.message });
    } finally {
      setFollowUpLoading(false);
    }
  }

  async function sendFollowUp() {
    if (!lead || !previewMessage) return;
    setFollowUpLoading(true);
    try {
      const sendRes = await fetch("/api/send-whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          phone: lead.phone, 
          message: previewMessage 
        }),
      });
      const sendData = await sendRes.json();
      if (sendData.success) {
        setFollowUpStatus({ success: true, message: previewMessage });
        setPreviewMessage(null);
      } else {
        throw new Error(sendData.error || "Failed to send");
      }
    } catch (error: any) {
      setFollowUpStatus({ success: false, message: error.message });
    } finally {
      setFollowUpLoading(false);
    }
  }

  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    fetchLeadData();
  }, [id]);

  async function fetchLeadData() {
    const supabase = createClient();
    const [leadRes, convRes, interRes] = await Promise.all([
      supabase.from("leads").select("*").eq("id", id).single(),
      supabase.from("conversations").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
      supabase.from("interactions").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    ]);
    if (leadRes.data) setLead(leadRes.data);
    if (convRes.data) setConversations(convRes.data);
    if (interRes.data) setInteractions(interRes.data);
    setLoading(false);
  }

  async function updateStatus(status: string) {
    if (!lead) return;
    const supabase = createClient();
    const score = status === "hot" ? 85 : status === "warm" ? 55 : status === "cold" ? 20 : lead.score;
    await supabase.from("leads").update({ status, score }).eq("id", lead.id);
    setLead({ ...lead, status: status as Lead["status"], score });
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Lead not found</p>
        <Button variant="outline" onClick={() => router.push("/leads")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Leads
        </Button>
      </div>
    );
  }

  const scoreLabel = getScoreLabel(lead.score);
  let structuredSummary: AISummary | null = null;
  try {
    if (lead.notes && lead.notes.startsWith("{")) {
      structuredSummary = JSON.parse(lead.notes);
    }
  } catch (e) {}

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <Link href="/leads" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" /> Back to Leads
        </Link>
        <div className="flex items-center space-x-2 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
          <Switch 
            id="demo-mode" 
            checked={demoMode} 
            onCheckedChange={setDemoMode} 
          />
          <Label htmlFor="demo-mode" className="text-xs font-bold text-primary cursor-pointer">
            DEMO MODE {demoMode ? "ON" : "OFF"}
          </Label>
        </div>
      </div>

      {/* WhatsApp Preview */}
      <AnimatePresence>
        {previewMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="rounded-xl p-6 bg-primary/10 border-2 border-primary/20 shadow-xl relative"
          >
            <div className="absolute top-4 right-4 flex gap-2">
               <Button variant="ghost" size="sm" onClick={() => setPreviewMessage(null)}>Cancel</Button>
               <Button size="sm" onClick={sendFollowUp} disabled={followUpLoading}>
                 {followUpLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                 Send to WhatsApp
               </Button>
            </div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4" /> AI Generated Follow-up Preview
            </p>
            <div className="bg-white/90 rounded-lg p-4 text-sm italic border shadow-inner text-slate-900 font-medium selection:bg-primary/30 selection:text-black">
              "{previewMessage}"
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Follow-up Status */}
      <AnimatePresence>
        {followUpStatus && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={`rounded-lg p-4 border ${
              followUpStatus.success ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {followUpStatus.success ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                <div>
                  <p className="text-sm font-bold">
                    {followUpStatus.success ? "Message sent successfully!" : "Failed to send message"}
                  </p>
                  {followUpStatus.success && (
                    <p className="text-xs mt-1 italic">Preview: "{followUpStatus.message}"</p>
                  )}
                  {!followUpStatus.success && (
                    <p className="text-xs mt-1">{followUpStatus.message}</p>
                  )}
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setFollowUpStatus(null)}>✕</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lead Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-xl font-bold text-primary">
            {lead.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{lead.name}</h1>
            <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {lead.phone}</span>
              {lead.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {lead.email}</span>}
              <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {lead.language}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={generateFollowUp} disabled={followUpLoading || !!previewMessage}>
            {followUpLoading ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="mr-2 h-3.5 w-3.5" />
            )}
            {followUpLoading ? "Generating..." : "Generate Follow-up"}
          </Button>
          <Button size="sm" variant="destructive" onClick={() => updateStatus("hot")}>
            <Flame className="mr-2 h-3.5 w-3.5" /> Mark Hot
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant={lead.status as "hot" | "warm" | "cold" | "new" | "contacted"} className="mt-2">
              {lead.status}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Score</p>
            <p className="mt-1 text-2xl font-bold">{lead.score}</p>
            <p className={`text-xs font-medium ${scoreLabel === "Hot" ? "text-red-500" : scoreLabel === "Warm" ? "text-amber-500" : "text-sky-500"}`}>
              {scoreLabel}
            </p>
            {lead.last_score_reason && (
              <p className="mt-1 text-[10px] text-muted-foreground italic leading-tight">
                {lead.last_score_reason}
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Source</p>
            <p className="mt-2 text-sm font-medium capitalize">{lead.source}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Created</p>
            <p className="mt-2 text-sm font-medium">{formatDate(lead.created_at)}</p>
          </CardContent>
        </Card>
      </div>

      {structuredSummary && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Flame className="h-4 w-4 text-primary" /> AI Handoff Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Intent Level</p>
                <Badge variant={structuredSummary.intentLevel === "High" ? "hot" : structuredSummary.intentLevel === "Medium" ? "warm" : "cold"} className="mt-1">
                  {structuredSummary.intentLevel}
                </Badge>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Key Concern</p>
                <p className="text-sm font-medium mt-1">{structuredSummary.keyConcern}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Main Objection</p>
                <p className="text-sm font-medium mt-1">{structuredSummary.objection}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-muted-foreground">Recommendation</p>
                <p className="text-sm font-medium mt-1 text-primary">{structuredSummary.recommendation}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Tabs */}
      <Tabs defaultValue="conversations">
        <TabsList>
          <TabsTrigger value="conversations" className="gap-2">
            <MessageSquare className="h-3.5 w-3.5" /> Conversations
          </TabsTrigger>
          <TabsTrigger value="simulate" className="gap-2">
            <Zap className="h-3.5 w-3.5" /> Live AI Agent
          </TabsTrigger>
          <TabsTrigger value="objections" className="gap-2">
            <AlertTriangle className="h-3.5 w-3.5" /> Objections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="simulate" className="mt-4">
          <AIChatSimulation lead={lead} onUpdate={fetchLeadData} demoMode={demoMode} />
        </TabsContent>

        <TabsContent value="conversations" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Conversation Transcript</CardTitle>
            </CardHeader>
            <CardContent>
              {conversations.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No conversations yet. Start an AI conversation with this lead.
                </p>
              ) : (
                <div className="space-y-6">
                  {conversations.map((conv) => (
                    <div key={conv.id} className="space-y-3">
                      {conv.summary && (
                        <div className="rounded-lg bg-primary/5 p-3 border border-primary/10">
                          <p className="text-xs font-medium text-primary mb-1">AI Summary</p>
                          <p className="text-sm">{conv.summary}</p>
                        </div>
                      )}
                      {conv.messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "assistant" ? "justify-start" : "justify-end"}`}>
                          <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${
                            msg.role === "assistant"
                              ? "bg-muted text-foreground rounded-bl-sm"
                              : "bg-primary text-primary-foreground rounded-br-sm"
                          }`}>
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="objections" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Objections Raised</CardTitle>
            </CardHeader>
            <CardContent>
              {interactions.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  No objections recorded yet.
                </p>
              ) : (
                <div className="space-y-3">
                  {interactions.map((inter) => (
                    <div key={inter.id} className="flex items-center justify-between rounded-lg border p-4">
                      <div className="flex items-center gap-3">
                        {inter.resolved ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-amber-500" />
                        )}
                        <div>
                          <p className="text-sm font-medium capitalize">{inter.objection_type.replace(/_/g, " ")}</p>
                          <p className="text-xs text-muted-foreground capitalize">
                            Sentiment: {inter.sentiment}
                          </p>
                        </div>
                      </div>
                      <Badge variant={inter.resolved ? "default" : "outline"}>
                        {inter.resolved ? "Resolved" : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => updateStatus("new")}>Mark New</Button>
            <Button variant="outline" size="sm" onClick={() => updateStatus("contacted")}>Mark Contacted</Button>
            <Button variant="outline" size="sm" onClick={() => updateStatus("warm")}>Mark Warm</Button>
            <Button variant="outline" size="sm" onClick={() => updateStatus("cold")}>Mark Cold</Button>
            <Button variant="destructive" size="sm" onClick={() => updateStatus("hot")}>
              <Flame className="mr-1 h-3 w-3" /> Mark Hot
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
