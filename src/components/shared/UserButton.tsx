"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { UserButton as ClerkUserButton } from "@/lib/clerk-client";
import { LayoutDashboard, Settings, CreditCard } from "lucide-react";
import { useUser } from "@/hooks/useUser";
import { useIsMockAuth } from "@/hooks/useIsMockAuth";
import { signOutMockUser } from "@/lib/actions/mock-auth";

/**
 * UserButton is a shared wrapper around Clerk's UserButton.
 * Displays a subscription tier badge adjacent to the dropdown trigger
 * and appends custom links for app navigation to the dropdown list.
 * Supports mock mode by displaying a custom mockup dropdown menu.
 */
export function UserButton() {
  const isMock = useIsMockAuth();
  const { user, isLoading } = useUser();
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Determine active plan designation
  const getPlanBadge = () => {
    if (isLoading || !user) return null;
    const status = user.subscription?.status;
    const priceId = user.subscription?.stripePriceId;

    if (status !== "ACTIVE" && status !== "TRIALING") {
      return (
        <span className="inline-flex items-center rounded-full bg-zinc-800 px-2 py-0.5 text-xs font-semibold text-zinc-400 ring-1 ring-inset ring-zinc-700/50">
          Free
        </span>
      );
    }

    // Example premium price checks
    if (priceId?.includes("enterprise")) {
      return (
        <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400 ring-1 ring-inset ring-amber-500/30">
          Enterprise
        </span>
      );
    }

    return (
      <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 ring-1 ring-inset ring-indigo-500/30">
        Pro
      </span>
    );
  };

  if (isMock) {
    return (
      <div className="relative flex items-center gap-3" ref={dropdownRef}>
        {getPlanBadge()}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative h-8 w-8 rounded-full overflow-hidden border border-zinc-800 hover:border-zinc-700 transition-colors focus:outline-none cursor-pointer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={user?.imageUrl || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
            alt="User Profile"
            className="h-full w-full object-cover"
          />
        </button>

        {isOpen && (
          <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-zinc-800 bg-zinc-900 p-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
            {/* User Info Header */}
            <div className="px-3 py-2 border-b border-zinc-800 mb-1">
              <p className="text-xs font-bold text-white">{user?.name || "Mock Admin"}</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">{user?.email || "mock-admin@example.com"}</p>
            </div>

            {/* Links */}
            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <LayoutDashboard className="h-4 w-4 text-zinc-400" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <Settings className="h-4 w-4 text-zinc-400" />
              <span>Settings</span>
            </Link>
            <Link
              href="/billing"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all cursor-pointer"
            >
              <CreditCard className="h-4 w-4 text-zinc-400" />
              <span>Billing</span>
            </Link>

            <div className="h-px bg-zinc-800 my-1" />

            {/* Sign Out Button */}
            <button
              onClick={async () => {
                setIsOpen(false);
                await signOutMockUser();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-red-450 hover:text-red-400 hover:bg-red-950/20 transition-all cursor-pointer text-left"
            >
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      {getPlanBadge()}
      <ClerkUserButton
        appearance={{
          variables: {
            colorPrimary: "#6366f1",
            colorBackground: "#18181b",
            colorInputBackground: "#09090b",
            colorInputText: "#ffffff",
            colorText: "#f4f4f5",
            colorTextSecondary: "#a1a1aa",
            borderRadius: "12px",
          },
          elements: {
            userButtonPopoverCard: "border border-zinc-800 bg-zinc-900 shadow-2xl",
            userButtonPopoverCustomItemsButton: "hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors",
            userButtonPopoverActionButton: "hover:bg-zinc-800 text-zinc-300 hover:text-white transition-colors",
            userButtonPopoverFooter: "hidden", // Removes the default Clerk branding links footer
          },
        }}
      >
        <ClerkUserButton.MenuItems>
          <ClerkUserButton.Link
            label="Dashboard"
            labelIcon={<LayoutDashboard className="h-4 w-4 text-zinc-400" />}
            href="/dashboard"
          />
          <ClerkUserButton.Link
            label="Settings"
            labelIcon={<Settings className="h-4 w-4 text-zinc-400" />}
            href="/settings"
          />
          <ClerkUserButton.Link
            label="Billing"
            labelIcon={<CreditCard className="h-4 w-4 text-zinc-400" />}
            href="/billing"
          />
        </ClerkUserButton.MenuItems>
      </ClerkUserButton>
    </div>
  );
}

export default UserButton;
