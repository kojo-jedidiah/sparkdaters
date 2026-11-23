import Link from "next/link";
import { Heart, Shield, Zap, Globe } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-surface-50">
      {/* Hero */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-100/40 via-transparent to-transparent" />
        
        <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center shadow-lg shadow-brand-500/30">
              <Heart className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-xl font-semibold tracking-tight text-surface-900">
              Spark
            </span>
          </div>
          <Link
            href="/auth/login"
            className="text-sm font-medium text-brand-600 hover:text-brand-700 transition"
          >
            Sign in
          </Link>
        </nav>

        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-100 text-brand-700 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            Free forever • Nigeria & worldwide
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-surface-900 leading-[1.1]">
            Meet someone
            <br />
            <span className="bg-gradient-to-r from-brand-500 to-pink-500 bg-clip-text text-transparent">
              real
            </span>
          </h1>
          
          <p className="mt-6 text-lg text-surface-600 max-w-md mx-auto leading-relaxed">
            Sign up with just your phone number. Beautiful profiles, real
            people, no complicated forms.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/auth/login"
              className="w-full sm:w-auto inline-flex items-center justify-center h-14 px-8 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-medium shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:from-brand-600 hover:to-brand-700 transition-all active:scale-[0.98]"
            >
              Get started free
            </Link>
          </div>

          <p className="mt-4 text-xs text-surface-400">
            No email required • OTP to your phone
          </p>
        </div>
      </header>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: Zap,
              title: "Phone only",
              desc: "Sign up in seconds with OTP. No passwords to forget.",
            },
            {
              icon: Shield,
              title: "Selfie verified",
              desc: "Optional selfie check keeps the community real.",
            },
            {
              icon: Heart,
              title: "Winks & Matches",
              desc: "Send a wink or like. Match and start chatting.",
            },
            {
              icon: Globe,
              title: "Made for Nigeria",
              desc: "Works great on local networks. Lagos, Abuja & beyond.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="p-5 rounded-3xl bg-white border border-surface-100 shadow-soft hover:shadow-card transition-shadow"
            >
              <div className="w-10 h-10 rounded-2xl bg-brand-50 flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-brand-600" />
              </div>
              <h3 className="font-semibold text-surface-900">{f.title}</h3>
              <p className="mt-1 text-sm text-surface-500 leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-surface-100 py-8 text-center text-sm text-surface-400">
        © {new Date().getFullYear()} Spark Date. Free to use worldwide.
      </footer>
    </div>
  );
}
