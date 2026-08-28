import Link from 'next/link';
import { ArrowRight, Zap, BarChart3, RefreshCw, Smartphone, Shield, Globe } from 'lucide-react';

export default function LandingPage() {
  return (
    <main className="force-light min-h-screen bg-background text-foreground overflow-hidden">
      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-md border-b border-border">
        <span className="text-xl font-bold tracking-tight">
          Ano<span className="text-brand-400">ya</span>
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

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Digital and premium NFC cards that open your profile instantly. Manage multiple personas, track analytics, and save connections with private notes. No app required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/signup"
              className="group inline-flex justify-center items-center gap-2 px-8 py-4 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-2xl transition-all duration-200 hover:scale-105 hover:shadow-lg hover:shadow-brand-500/25 w-56"
            >
              Get Your Card
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              href="/login"
              className="inline-flex justify-center items-center gap-2 px-8 py-4 bg-card text-card-foreground hover:bg-accent text-accent-foreground border border-border font-semibold rounded-2xl transition-all duration-200 w-56"
            >
              Sign In
            </Link>
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
          <p className="text-muted-foreground mb-12">Pay once. Lifetime digital profile. No subscriptions.</p>

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
        <p>© {new Date().getFullYear()} Anoya. Built with ❤️ for GCC professionals.</p>
      </footer>
    </main>
  );
}

const features = [
  {
    icon: Zap,
    title: 'Digital & Physical Cards',
    description: 'Share your profile instantly via Apple/Google Wallet passes, QR codes, or premium NFC cards.',
  },
  {
    icon: Smartphone,
    title: 'Instant vCard Save',
    description: 'Visitors save your contact with one tap. It goes straight into their phone contacts.',
  },
  {
    icon: RefreshCw,
    title: 'Multiple Profiles',
    description: 'Create different personas (e.g. Work, Freelance) and switch which one your card links to anytime.',
  },
  {
    icon: BarChart3,
    title: 'Built-in Analytics',
    description: 'See every tap, unique visitors, countries, device types, and daily trends on your dashboard.',
  },
  {
    icon: Shield,
    title: 'Personal CRM',
    description: 'When others connect back, they are saved in your dashboard. Add private notes so you never forget a face.',
  },
  {
    icon: Globe,
    title: 'Works Everywhere',
    description: 'Links open in any browser. NFC works with all modern iPhones and Android devices.',
  },
];

const steps = [
  {
    title: 'Share your card',
    description: 'Hold your NFC card near any phone, or show your digital wallet QR. Your profile opens instantly.',
  },
  {
    title: 'They save your contact',
    description: 'One tap on "Save Contact" downloads your vCard. They can also connect back with you.',
  },
  {
    title: 'Manage connections',
    description: 'Check your analytics, view saved connections, and add private CRM notes in your dashboard.',
  },
];

