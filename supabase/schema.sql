-- VĀRTĀ Database Schema for Supabase
-- Run this in the Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  language TEXT NOT NULL DEFAULT 'english' CHECK (language IN ('english', 'hindi', 'hinglish')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'hot', 'warm', 'cold')),
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  source TEXT NOT NULL DEFAULT 'website',
  assigned_to UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONVERSATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  messages JSONB NOT NULL DEFAULT '[]'::jsonb,
  language TEXT NOT NULL DEFAULT 'english' CHECK (language IN ('english', 'hindi', 'hinglish')),
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INTERACTIONS TABLE (Objections)
-- ============================================
CREATE TABLE IF NOT EXISTS interactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  objection_type TEXT NOT NULL,
  resolved BOOLEAN NOT NULL DEFAULT false,
  sentiment TEXT NOT NULL DEFAULT 'neutral' CHECK (sentiment IN ('positive', 'negative', 'neutral')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_language ON leads(language);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_id ON conversations(lead_id);
CREATE INDEX IF NOT EXISTS idx_interactions_lead_id ON interactions(lead_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE interactions ENABLE ROW LEVEL SECURITY;

-- Policies: Allow authenticated users full access
CREATE POLICY "Authenticated users can read leads" ON leads
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert leads" ON leads
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update leads" ON leads
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete leads" ON leads
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can read conversations" ON conversations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert conversations" ON conversations
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update conversations" ON conversations
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can read interactions" ON interactions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert interactions" ON interactions
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update interactions" ON interactions
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at
  BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ENABLE REALTIME
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE interactions;
