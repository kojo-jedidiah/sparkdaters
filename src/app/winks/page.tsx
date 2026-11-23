"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import { Profile, Wink } from "@/types/database";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import toast from "react-hot-toast";

export default function WinksPage() {
  const [winks, setWinks] = useState<(Wink & { from_user?: Profile })[]>([]);
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

    const { data } = await supabase
      .from("winks")
      .select("*, from_user:profiles!from_user_id(*, photos(url, is_primary))")
      .eq("to_user_id", user.id)
      .order("created_at", { ascending: false });

    const mapped = (data || []).map((w: any) => ({
      ...w,
      from_user: w.from_user
        ? {
            ...w.from_user,
            primary_photo:
              w.from_user.photos?.find((p: any) => p.is_primary)?.url ||
              w.from_user.photos?.[0]?.url,
          }
        : undefined,
    }));
    setWinks(mapped);
    setLoading(false);

    // Mark as seen
    await supabase
      .from("winks")
      .update({ is_seen: true })
      .eq("to_user_id", user.id)
      .eq("is_seen", false);
  };

  const likeBack = async (fromId: string) => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("likes").insert({
      from_user_id: user.id,
      to_user_id: fromId,
    });
    if (error) toast.error("Could not like");
    else toast.success("Liked back! Check Matches if mutual.");
  };

  return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 pt-6">
        <h1 className="text-xl font-bold text-surface-900 mb-2">Winks</h1>
        <p className="text-sm text-surface-500 mb-6">
          People who sent you a little spark ✨
        </p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 rounded-2xl bg-surface-100 animate-pulse" />
            ))}
          </div>
        ) : winks.length === 0 ? (
          <div className="py-16 text-center">
            <Sparkles className="w-12 h-12 text-amber-200 mx-auto" />
            <p className="mt-4 font-medium">No winks yet</p>
            <p className="text-sm text-surface-500 mt-1">
              When someone winks at you, they&apos;ll appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {winks.map((w) => (
              <div
                key={w.id}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white border border-surface-100 shadow-soft"
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-surface-200 shrink-0">
                  {w.from_user?.primary_photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={w.from_user.primary_photo}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-surface-400">
                      {w.from_user?.display_name?.[0]}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-surface-900">
                    {w.from_user?.display_name}
                  </p>
                  <p className="text-xs text-surface-400">
                    {formatDistanceToNow(new Date(w.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
                <button
                  onClick={() => likeBack(w.from_user_id)}
                  className="px-3 py-1.5 rounded-xl bg-brand-50 text-brand-600 text-sm font-medium hover:bg-brand-100 transition"
                >
                  Like back
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
