"use client";

import { useEffect, useState } from "react";
import { motion, Variants } from "framer-motion";
import {
  Users,
  Flame,
  TrendingUp,
  UserPlus,
  Phone,
  ThermometerSun,
  Snowflake,
  ArrowUpRight,
  Handshake,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import type { Lead, DashboardStats } from "@/lib/types";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";

const container: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    hotLeads: 0,
    warmLeads: 0,
    coldLeads: 0,
    newLeads: 0,
    conversionRate: 0,
    contactedLeads: 0,
  });
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();

    // Set up Realtime listener
    const supabase = createClient();
    const channel = supabase
      .channel("dashboard-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => {
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchDashboardData() {
    const supabase = createClient();
    const { data: leads } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });

    if (leads) {
      const total = leads.length;
      const hot = leads.filter((l) => l.status === "hot").length;
      const warm = leads.filter((l) => l.status === "warm").length;
      const cold = leads.filter((l) => l.status === "cold").length;
      const newL = leads.filter((l) => l.status === "new").length;
      const contacted = leads.filter((l) => l.status === "contacted").length;
      const convRate = total > 0 ? Math.round((hot / total) * 100) : 0;

      setStats({
        totalLeads: total,
        hotLeads: hot,
        warmLeads: warm,
        coldLeads: cold,
        newLeads: newL,
        conversionRate: convRate,
        contactedLeads: contacted,
      });
      setRecentLeads(leads.slice(0, 8));
    }
    setLoading(false);
  }

  const kpiCards = [
    {
      title: "Total Leads",
      value: stats.totalLeads,
      icon: Users,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      title: "Hot Leads",
      value: stats.hotLeads,
      icon: Flame,
      color: "text-red-500",
      bg: "bg-red-500/10",
    },
    {
      title: "Warm Leads",
      value: stats.warmLeads,
      icon: ThermometerSun,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
    },
    {
      title: "Cold Leads",
      value: stats.coldLeads,
      icon: Snowflake,
      color: "text-sky-500",
      bg: "bg-sky-500/10",
    },
    {
      title: "New Today",
      value: stats.newLeads,
      icon: UserPlus,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      title: "Conversion Rate",
      value: `${stats.conversionRate}%`,
      icon: TrendingUp,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
    },
  ];

  const funnelStages = [
    { stage: "Contacted", count: stats.contactedLeads, color: "bg-purple-500" },
    { stage: "Engaged", count: stats.warmLeads + stats.hotLeads, color: "bg-amber-500" },
    { stage: "Qualified", count: stats.hotLeads, color: "bg-orange-500" },
    { stage: "Converted", count: Math.round(stats.hotLeads * 0.6), color: "bg-emerald-500" },
  ];

  const maxFunnel = Math.max(...funnelStages.map((s) => s.count), 1);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Header */}
      <motion.div variants={item}>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-muted-foreground">
          Your AI-powered lead conversion overview
        </p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={item} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="group relative overflow-hidden transition-shadow hover:shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{kpi.title}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight">{kpi.value}</p>
                </div>
                <div className={`rounded-xl p-3 ${kpi.bg}`}>
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
              </div>
            </CardContent>
            <div className={`absolute bottom-0 left-0 h-1 w-full ${kpi.bg} opacity-0 transition-opacity group-hover:opacity-100`} />
          </Card>
        ))}
      </motion.div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Funnel */}
        <motion.div variants={item} className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Conversion Funnel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {funnelStages.map((stage) => {
                const pct = Math.round((stage.count / maxFunnel) * 100);
                return (
                  <div key={stage.stage} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{stage.stage}</span>
                      <span className="text-muted-foreground">{stage.count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                        className={`h-full rounded-full ${stage.color}`}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="mt-8 pt-6 border-t">
                <div className="flex items-center gap-2 text-sm font-semibold mb-4">
                  <Handshake className="h-4 w-4 text-primary" />
                  RM Handoff Queue
                </div>
                <div className="space-y-2">
                  {recentLeads.filter(l => l.status === 'hot').slice(0, 3).map(lead => (
                    <div key={lead.id} className="flex items-center justify-between p-2 rounded bg-primary/5 border border-primary/10">
                      <span className="text-xs font-medium">{lead.name}</span>
                      <Badge variant="hot" className="text-[10px] h-4">HOT</Badge>
                    </div>
                  ))}
                  {stats.hotLeads === 0 && (
                    <p className="text-[10px] text-muted-foreground italic text-center py-2">No leads ready for handoff</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Leads */}
        <motion.div variants={item} className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Leads</CardTitle>
              <Link href="/leads" className="text-sm text-primary hover:underline flex items-center gap-1">
                View all <ArrowUpRight className="h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentLeads.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No leads yet. Add your first lead!
                  </p>
                ) : (
                  recentLeads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="flex items-center justify-between rounded-lg border border-transparent p-3 transition-all hover:border-border hover:bg-accent/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">{lead.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={lead.status as "hot" | "warm" | "cold" | "new" | "contacted"}>
                          {lead.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatRelativeTime(lead.created_at)}
                        </span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
}
