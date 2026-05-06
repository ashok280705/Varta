"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import type { Lead, LeadStatus, Language } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [langFilter, setLangFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    language: "english" as Language,
    source: "website",
  });

  const fetchLeads = useCallback(async () => {
    const supabase = createClient();
    let query = supabase.from("leads").select("*").order("created_at", { ascending: false });

    if (statusFilter !== "all") query = query.eq("status", statusFilter);
    if (langFilter !== "all") query = query.eq("language", langFilter);
    if (search) query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`);

    const { data } = await query;
    if (data) setLeads(data);
    setLoading(false);
  }, [statusFilter, langFilter, search]);

  useEffect(() => {
    fetchLeads();

    const supabase = createClient();
    const channel = supabase
      .channel("leads-list-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => {
          fetchLeads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeads]);

  async function handleAddLead(e: React.FormEvent) {
    e.preventDefault();
    const supabase = createClient();
    const { error } = await supabase.from("leads").insert({
      name: formData.name,
      phone: formData.phone,
      email: formData.email || null,
      language: formData.language,
      source: formData.source,
      status: "new" as LeadStatus,
      score: 0,
    });

    if (!error) {
      setDialogOpen(false);
      setFormData({ name: "", phone: "", email: "", language: "english", source: "website" });
      fetchLeads();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
          <p className="mt-1 text-muted-foreground">
            Manage and track your lead pipeline
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Add Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Lead</DialogTitle>
              <DialogDescription>Enter the lead details below</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddLead} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Lead name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select
                    value={formData.language}
                    onValueChange={(v) => setFormData({ ...formData, language: v as Language })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="hindi">Hindi</SelectItem>
                      <SelectItem value="hinglish">Hinglish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(v) => setFormData({ ...formData, source: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                      <SelectItem value="social">Social Media</SelectItem>
                      <SelectItem value="cold_call">Cold Call</SelectItem>
                      <SelectItem value="advertisement">Advertisement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">Add Lead</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="hot">Hot</SelectItem>
                  <SelectItem value="warm">Warm</SelectItem>
                  <SelectItem value="cold">Cold</SelectItem>
                </SelectContent>
              </Select>
              <Select value={langFilter} onValueChange={setLangFilter}>
                <SelectTrigger className="w-[130px]"><SelectValue placeholder="Language" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="hindi">Hindi</SelectItem>
                  <SelectItem value="hinglish">Hinglish</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            All Leads <span className="text-muted-foreground font-normal">({leads.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : leads.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-muted-foreground">No leads found</p>
              <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Add your first lead
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">
                    <th className="pb-3 pr-4">Name</th>
                    <th className="pb-3 pr-4">Phone</th>
                    <th className="pb-3 pr-4">Language</th>
                    <th className="pb-3 pr-4">Source</th>
                    <th className="pb-3 pr-4">Score</th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead, i) => (
                    <motion.tr
                      key={lead.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      <td className="py-3 pr-4">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="flex items-center gap-3 hover:text-primary transition-colors"
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{lead.name}</span>
                        </Link>
                      </td>
                      <td className="py-3 pr-4 text-sm text-muted-foreground">{lead.phone}</td>
                      <td className="py-3 pr-4">
                        <span className="text-xs capitalize text-muted-foreground">{lead.language}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-xs capitalize text-muted-foreground">{lead.source}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <span className="text-sm font-semibold">{lead.score}</span>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge variant={lead.status as "hot" | "warm" | "cold" | "new" | "contacted"}>
                          {lead.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-xs text-muted-foreground">
                        {formatRelativeTime(lead.created_at)}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
