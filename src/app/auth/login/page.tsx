"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { Heart, ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const formatToE164 = (input: string) => {
    let cleaned = input.replace(/\D/g, "");
    // Nigeria defaults
    if (cleaned.startsWith("0") && cleaned.length === 11) {
      cleaned = "234" + cleaned.slice(1);
    }
    if (cleaned.startsWith("234") && cleaned.length === 13) {
      return "+" + cleaned;
    }
    if (cleaned.length >= 10 && !cleaned.startsWith("234")) {
      // Assume user already typed country code or international
      return "+" + cleaned;
    }
    return "+234" + cleaned.replace(/^0/, "");
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }

    setLoading(true);
    const e164 = formatToE164(phone);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: e164,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      // Store phone for verify step
      sessionStorage.setItem("spark_phone", e164);
      toast.success("Code sent! Check your messages");
      router.push("/auth/verify");
    } catch (err) {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col">
      <div className="px-6 pt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-800 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="flex justify-center mb-8">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-xl shadow-brand-500/30">
              <Heart className="w-8 h-8 text-white fill-white" />
            </div>
          </div>

          <h1 className="text-2xl font-bold text-center text-surface-900">
            Welcome to Spark
          </h1>
          <p className="mt-2 text-center text-surface-500 text-sm">
            Enter your phone number. We&apos;ll text you a code.
          </p>

          <form onSubmit={handleSendOTP} className="mt-8 space-y-5">
            <div>
              <label className="block text-sm font-medium text-surface-700 mb-1.5">
                Phone number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 text-sm font-medium">
                  +234
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="801 234 5678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-14 pl-16 pr-4 rounded-2xl border border-surface-200 bg-white text-lg tracking-wide focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-400 transition"
                  autoFocus
                />
              </div>
              <p className="mt-2 text-xs text-surface-400">
                Works with any country. Nigeria numbers start with 0 or +234.
              </p>
            </div>

            <Button
              type="submit"
              size="xl"
              className="w-full"
              loading={loading}
            >
              Continue
            </Button>
          </form>

          <p className="mt-8 text-center text-xs text-surface-400 leading-relaxed">
            By continuing you agree to our Terms and confirm you&apos;re 18+.
            We never share your number.
          </p>
        </div>
      </div>
    </div>
  );
}
