"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import { Profile } from "@/types/database";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { getAge } from "@/lib/utils";

export default function MatchesPage() {
  const [matches, setMatches] = useState<{ id: string; other: Profile }[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/auth/login");
        return;
      }

      const { data: rows } = await supabase
        .from("matches")
        .select("*")
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("is_active", true)
        .order("matched_at", { ascending: false });

      if (!rows?.length) {
        setMatches([]);
        setLoading(false);
        return;
      }

      const otherIds = rows.map((m) =>
        m.user1_id === user.id ? m.user2_id : m.user1_id
      );
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*, photos(url, is_primary)")
        .in("id", otherIds);

      setMatches(
        rows.map((m) => {
          const oid = m.user1_id === user.id ? m.user2_id : m.user1_id;
          const p = profiles?.find((x) => x.id === oid) as any;
          return {
            id: m.id,
            other: {
              ...p,
              primary_photo:
                p?.photos?.find((ph: any) => ph.is_primary)?.url ||
                p?.photos?.[0]?.url,
            },
          };
        })
      );
      setLoading(false);
    })();
  }, []);

  return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 pt-6">
        <h1 className="text-xl font-bold text-surface-900 mb-6">Matches</h1>

        {loading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-[3/4] rounded-2xl bg-surface-100 animate-pulse" />
            ))}
          </div>
        ) : matches.length === 0 ? (
          <div className="py-20 text-center">
            <Heart className="w-12 h-12 text-brand-200 mx-auto" />
            <p className="mt-4 font-medium text-surface-700">No matches yet</p>
            <p className="text-sm text-surface-500 mt-1">
              Keep discovering — mutual likes become matches.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {matches.map((m) => (
              <button
                key={m.id}
                onClick={() => router.push(`/chat/${m.id}`)}
                className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-surface-100 group"
              >
                {m.other.primary_photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.other.primary_photo}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-3xl text-surface-300">
                    {m.other.display_name?.[0]}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white font-medium text-sm truncate">
                    {m.other.display_name}
                    {m.other.birth_date && `, ${getAge(m.other.birth_date)}`}
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
