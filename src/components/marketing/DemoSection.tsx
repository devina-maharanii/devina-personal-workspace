/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Brain,
  BarChart3,
  Users,
  Send,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TabType = "dashboard" | "ai" | "analytics" | "team";

/**
 * DemoSection allows the user to click tabs (Dashboard, AI Chat, Analytics, Team)
 * and view high-fidelity animated CSS layouts inside a simulated browser container.
 */
export function DemoSection() {
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");

  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "ai", label: "AI Chat Assistant", icon: Brain },
    { id: "analytics", label: "Analytics Stats", icon: BarChart3 },
    { id: "team", label: "Team Management", icon: Users },
  ] as const;

  // 1. Dashboard mockup
  const renderDashboard = () => (
    <div className="space-y-4 animate-fade-in text-muted-foreground">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-card border border-border space-y-1">
          <span className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider">
            Monthly Recurring Revenue
          </span>
          <div className="text-xl font-extrabold text-foreground">$14,250.00</div>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">+18.2% from last month</span>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border space-y-1">
          <span className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider">
            Active Accounts
          </span>
          <div className="text-xl font-extrabold text-foreground">1,420</div>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">+8.4% growth</span>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border space-y-1">
          <span className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider">
            AI Credits Spent
          </span>
          <div className="text-xl font-extrabold text-foreground">45,102 / 50k</div>
          <span className="text-[9px] text-primary font-semibold">90.2% quota filled</span>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-card border border-border space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-foreground">Recent Stripe Invoices</span>
          <span className="text-[10px] text-muted-foreground hover:text-foreground cursor-pointer transition-colors">
            View all invoices
          </span>
        </div>
        <div className="space-y-2">
          {[
            { email: "billing@acme.com", plan: "Enterprise Tier", price: "$99.00", date: "Just now" },
            { email: "sarah.k@design.io", plan: "Pro Tier", price: "$29.00", date: "15 mins ago" },
            { email: "dev.team@supa.sh", plan: "Pro Tier", price: "$29.00", date: "2 hrs ago" },
          ].map((invoice, i) => (
            <div key={i} className="flex justify-between items-center text-xs p-2 rounded-lg bg-background border border-border/80">
              <span className="font-semibold text-foreground/90 truncate max-w-[150px]">{invoice.email}</span>
              <span className="text-[10px] text-primary">{invoice.plan}</span>
              <span className="font-extrabold text-foreground">{invoice.price}</span>
              <span className="text-[10px] text-muted-foreground">{invoice.date}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // 2. AI Chat assistant mockup
  const renderAIChat = () => (
    <div className="space-y-4 animate-fade-in text-muted-foreground h-full flex flex-col justify-between min-h-[300px]">
      <div className="space-y-3 flex-1 overflow-y-auto">
        {/* User Prompt */}
        <div className="flex gap-3 justify-end">
          <div className="bg-primary/20 border border-primary/30 p-3 rounded-2xl rounded-tr-sm max-w-[75%] text-xs">
            <p className="text-foreground font-semibold">Write copy for my SaaS landing page.</p>
          </div>
        </div>

        {/* AI Answer */}
        <div className="flex gap-3">
          <div className="h-7 w-7 rounded bg-primary/15 flex items-center justify-center shrink-0 border border-primary/25">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="bg-card border border-border p-3 rounded-2xl rounded-tl-sm max-w-[75%] text-xs space-y-2">
            <div className="font-bold text-foreground flex items-center gap-1.5">
              <span>Gemini AI Engine</span>
              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                1.5 Flash
              </span>
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8 }}
              className="leading-relaxed text-muted-foreground"
            >
              "Build at the speed of thought. Antigravity handles Auth, Payments, and database configurations so you can focus entirely on writing product features. Ready to ship in hours."
            </motion.p>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <div className="flex items-center gap-2 p-1.5 rounded-xl bg-background border border-border">
        <input
          disabled
          type="text"
          placeholder="Ask Gemini AI assistant to generate code..."
          className="flex-1 bg-transparent border-0 outline-none text-xs text-foreground placeholder:text-muted-foreground/60 px-3 cursor-not-allowed"
        />
        <button
          disabled
          className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shrink-0 cursor-not-allowed opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );

  // 3. Analytics mockup
  const renderAnalytics = () => (
    <div className="space-y-4 animate-fade-in text-muted-foreground">
      <div className="p-4 rounded-xl bg-card border border-border">
        <div className="flex justify-between items-center mb-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground/80 font-bold uppercase tracking-wider">
              Traffic Overview
            </span>
            <span className="text-sm font-extrabold text-foreground">Daily Page Views</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
            <span>Live Data</span>
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
          </div>
        </div>

        {/* Graphical chart mockup */}
        <div className="h-28 flex items-end gap-1.5 pt-4">
          {[25, 45, 60, 30, 70, 85, 40, 95, 65, 80, 50, 90, 75, 100].map((val, i) => (
            <div key={i} className="flex-1 bg-secondary hover:bg-primary transition-colors h-full flex flex-col justify-end rounded-sm">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${val}%` }}
                className="w-full bg-gradient-to-t from-primary to-primary/60 rounded-sm"
                transition={{ duration: 1, delay: i * 0.03 }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Referral tables */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-card border border-border rounded-xl space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest block">
            Referral Sources
          </span>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>GitHub</span>
              <span className="font-bold text-foreground">4,821</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>ProductHunt</span>
              <span className="font-bold text-foreground">1,502</span>
            </div>
          </div>
        </div>

        <div className="p-3 bg-card border border-border rounded-xl space-y-2">
          <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-widest block">
            Top Countries
          </span>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-muted-foreground">
              <span>United States</span>
              <span className="font-bold text-foreground">65%</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>United Kingdom</span>
              <span className="font-bold text-foreground">12%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // 4. Team management mockup
  const renderTeam = () => (
    <div className="space-y-4 animate-fade-in text-muted-foreground">
      <div className="flex justify-between items-center p-4 bg-card border border-border rounded-xl">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-foreground">Collaborator Members</span>
          <span className="text-[10px] text-muted-foreground/80">Manage user roles and team authorization settings.</span>
        </div>
        <button className="text-[10px] font-bold bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:bg-primary/95 transition-colors cursor-pointer">
          Invite Member
        </button>
      </div>

      <div className="space-y-2">
        {[
          { name: "Nishan (You)", email: "nishan@antigravity.io", role: "Owner", active: true },
          { name: "Bob Martin", email: "bob@saasdev.io", role: "Developer", active: true },
          { name: "Charlie Green", email: "charlie@partner.com", role: "Viewer", active: false },
        ].map((member, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-xl bg-card border border-border text-xs"
          >
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded-full bg-cover bg-center shrink-0 border border-border"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-${
                    1534528741775 + i * 100000
                  }?auto=format&fit=crop&w=128&h=128&q=80')`,
                }}
              />
              <div className="flex flex-col">
                <span className="font-bold text-foreground">{member.name}</span>
                <span className="text-[10px] text-muted-foreground/80">{member.email}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] bg-secondary px-2 py-0.5 rounded border border-border text-muted-foreground font-semibold">
                {member.role}
              </span>
              <span className="flex items-center gap-1.5">
                <span className={cn("h-1.5 w-1.5 rounded-full", member.active ? "bg-emerald-500" : "bg-muted-foreground")} />
                <span className="text-[9px] text-muted-foreground/85">{member.active ? "Active" : "Pending"}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const getActiveTabContent = () => {
    switch (activeTab) {
      case "ai":
        return renderAIChat();
      case "analytics":
        return renderAnalytics();
      case "team":
        return renderTeam();
      default:
        return renderDashboard();
    }
  };

  return (
    <section id="demo" className="bg-background py-20 sm:py-28 text-foreground w-full border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Title Block */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            See the Platform In{" "}
            <span className="bg-gradient-to-r from-indigo-600 to-purple-650 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
              Action
            </span>
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Interact with our pre-built dashboard interface to explore live billing lists, AI models, and access logs.
          </p>
        </div>

        {/* Tab Selector bar */}
        <div className="flex flex-wrap justify-center gap-2 max-w-2xl mx-auto border border-border bg-secondary/50 p-1.5 rounded-2xl">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer",
                  isSelected ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {isSelected && (
                  <motion.div
                    layoutId="active-demo-tab"
                    className="absolute inset-0 bg-primary rounded-xl -z-10 shadow-lg shadow-primary/10"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <Icon className="h-4 w-4 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Simulated Browser mockup wrapper */}
        <div className="w-full max-w-4xl mx-auto rounded-2xl border border-border bg-card/20 p-3 shadow-2xl backdrop-blur-md relative aspect-[4/3] sm:aspect-video min-h-[420px] flex flex-col justify-start">
          {/* Browser controls bar */}
          <div className="flex items-center gap-1.5 border-b border-border/80 pb-3 mb-4 shrink-0">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span className="ml-3 text-[10px] font-mono text-muted-foreground/80 bg-background px-2 py-0.5 rounded truncate max-w-[200px]">
              app.antigravity.io/{activeTab}
            </span>
          </div>

          {/* Browser frame viewport */}
          <div className="flex-1 rounded-xl bg-background/90 p-4 border border-border overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="h-full flex flex-col justify-start"
              >
                {getActiveTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DemoSection;
