import Link from 'next/link';
import { ArrowRight, Zap, BarChart3, RefreshCw, Smartphone, Shield, Globe } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b border-border">
        <span className="text-xl font-bold tracking-tight">
          Tap<span className="text-brand-400">That</span>
        </span>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="text-sm bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors"
          >
            Get Your Card
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 text-center pt-20">
        {/* Gradient glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-600/20 blur-[120px]" />
          <div className="absolute top-1/2 left-1/3 w-[400px] h-[400px] rounded-full bg-violet-600/15 blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-4xl">


          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6">
            Your Professional Identity,
            <br />
            <span className="bg-gradient-to-r from-brand-400 via-violet-400 to-brand-400 bg-clip-text text-transparent">
              One Tap Away
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Premium NFC cards that open your profile instantly editable forever,
            with built-in analytics and instant contact saving. No app, no friction.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/signup"
              className="group inline-flex items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-foreground font-semibold rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-brand-500/25"
            >
              Get Your Card
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-card text-card-foreground hover:bg-accent text-accent-foreground border border-border text-foreground font-semibold rounded-2xl transition-all duration-200"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 rounded-full border-2 border-white/20 flex justify-center pt-2">
            <div className="w-1 h-2 bg-primary/40 rounded-full" />
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold mb-4">
              Everything you need to network like a pro
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Built for professionals in the UAE and GCC who want to leave a lasting impression.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group p-6 rounded-2xl border border-border bg-primary/2 hover:bg-card text-card-foreground hover:border-brand-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mb-4 group-hover:bg-brand-500/20 transition-colors">
                  <feature.icon className="w-5 h-5 text-brand-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-32 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">How it works</h2>
          <p className="text-muted-foreground mb-16">Three steps from tap to saved contact.</p>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <div key={i} className="flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-300 font-bold text-xl">
                  {i + 1}
                </div>
                <h3 className="font-semibold text-lg">{step.title}</h3>
                <p className="text-muted-foreground text-sm text-center">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-32 px-6 border-t border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">Simple pricing</h2>
          <p className="text-muted-foreground mb-12">One card. Lifetime profile. No expiry.</p>

          <div className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl border border-brand-500/30 bg-brand-500/10 text-brand-200 text-lg font-medium">
            <Zap className="w-5 h-5" />
            Pricing coming soon — <Link href="/signup" className="underline underline-offset-4 hover:text-foreground transition-colors">join the waitlist</Link>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-32 px-6 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-4">
            Ready to make your first impression count?
          </h2>
          <p className="text-muted-foreground mb-10">
            Join professionals across the UAE who&apos;ve upgraded from paper cards.
          </p>
          <Link
            href="/signup"
            className="group inline-flex items-center gap-2 px-10 py-5 bg-brand-600 hover:bg-brand-500 text-foreground font-bold text-lg rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-brand-500/30"
          >
            Get Your Card
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-10 px-6 border-t border-border text-center text-muted-foreground text-sm">
        <p>© {new Date().getFullYear()} TapThat. Built with ❤️ for GCC professionals.</p>
      </footer>
    </main>
  );
}

const features = [
  {
    icon: Zap,
    title: 'One Tap, Instant Profile',
    description: 'NFC tap opens your profile in under 200ms — no app needed. QR fallback built in.',
  },
  {
    icon: Smartphone,
    title: 'Instant vCard Save',
    description: 'Visitors save your contact with one tap. It goes straight into their phone contacts.',
  },
  {
    icon: RefreshCw,
    title: 'Editable Forever',
    description: 'Changed job? New number? Update your profile anytime. The card never goes out of date.',
  },
  {
    icon: BarChart3,
    title: 'Built-in Analytics',
    description: 'See every tap, unique visitors, countries, device types, and daily trends.',
  },
  {
    icon: Shield,
    title: 'GDPR Compliant',
    description: 'IP addresses are hashed. No personal data stored without consent.',
  },
  {
    icon: Globe,
    title: 'Works Everywhere',
    description: 'NTAG213 chip — works with all NFC-enabled iPhones (iOS 13+) and Android devices.',
  },
];

const steps = [
  {
    title: 'Tap your card',
    description: 'Hold your TapThat card near any phone. Your profile opens instantly in the browser.',
  },
  {
    title: 'They save your contact',
    description: 'One tap on "Save Contact" downloads your vCard — no app, no signup required.',
  },
  {
    title: 'You see the analytics',
    description: 'Check your dashboard to see who tapped, from where, and on what device.',
  },
];
