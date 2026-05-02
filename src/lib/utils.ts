import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDate(date);
}

export function getScoreLabel(score: number): "Hot" | "Warm" | "Cold" {
  if (score > 70) return "Hot";
  if (score >= 40) return "Warm";
  return "Cold";
}

export function getScoreColor(score: number): string {
  if (score > 70) return "text-red-500";
  if (score >= 40) return "text-amber-500";
  return "text-blue-400";
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    new: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    contacted: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    hot: "bg-red-500/10 text-red-500 border-red-500/20",
    warm: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    cold: "bg-sky-500/10 text-sky-500 border-sky-500/20",
  };
  return colors[status] || colors.new;
}
