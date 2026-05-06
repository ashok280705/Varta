-- VĀRTĀ Sample Seed Data
-- Run this AFTER schema.sql in Supabase SQL Editor

INSERT INTO leads (name, phone, email, language, status, score, source) VALUES
  ('Rahul Sharma', '+91 98765 43210', 'rahul.sharma@gmail.com', 'hindi', 'hot', 85, 'website'),
  ('Priya Patel', '+91 87654 32109', 'priya.p@outlook.com', 'english', 'warm', 62, 'referral'),
  ('Amit Kumar', '+91 76543 21098', NULL, 'hinglish', 'new', 10, 'social'),
  ('Sneha Gupta', '+91 65432 10987', 'sneha.g@yahoo.com', 'english', 'contacted', 35, 'advertisement'),
  ('Vikram Singh', '+91 54321 09876', NULL, 'hindi', 'cold', 15, 'cold_call'),
  ('Ananya Reddy', '+91 43210 98765', 'ananya.r@gmail.com', 'english', 'hot', 92, 'website'),
  ('Rajesh Verma', '+91 32109 87654', NULL, 'hinglish', 'warm', 55, 'referral'),
  ('Neha Joshi', '+91 21098 76543', 'neha.j@hotmail.com', 'hindi', 'contacted', 40, 'social'),
  ('Karan Malhotra', '+91 10987 65432', 'karan.m@gmail.com', 'english', 'new', 5, 'website'),
  ('Divya Iyer', '+91 98712 34567', NULL, 'hinglish', 'warm', 48, 'advertisement'),
  ('Arjun Nair', '+91 87612 34567', 'arjun.n@gmail.com', 'english', 'hot', 78, 'referral'),
  ('Meera Kapoor', '+91 76512 34567', NULL, 'hindi', 'cold', 22, 'cold_call');

-- Sample conversations
INSERT INTO conversations (lead_id, messages, language, summary)
SELECT id,
  '[
    {"role": "assistant", "content": "Namaste Rahul ji! Main VĀRTĀ se bol rahi hoon. Kya aap apne investment portfolio ke baare mein baat karna chahenge?", "timestamp": "2025-05-01T10:00:00Z"},
    {"role": "user", "content": "Haan, batao kya options hain?", "timestamp": "2025-05-01T10:01:00Z"},
    {"role": "assistant", "content": "Bahut accha! Hamare paas mutual funds, stocks aur FD options hain. Aapka risk appetite kya hai?", "timestamp": "2025-05-01T10:01:30Z"},
    {"role": "user", "content": "Medium risk chalega, lekin returns acche chahiye", "timestamp": "2025-05-01T10:02:00Z"},
    {"role": "assistant", "content": "Perfect! Aapke liye balanced mutual funds best rahenge. 12-15% annual returns ka track record hai. Kya aap ek call schedule karna chahenge hamare expert se?", "timestamp": "2025-05-01T10:02:30Z"},
    {"role": "user", "content": "Haan, kal subah 10 baje call karo", "timestamp": "2025-05-01T10:03:00Z"}
  ]'::jsonb,
  'hindi',
  'Lead showed strong interest in balanced mutual funds. Prefers medium risk with good returns. Scheduled callback for next morning at 10 AM. High conversion probability.'
FROM leads WHERE name = 'Rahul Sharma';

INSERT INTO conversations (lead_id, messages, language, summary)
SELECT id,
  '[
    {"role": "assistant", "content": "Hi Priya! I am from VĀRTĀ. We help investors find the best financial products. Do you have a moment?", "timestamp": "2025-05-01T11:00:00Z"},
    {"role": "user", "content": "Sure, but I already have a broker", "timestamp": "2025-05-01T11:01:00Z"},
    {"role": "assistant", "content": "That is great! Many of our clients also work with existing brokers. We offer a free portfolio review that often finds optimization opportunities. Would you be interested?", "timestamp": "2025-05-01T11:01:30Z"},
    {"role": "user", "content": "Hmm, maybe. What would that involve?", "timestamp": "2025-05-01T11:02:00Z"},
    {"role": "assistant", "content": "It is a quick 15-minute review where our expert analyzes your current holdings and suggests potential improvements. No pressure, no commitments. Shall I set one up?", "timestamp": "2025-05-01T11:02:30Z"}
  ]'::jsonb,
  'english',
  'Lead has existing broker but showed cautious interest in free portfolio review. Objection about existing broker was handled well. Needs follow-up.'
FROM leads WHERE name = 'Priya Patel';

-- Sample interactions (objections)
INSERT INTO interactions (lead_id, objection_type, resolved, sentiment)
SELECT id, 'already_using_another_broker', true, 'neutral'
FROM leads WHERE name = 'Priya Patel';

INSERT INTO interactions (lead_id, objection_type, resolved, sentiment)
SELECT id, 'not_interested', false, 'negative'
FROM leads WHERE name = 'Vikram Singh';

INSERT INTO interactions (lead_id, objection_type, resolved, sentiment)
SELECT id, 'call_later', true, 'neutral'
FROM leads WHERE name = 'Neha Joshi';

INSERT INTO interactions (lead_id, objection_type, resolved, sentiment, notes)
SELECT id, 'trust_issue', true, 'positive', 'Shared SEBI registration and client testimonials'
FROM leads WHERE name = 'Rajesh Verma';
