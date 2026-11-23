"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";
import { ChevronLeft } from "lucide-react";
import toast from "react-hot-toast";

export default function VerifyPage() {
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const stored = sessionStorage.getItem("spark_phone");
    if (!stored) {
      router.replace("/auth/login");
      return;
    }
    setPhone(stored);
  }, [router]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value.slice(-1);
    setCode(next);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto submit when full
    if (next.every((d) => d) && next.join("").length === 6) {
      verify(next.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const verify = async (token: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: "sms",
      });

      if (error) {
        toast.error(error.message || "Invalid code");
        setCode(["", "", "", "", "", ""]);
        inputs.current[0]?.focus();
        return;
      }

      // Check if profile needs onboarding
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_onboarded")
        .eq("id", data.user?.id)
        .single();

      toast.success("Welcome!");
      if (profile && !profile.is_onboarded) {
        router.replace("/onboarding");
      } else {
        router.replace("/discover");
      }
    } catch {
      toast.error("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    const { error } = await supabase.auth.signInWithOtp({ phone });
    if (error) toast.error(error.message);
    else toast.success("New code sent");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 to-white flex flex-col">
      <div className="px-6 pt-6">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-1 text-sm text-surface-500 hover:text-surface-800 transition"
        >
          <ChevronLeft className="w-4 h-4" />
          Change number
        </Link>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12">
        <div className="w-full max-w-sm animate-slide-up">
          <h1 className="text-2xl font-bold text-center text-surface-900">
            Enter the code
          </h1>
          <p className="mt-2 text-center text-surface-500 text-sm">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-surface-700">{phone}</span>
          </p>

          <div className="mt-10 flex justify-center gap-2.5">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-semibold rounded-2xl border border-surface-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-400 transition"
                disabled={loading}
              />
            ))}
          </div>

          <Button
            size="xl"
            className="w-full mt-8"
            loading={loading}
            onClick={() => verify(code.join(""))}
            disabled={code.some((d) => !d)}
          >
            Verify
          </Button>

          <button
            onClick={resend}
            className="mt-6 w-full text-center text-sm text-brand-600 font-medium hover:text-brand-700"
          >
            Resend code
          </button>
        </div>
      </div>
    </div>
  );
}
