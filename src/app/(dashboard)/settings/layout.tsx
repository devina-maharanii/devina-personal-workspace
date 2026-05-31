import { Settings } from "lucide-react";
import SettingsNav from "./SettingsNav";

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  return (
    <div className="space-y-8 text-white max-w-7xl mx-auto">
      {/* Settings Title */}
      <div className="border-b border-zinc-850 pb-5">
        <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent flex items-center gap-2.5">
          <Settings className="h-7 w-7 text-indigo-400" />
          System Preferences
        </h1>
        <p className="text-sm text-zinc-400 mt-1 font-medium">
          Manage your personal details, credentials, api access tokens, and alert notifications.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Side-Nav */}
        <aside className="w-full lg:w-64 shrink-0 p-2 lg:p-4 rounded-3xl border border-zinc-850 bg-zinc-900/10 backdrop-blur-md space-y-2 overflow-hidden">
          <span className="text-[10px] font-bold text-zinc-550 uppercase tracking-widest px-3 hidden lg:block mb-3">
            Settings Navigation
          </span>
          <SettingsNav />
        </aside>

        {/* Right Dashboard Area */}
        <div className="flex-1 w-full p-6 sm:p-8 rounded-3xl border border-zinc-850 bg-zinc-900/20 backdrop-blur-md min-h-[500px]">
          {children}
        </div>
      </div>
    </div>
  );
}
