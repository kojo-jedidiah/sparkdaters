"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, MessageCircle, Search, User, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/discover", icon: Search, label: "Discover" },
  { href: "/matches", icon: Heart, label: "Matches" },
  { href: "/winks", icon: Sparkles, label: "Winks" },
  { href: "/chat", icon: MessageCircle, label: "Chat" },
  { href: "/profile", icon: User, label: "Profile" },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      <main className="flex-1 pb-20">{children}</main>

      <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/90 backdrop-blur-xl border-t border-surface-100 safe-bottom">
        <div className="max-w-lg mx-auto flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const active = pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors",
                  active ? "text-brand-600" : "text-surface-400 hover:text-surface-600"
                )}
              >
                <tab.icon
                  className={cn("w-6 h-6", active && "fill-brand-100")}
                  strokeWidth={active ? 2.25 : 1.75}
                />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
