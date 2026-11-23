"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import { Match, Message, Profile } from "@/types/database";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";

export default function ChatListPage() {
  const [matches, setMatches] = useState<(Match & { other?: Profile; last?: Message })[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    const { data: matchRows } = await supabase
      .from("matches")
      .select("*")
      .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
      .eq("is_active", true)
      .order("last_message_at", { ascending: false, nullsFirst: false });

    if (!matchRows?.length) {
      setMatches([]);
      setLoading(false);
      return;
    }

    const otherIds = matchRows.map((m) =>
      m.user1_id === user.id ? m.user2_id : m.user1_id
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*, photos(url, is_primary)")
      .in("id", otherIds);

    const { data: messages } = await supabase
      .from("messages")
      .select("*")
      .in(
        "match_id",
        matchRows.map((m) => m.id)
      )
      .order("created_at", { ascending: false });

    const enriched = matchRows.map((m) => {
      const otherId = m.user1_id === user.id ? m.user2_id : m.user1_id;
      const otherRaw = profiles?.find((p) => p.id === otherId);
      const other = otherRaw
        ? {
            ...otherRaw,
            primary_photo:
              (otherRaw as any).photos?.find((ph: any) => ph.is_primary)?.url ||
              (otherRaw as any).photos?.[0]?.url,
          }
        : undefined;
      const last = messages?.find((msg) => msg.match_id === m.id);
      return { ...m, other, last };
    });

    setMatches(enriched);
    setLoading(false);
  };

  return (
    <AppShell>
      <div className="max-w-md mx-auto">
        <div className="px-5 pt-6 pb-4">
          <h1 className="text-xl font-bold text-surface-900">Messages</h1>
        </div>

        {loading ? (
          <div className="space-y-3 px-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-2xl bg-surface-100 animate-pulse"
              />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="px-6 py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-brand-400" />
            </div>
            <h2 className="font-semibold text-surface-800">No conversations yet</h2>
            <p className="mt-2 text-sm text-surface-500">
              When you match with someone, you can chat here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {matches.map((m) => (
              <button
                key={m.id}
                onClick={() => router.push(`/chat/${m.id}`)}
                className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-surface-50 transition text-left"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-200 shrink-0">
                  {m.other?.primary_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.other.primary_photo}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-surface-400 font-medium text-lg">
                      {m.other?.display_name?.[0] || "?"}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-surface-900 truncate">
                      {m.other?.display_name || "Someone"}
                    </p>
                    {m.last && (
                      <span className="text-[11px] text-surface-400 shrink-0 ml-2">
                        {formatDistanceToNow(new Date(m.last.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-surface-500 truncate mt-0.5">
                    {m.last?.content || "Say hello 👋"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
