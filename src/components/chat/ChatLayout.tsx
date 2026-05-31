/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { useChatStore } from "@/stores/chatStore";
import ChatSidebar from "./ChatSidebar";
import ChatInterface from "./ChatInterface";
import ChatInput from "./ChatInput";
import CreditWarningBanner from "./CreditWarningBanner";
import UpgradeModal from "./UpgradeModal";
import { Menu, PanelLeftClose, PanelLeft, Bot } from "lucide-react";

interface ChatLayoutProps {
  userAvatar?: string | null;
  usedAiCredits: number;
  maxAiCredits: number;
}

export default function ChatLayout({ userAvatar, usedAiCredits, maxAiCredits }: ChatLayoutProps) {
  const {
    loadConversations,
    sendMessage,
    isStreaming,
    creditsExhausted,
    setCreditsExhausted,
  } = useChatStore();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedModel, setSelectedModel] = useState("claude-sonnet-4-20250514");

  // Fetch conversations history on load
  useEffect(() => {
    loadConversations();
  }, []);

  return (
    <div className="flex h-[calc(100vh-140px)] rounded-2xl border border-zinc-900 bg-zinc-950 overflow-hidden relative">
      {/* Mobile Drawer Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="flex-1 bg-zinc-950/80 backdrop-blur-sm" onClick={() => setMobileSidebarOpen(false)} />
          <div className="w-80 h-full animate-slide-in-right bg-zinc-950 border-r border-zinc-900">
            <ChatSidebar
              selectedModel={selectedModel}
              onSelectMobileClose={() => setMobileSidebarOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Desktop Sidebar Panel */}
      {!sidebarCollapsed && (
        <div className="hidden lg:block h-full">
          <ChatSidebar selectedModel={selectedModel} />
        </div>
      )}

      {/* Active Chat Column */}
      <div className="flex-1 flex flex-col h-full bg-zinc-900/10 min-w-0">
        {/* Workspace Header */}
        <div className="h-14 border-b border-zinc-900 bg-zinc-950 flex items-center justify-between px-4 select-none">
          <div className="flex items-center gap-3">
            {/* Mobile Sidebar Toggle trigger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              <Menu className="h-4.5 w-4.5" />
            </button>

            {/* Desktop Sidebar Toggle collapse */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden lg:block p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {sidebarCollapsed ? <PanelLeft className="h-4.5 w-4.5" /> : <PanelLeftClose className="h-4.5 w-4.5" />}
            </button>

            <div className="flex items-center gap-2">
              <Bot className="h-4.5 w-4.5 text-indigo-400" />
              <span className="text-xs font-bold text-white tracking-tight uppercase">
                Claude Playground
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xxs font-bold text-zinc-550 uppercase">
              Credits Remaining: {Math.max(0, maxAiCredits - usedAiCredits)}
            </span>
          </div>
        </div>

        {/* Warning banner alerts if credits run low */}
        <div className="px-4 pt-4 shrink-0">
          <CreditWarningBanner usedCredits={usedAiCredits} maxCredits={maxAiCredits} />
        </div>

        {/* Message logs scroll zone */}
        <ChatInterface userAvatar={userAvatar} />

        {/* Chat input block */}
        <ChatInput
          onSend={(content, model, fileUrl) => sendMessage(content, model, fileUrl)}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          isStreaming={isStreaming}
          disabled={usedAiCredits >= maxAiCredits}
        />
      </div>

      {/* Subscription upgrades warning dialog */}
      <UpgradeModal
        isOpen={creditsExhausted || usedAiCredits >= maxAiCredits}
        onClose={() => setCreditsExhausted(false)}
      />
    </div>
  );
}
