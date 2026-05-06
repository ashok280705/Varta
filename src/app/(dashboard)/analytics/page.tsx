"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, Legend 
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { Lead } from "@/lib/types";
import { Loader2, TrendingUp, Users, Languages, Target } from "lucide-react";

const COLORS = ["#8b5cf6", "#ef4444", "#f59e0b", "#0ea5e9", "#10b981"];

export default function AnalyticsPage() {
  const [data, setData] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const supabase = createClient();
      const { data } = await supabase.from("leads").select("*");
      if (data) setData(data);
      setLoading(false);
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // 1. Status Distribution
  const statusData = [
    { name: "New", value: data.filter(l => l.status === "new").length },
    { name: "Contacted", value: data.filter(l => l.status === "contacted").length },
    { name: "Hot", value: data.filter(l => l.status === "hot").length },
    { name: "Warm", value: data.filter(l => l.status === "warm").length },
    { name: "Cold", value: data.filter(l => l.status === "cold").length },
  ];

  // 2. Language Breakdown
  const languageData = [
    { name: "English", value: data.filter(l => l.language === "english").length },
    { name: "Hindi", value: data.filter(l => l.language === "hindi").length },
    { name: "Hinglish", value: data.filter(l => l.language === "hinglish").length },
  ];

  // 3. Source Breakdown
  const sourceCounts: Record<string, number> = {};
  data.forEach(l => {
    sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
  });
  const sourceData = Object.entries(sourceCounts).map(([name, value]) => ({ name, value }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="mt-1 text-muted-foreground">Comprehensive insights into your lead conversion pipeline</p>
      </div>

      {/* KPI Overviews */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Total Volume</span>
            </div>
            <p className="text-2xl font-bold">{data.length}</p>
            <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Conversion Rate</span>
            </div>
            <p className="text-2xl font-bold">
              {data.length > 0 ? Math.round((data.filter(l => l.status === "hot").length / data.length) * 100) : 0}%
            </p>
            <p className="text-xs text-muted-foreground mt-1">Target: 30%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Languages className="h-4 w-4" />
              <span className="text-sm font-medium">Top Language</span>
            </div>
            <p className="text-2xl font-bold capitalize">
              {languageData.sort((a, b) => b.value - a.value)[0]?.name || "N/A"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Based on engagement</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Avg. Score</span>
            </div>
            <p className="text-2xl font-bold">
              {data.length > 0 ? Math.round(data.reduce((acc, curr) => acc + curr.score, 0) / data.length) : 0}
            </p>
            <p className="text-xs text-emerald-500 mt-1">+5.2 points today</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Lead Status Distribution */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Lead Status Distribution</CardTitle>
            <CardDescription>Current state of your lead pipeline</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                  cursor={{ fill: "hsl(var(--muted)/0.3)" }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Language Breakdown */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Language Breakdown</CardTitle>
            <CardDescription>Primary languages detected by VĀRTĀ</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {languageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Analysis */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Lead Source Analysis</CardTitle>
            <CardDescription>Where your most valuable leads are coming from</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sourceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis type="number" axisLine={false} tickLine={false} hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false}
                  width={100}
                  tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: "hsl(var(--background))", borderColor: "hsl(var(--border))", borderRadius: "8px" }}
                />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
