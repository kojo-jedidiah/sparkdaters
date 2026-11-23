"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Camera, Check } from "lucide-react";
import toast from "react-hot-toast";

const STEPS = ["About you", "Photos", "Preferences"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    display_name: "",
    birth_date: "",
    gender: "" as "" | "woman" | "man" | "non_binary" | "other",
    city: "",
    bio: "",
    looking_for: [] as string[],
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const update = (key: string, value: any) =>
    setForm((f) => ({ ...f, [key]: value }));

  const toggleLooking = (g: string) => {
    setForm((f) => ({
      ...f,
      looking_for: f.looking_for.includes(g)
        ? f.looking_for.filter((x) => x !== g)
        : [...f.looking_for, g],
    }));
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo must be under 5MB");
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const finish = async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload photo if present
      let photoUrl: string | null = null;
      let storagePath: string | null = null;
      if (photoFile) {
        const ext = photoFile.name.split(".").pop();
        storagePath = `${user.id}/primary.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("photos")
          .upload(storagePath, photoFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage
          .from("photos")
          .getPublicUrl(storagePath);
        photoUrl = urlData.publicUrl;
      }

      // Update profile
      const { error: profErr } = await supabase
        .from("profiles")
        .update({
          display_name: form.display_name.trim(),
          birth_date: form.birth_date,
          gender: form.gender,
          city: form.city.trim() || null,
          bio: form.bio.trim() || null,
          looking_for: form.looking_for,
          is_onboarded: true,
          profile_complete: !!photoUrl,
        })
        .eq("id", user.id);

      if (profErr) throw profErr;

      if (photoUrl && storagePath) {
        await supabase.from("photos").insert({
          user_id: user.id,
          url: photoUrl,
          storage_path: storagePath,
          is_primary: true,
          order_index: 0,
        });
      }

      // Update preferences genders
      await supabase
        .from("preferences")
        .update({ preferred_genders: form.looking_for })
        .eq("user_id", user.id);

      toast.success("You're all set!");
      router.replace("/discover");
    } catch (err: any) {
      toast.error(err.message || "Could not save profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface-50">
      <div className="max-w-md mx-auto px-6 py-8">
        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-brand-500" : "bg-surface-200"
              }`}
            />
          ))}
        </div>

        <h1 className="text-2xl font-bold text-surface-900">{STEPS[step]}</h1>
        <p className="mt-1 text-sm text-surface-500">
          {step === 0 && "Tell people who you are"}
          {step === 1 && "A great photo gets more matches"}
          {step === 2 && "Who do you want to meet?"}
        </p>

        <div className="mt-8 space-y-5">
          {step === 0 && (
            <>
              <Input
                label="First name"
                placeholder="Ada"
                value={form.display_name}
                onChange={(e) => update("display_name", e.target.value)}
              />
              <Input
                label="Birthday"
                type="date"
                value={form.birth_date}
                onChange={(e) => update("birth_date", e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-2">
                  Gender
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(["woman", "man", "non_binary", "other"] as const).map(
                    (g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => update("gender", g)}
                        className={`h-11 rounded-2xl border text-sm font-medium transition ${
                          form.gender === g
                            ? "border-brand-500 bg-brand-50 text-brand-700"
                            : "border-surface-200 bg-white text-surface-700"
                        }`}
                      >
                        {g === "non_binary" ? "Non-binary" : g.charAt(0).toUpperCase() + g.slice(1)}
                      </button>
                    )
                  )}
                </div>
              </div>
              <Input
                label="City (optional)"
                placeholder="Lagos"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
              />
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1.5">
                  Bio
                </label>
                <textarea
                  rows={3}
                  maxLength={300}
                  placeholder="A little about you..."
                  value={form.bio}
                  onChange={(e) => update("bio", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 resize-none"
                />
              </div>
            </>
          )}

          {step === 1 && (
            <div className="flex flex-col items-center">
              <label className="relative w-48 h-48 rounded-3xl overflow-hidden bg-surface-100 border-2 border-dashed border-surface-300 flex items-center justify-center cursor-pointer hover:border-brand-400 transition">
                {photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photoPreview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <Camera className="w-8 h-8 text-surface-400 mx-auto" />
                    <p className="mt-2 text-sm text-surface-500">
                      Add your best photo
                    </p>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handlePhoto}
                />
              </label>
              <p className="mt-4 text-xs text-surface-400 text-center">
                Clear face photos work best. You can add more later.
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-3">
                I&apos;m interested in
              </label>
              <div className="space-y-2">
                {[
                  { id: "woman", label: "Women" },
                  { id: "man", label: "Men" },
                  { id: "non_binary", label: "Non-binary people" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleLooking(opt.id)}
                    className={`w-full h-12 px-4 rounded-2xl border flex items-center justify-between transition ${
                      form.looking_for.includes(opt.id)
                        ? "border-brand-500 bg-brand-50"
                        : "border-surface-200 bg-white"
                    }`}
                  >
                    <span className="font-medium text-surface-800">
                      {opt.label}
                    </span>
                    {form.looking_for.includes(opt.id) && (
                      <Check className="w-5 h-5 text-brand-600" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-10 flex gap-3">
          {step > 0 && (
            <Button
              variant="secondary"
              size="lg"
              className="flex-1"
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </Button>
          )}
          {step < 2 ? (
            <Button
              size="lg"
              className="flex-1"
              onClick={() => setStep((s) => s + 1)}
              disabled={
                (step === 0 &&
                  (!form.display_name || !form.birth_date || !form.gender)) ||
                (step === 1 && !photoFile)
              }
            >
              Continue
            </Button>
          ) : (
            <Button
              size="lg"
              className="flex-1"
              loading={loading}
              onClick={finish}
              disabled={form.looking_for.length === 0}
            >
              Start discovering
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
