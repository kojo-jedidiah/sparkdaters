"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import AppShell from "@/components/AppShell";
import Button from "@/components/ui/Button";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function PreferencesPage() {
  const [minAge, setMinAge] = useState(18);
  const [maxAge, setMaxAge] = useState(45);
  const [genders, setGenders] = useState<string[]>([]);
  const [showMe, setShowMe] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        .from("preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();
      if (data) {
        setMinAge(data.min_age);
        setMaxAge(data.max_age);
        setGenders(data.preferred_genders || []);
        setShowMe(data.show_me);
      }
      setLoading(false);
    })();
  }, []);

  const toggle = (g: string) => {
    setGenders((prev) =>
      prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]
    );
  };

  const save = async () => {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from("preferences")
      .update({
        min_age: minAge,
        max_age: maxAge,
        preferred_genders: genders,
        show_me: showMe,
      })
      .eq("user_id", user.id);
    if (error) toast.error("Could not save");
    else {
      toast.success("Preferences saved");
      router.back();
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <AppShell>
        <div className="p-6">Loading...</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-md mx-auto px-4 pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-surface-500 mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <h1 className="text-xl font-bold mb-6">Search preferences</h1>

        <div className="space-y-6">
          <div>
            <label className="text-sm font-medium text-surface-700">
              Age range: {minAge} – {maxAge}
            </label>
            <div className="mt-3 flex gap-4">
              <input
                type="range"
                min={18}
                max={70}
                value={minAge}
                onChange={(e) => setMinAge(+e.target.value)}
                className="flex-1 accent-brand-500"
              />
              <input
                type="range"
                min={18}
                max={70}
                value={maxAge}
                onChange={(e) => setMaxAge(+e.target.value)}
                className="flex-1 accent-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-surface-700 mb-2 block">
              Show me
            </label>
            <div className="space-y-2">
              {[
                { id: "woman", label: "Women" },
                { id: "man", label: "Men" },
                { id: "non_binary", label: "Non-binary" },
              ].map((g) => (
                <button
                  key={g.id}
                  onClick={() => toggle(g.id)}
                  className={`w-full h-11 rounded-2xl border text-left px-4 text-sm font-medium transition ${
                    genders.includes(g.id)
                      ? "border-brand-500 bg-brand-50 text-brand-700"
                      : "border-surface-200 bg-white"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-surface-100">
            <div>
              <p className="font-medium text-sm">Show my profile</p>
              <p className="text-xs text-surface-500">
                Turn off to pause discovery
              </p>
            </div>
            <button
              onClick={() => setShowMe(!showMe)}
              className={`w-12 h-7 rounded-full transition ${
                showMe ? "bg-brand-500" : "bg-surface-200"
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow transition transform ${
                  showMe ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <Button className="w-full" size="lg" loading={saving} onClick={save}>
            Save preferences
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
