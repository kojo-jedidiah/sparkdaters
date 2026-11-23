"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import { Profile } from "@/types/database";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { Settings, ShieldCheck, LogOut, Camera } from "lucide-react";
import { getAge } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
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
      const { data } = await supabase
        .from("profiles")
        .select("*, photos(url, is_primary)")
        .eq("id", user.id)
        .single();
      if (data) {
        setProfile({
          ...data,
          primary_photo:
            (data as any).photos?.find((p: any) => p.is_primary)?.url ||
            (data as any).photos?.[0]?.url,
        });
      }
      setLoading(false);
    })();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.replace("/");
  };

  const startVerification = async () => {
    toast("Selfie verification: upload a clear selfie in the next screen (coming soon). For now mark as pending.");
    // In production: open camera / file picker, upload to verifications bucket, insert row
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("profiles")
      .update({ verification_status: "pending" })
      .eq("id", user.id);
    toast.success("Verification submitted for review");
    setProfile((p) =>
      p ? { ...p, verification_status: "pending" } : p
    );
  };

  if (loading) {
    return (
      <AppShell>
        <div className="max-w-md mx-auto p-6">
          <div className="h-40 rounded-3xl bg-surface-100 animate-pulse" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 pt-6 pb-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">Profile</h1>
          <button
            onClick={() => router.push("/preferences")}
            className="p-2 rounded-xl hover:bg-surface-100"
          >
            <Settings className="w-5 h-5 text-surface-600" />
          </button>
        </div>

        <div className="rounded-3xl overflow-hidden bg-white border border-surface-100 shadow-soft">
          <div className="aspect-[4/3] bg-surface-100 relative">
            {profile?.primary_photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.primary_photo}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="w-12 h-12 text-surface-300" />
              </div>
            )}
          </div>
          <div className="p-5">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold">
                {profile?.display_name}
                {profile?.birth_date && (
                  <span className="font-normal text-surface-500">
                    , {getAge(profile.birth_date)}
                  </span>
                )}
              </h2>
              {profile?.is_verified && (
                <ShieldCheck className="w-5 h-5 text-blue-500" />
              )}
            </div>
            {profile?.city && (
              <p className="text-sm text-surface-500 mt-0.5">{profile.city}</p>
            )}
            {profile?.bio && (
              <p className="mt-3 text-sm text-surface-700 leading-relaxed">
                {profile.bio}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 space-y-3">
          {profile?.verification_status !== "approved" && (
            <Button
              variant="outline"
              className="w-full"
              onClick={startVerification}
            >
              <ShieldCheck className="w-4 h-4" />
              {profile?.verification_status === "pending"
                ? "Verification pending"
                : "Get selfie verified"}
            </Button>
          )}
          <Button variant="secondary" className="w-full" onClick={signOut}>
            <LogOut className="w-4 h-4" />
            Sign out
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
