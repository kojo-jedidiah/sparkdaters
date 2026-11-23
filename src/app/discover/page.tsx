"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import { Profile } from "@/types/database";
import { getAge } from "@/lib/utils";
import Button from "@/components/ui/Button";
import { Heart, X, Sparkles, MapPin, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function DiscoverPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/auth/login");
      return;
    }

    // Simple discovery: onboarded profiles excluding self, already liked/passed
    const { data: liked } = await supabase
      .from("likes")
      .select("to_user_id")
      .eq("from_user_id", user.id);
    const { data: passed } = await supabase
      .from("passes")
      .select("to_user_id")
      .eq("from_user_id", user.id);

    const exclude = [
      user.id,
      ...(liked?.map((l) => l.to_user_id) || []),
      ...(passed?.map((p) => p.to_user_id) || []),
    ];

    const { data, error } = await supabase
      .from("profiles")
      .select("*, photos(url, is_primary)")
      .eq("is_onboarded", true)
      .not("id", "in", `(${exclude.join(",")})`)
      .limit(20);

    if (error) {
      console.error(error);
      toast.error("Could not load people");
    } else {
      const mapped = (data || []).map((p: any) => ({
        ...p,
        primary_photo:
          p.photos?.find((ph: any) => ph.is_primary)?.url ||
          p.photos?.[0]?.url ||
          null,
      }));
      setProfiles(mapped);
    }
    setLoading(false);
  };

  const profile = profiles[current];

  const next = () => {
    if (current < profiles.length - 1) setCurrent((c) => c + 1);
    else {
      toast("You're all caught up for now");
      setProfiles([]);
    }
  };

  const like = async () => {
    if (!profile || actionLoading) return;
    setActionLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("likes").insert({
      from_user_id: user.id,
      to_user_id: profile.id,
    });

    if (error) toast.error("Could not like");
    else {
      toast.success(`You liked ${profile.display_name}`);
      next();
    }
    setActionLoading(false);
  };

  const pass = async () => {
    if (!profile || actionLoading) return;
    setActionLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("passes").insert({
      from_user_id: user.id,
      to_user_id: profile.id,
    });
    next();
    setActionLoading(false);
  };

  const wink = async () => {
    if (!profile || actionLoading) return;
    setActionLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("winks").upsert({
      from_user_id: user.id,
      to_user_id: profile.id,
    });

    if (error) toast.error("Could not send wink");
    else toast.success(`Wink sent to ${profile.display_name} ✨`);
    setActionLoading(false);
  };

  return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-surface-900">Discover</h1>
          <button
            onClick={() => router.push("/preferences")}
            className="text-sm font-medium text-brand-600"
          >
            Preferences
          </button>
        </div>

        {loading ? (
          <div className="h-[480px] rounded-3xl bg-surface-100 animate-pulse" />
        ) : !profile ? (
          <div className="h-[480px] rounded-3xl bg-white border border-surface-100 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-brand-400" />
            </div>
            <h2 className="text-lg font-semibold">No more profiles</h2>
            <p className="mt-2 text-sm text-surface-500">
              Check back later or adjust your preferences.
            </p>
            <Button className="mt-6" onClick={loadProfiles}>
              Refresh
            </Button>
          </div>
        ) : (
          <div className="relative">
            <div className="rounded-3xl overflow-hidden bg-white shadow-card border border-surface-100">
              <div className="aspect-[3/4] relative bg-surface-100">
                {profile.primary_photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.primary_photo}
                    alt={profile.display_name || ""}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-surface-300 text-6xl font-light">
                    {profile.display_name?.[0] || "?"}
                  </div>
                )}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-5 pt-16">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-white">
                      {profile.display_name}
                      {profile.birth_date && (
                        <span className="font-normal opacity-90">
                          {" "}
                          {getAge(profile.birth_date)}
                        </span>
                      )}
                    </h2>
                    {profile.is_verified && (
                      <ShieldCheck className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                  {profile.city && (
                    <p className="text-white/80 text-sm flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5" />
                      {profile.city}
                    </p>
                  )}
                  {profile.bio && (
                    <p className="text-white/90 text-sm mt-2 line-clamp-2">
                      {profile.bio}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={pass}
                disabled={actionLoading}
                className="w-14 h-14 rounded-full bg-white border border-surface-200 shadow-soft flex items-center justify-center text-surface-500 hover:bg-surface-50 active:scale-95 transition"
              >
                <X className="w-7 h-7" />
              </button>
              <button
                onClick={wink}
                disabled={actionLoading}
                className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 shadow-soft flex items-center justify-center text-amber-500 hover:bg-amber-100 active:scale-95 transition"
              >
                <Sparkles className="w-5 h-5" />
              </button>
              <button
                onClick={like}
                disabled={actionLoading}
                className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition"
              >
                <Heart className="w-8 h-8 fill-white" />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
