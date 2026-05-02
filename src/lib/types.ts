export type LeadStatus = "new" | "contacted" | "hot" | "warm" | "cold";
export type Language = "english" | "hindi" | "hinglish";
export type SentimentType = "positive" | "negative" | "neutral";

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  language: Language;
  status: LeadStatus;
  score: number;
  source: string;
  assigned_to?: string;
  created_at: string;
  updated_at?: string;
}

export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

export interface Conversation {
  id: string;
  lead_id: string;
  messages: Message[];
  language: Language;
  summary?: string;
  created_at: string;
  updated_at?: string;
}

export interface Interaction {
  id: string;
  lead_id: string;
  objection_type: string;
  resolved: boolean;
  sentiment: SentimentType;
  notes?: string;
  created_at: string;
}

export interface DashboardStats {
  totalLeads: number;
  hotLeads: number;
  warmLeads: number;
  coldLeads: number;
  newLeads: number;
  conversionRate: number;
  contactedLeads: number;
}

export interface FunnelData {
  stage: string;
  count: number;
  percentage: number;
}
