import { describe, it, expect, vi, beforeEach } from "vitest";
import type { AnchorHTMLAttributes, ReactNode } from "react";
import { render, screen } from "@testing-library/react";
import NotificationBell from "@/components/shared/NotificationBell";

// ─── Mock useNotifications hook ───────────────────────────────────────────────

const mockUseNotifications = vi.fn();

vi.mock("@/hooks/useNotifications", () => ({
  useNotifications: () => mockUseNotifications(),
}));

// ─── Mock next/navigation (useRouter) ─────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

// ─── Mock next/link ───────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

const defaultHookResult = {
  notifications: [],
  unreadCount: 0,
  markAsRead: vi.fn(),
  markAllAsRead: vi.fn(),
  deleteNotification: vi.fn(),
  isLoading: false,
};

beforeEach(() => {
  mockUseNotifications.mockReturnValue(defaultHookResult);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("NotificationBell", () => {
  it("renders the bell trigger button", () => {
    render(<NotificationBell />);
    expect(screen.getByRole("button", { name: /notifications/i })).toBeInTheDocument();
  });

  it("does NOT show an unread badge when unreadCount is 0", () => {
    render(<NotificationBell />);
    // Badge is only rendered when unreadCount > 0
    expect(screen.queryByText(/^\d+\+?$/)).toBeNull();
  });

  it("shows the unread count badge when unreadCount > 0", () => {
    mockUseNotifications.mockReturnValue({ ...defaultHookResult, unreadCount: 5 });
    render(<NotificationBell />);
    expect(screen.getByText("5")).toBeInTheDocument();
  });

  it("shows '9+' badge when unreadCount exceeds 9", () => {
    mockUseNotifications.mockReturnValue({ ...defaultHookResult, unreadCount: 12 });
    render(<NotificationBell />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("shows '9+' badge at exactly 10 unread", () => {
    mockUseNotifications.mockReturnValue({ ...defaultHookResult, unreadCount: 10 });
    render(<NotificationBell />);
    expect(screen.getByText("9+")).toBeInTheDocument();
  });

  it("does not render dropdown by default (closed state)", () => {
    render(<NotificationBell />);
    // "View all notifications" link only appears in the open dropdown
    expect(screen.queryByText(/view all notifications/i)).toBeNull();
  });
});
