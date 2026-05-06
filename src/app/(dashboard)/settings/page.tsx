"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Settings as SettingsIcon, Sliders, Upload, Bot, 
  Shield, Bell, Database, Save, CheckCircle2 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function SettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your VĀRTĀ preferences and system configuration</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="general" className="gap-2">
            <SettingsIcon className="h-4 w-4" /> General
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2">
            <Bot className="h-4 w-4" /> AI Engine
          </TabsTrigger>
          <TabsTrigger value="scoring" className="gap-2">
            <Sliders className="h-4 w-4" /> Scoring
          </TabsTrigger>
          <TabsTrigger value="import" className="gap-2">
            <Upload className="h-4 w-4" /> Import/Export
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Organization Profile</CardTitle>
              <CardDescription>Update your company details and workspace settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="org-name">Organization Name</Label>
                  <Input id="org-name" defaultValue="VĀRTĀ Demo Workspace" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input id="timezone" defaultValue="Asia/Kolkata (GMT+5:30)" />
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive daily summaries of hot leads</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Automatic Handoff</Label>
                    <p className="text-sm text-muted-foreground">Automatically assign hot leads to available RMs</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave} className="gap-2">
                {saved ? <CheckCircle2 className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? "Saved" : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* AI Engine Settings */}
        <TabsContent value="ai">
          <Card>
            <CardHeader>
              <CardTitle>AI Conversation Parameters</CardTitle>
              <CardDescription>Configure how VĀRTĀ interacts with your leads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="ai-voice">Default AI Persona</Label>
                <Input id="ai-voice" defaultValue="Professional Financial Assistant" />
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Multilingual Detection</Label>
                    <p className="text-sm text-muted-foreground">Automatically switch languages based on lead input</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Objection Handling</Label>
                    <p className="text-sm text-muted-foreground">Use AI to proactively resolve customer objections</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Custom System Prompt</Label>
                <textarea 
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  defaultValue="You are VĀRTĀ, an intelligent AI assistant. Your goal is to qualify leads by understanding their investment needs..."
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave}>Update Engine</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Scoring Thresholds */}
        <TabsContent value="scoring">
          <Card>
            <CardHeader>
              <CardTitle>Lead Scoring Thresholds</CardTitle>
              <CardDescription>Define the boundaries for Hot, Warm, and Cold leads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-2">
                  <Label className="text-red-500">Hot Threshold</Label>
                  <Input type="number" defaultValue={70} />
                  <p className="text-[10px] text-muted-foreground">Leads above this score are marked Hot</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-amber-500">Warm Threshold</Label>
                  <Input type="number" defaultValue={40} />
                  <p className="text-[10px] text-muted-foreground">Leads between 40 and 70 are marked Warm</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sky-500">Cold Threshold</Label>
                  <Input type="number" defaultValue={20} />
                  <p className="text-[10px] text-muted-foreground">Leads below this score are marked Cold</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <Label>Point Distribution</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Positive Intent</span>
                    <Badge>+15 pts</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Objection Resolved</span>
                    <Badge>+10 pts</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">Wrong Language</span>
                    <Badge variant="outline">-5 pts</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <span className="text-sm">No Interest</span>
                    <Badge variant="destructive">-20 pts</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSave}>Save Thresholds</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Import/Export */}
        <TabsContent value="import">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-primary" />
                  Bulk Import Leads
                </CardTitle>
                <CardDescription>Upload a CSV file to add multiple leads at once</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 bg-muted/20">
                <Database className="h-10 w-10 text-muted-foreground mb-4" />
                <p className="text-sm font-medium">Drag and drop your CSV here</p>
                <p className="text-xs text-muted-foreground mt-1">Maximum file size: 5MB</p>
                <Button variant="outline" className="mt-4">Select File</Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Data Export
                </CardTitle>
                <CardDescription>Export your leads and conversation data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 border rounded-lg bg-muted/10 space-y-2">
                  <p className="text-sm font-medium">Last Export: Never</p>
                  <p className="text-xs text-muted-foreground">Includes all leads, transcripts, and analytics reports</p>
                </div>
                <Button variant="outline" className="w-full">Download CSV</Button>
                <Button variant="outline" className="w-full">Download JSON</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
