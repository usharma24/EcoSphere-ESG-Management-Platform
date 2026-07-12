import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Leaf, Cloud, Users, ShieldCheck, Trophy, Gift, FileBarChart, Sparkles,
  ArrowRight, Menu, X, CheckCircle2, TrendingUp, Globe2, Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: <Cloud size={22} />,
    title: "Environment Tracking",
    desc: "Monitor carbon, energy, water, and waste metrics in real time across every facility.",
  },
  {
    icon: <Users size={22} />,
    title: "Social Impact",
    desc: "Track community initiatives, employee wellbeing, and social responsibility programs.",
  },
  {
    icon: <ShieldCheck size={22} />,
    title: "Governance",
    desc: "Keep policies, audits, and compliance issues organized and fully transparent.",
  },
  {
    icon: <Trophy size={22} />,
    title: "Challenges",
    desc: "Turn sustainability goals into team challenges that keep everyone engaged.",
  },
  {
    icon: <Gift size={22} />,
    title: "Rewards",
    desc: "Recognize and reward the people driving your organization's ESG progress.",
  },
  {
    icon: <FileBarChart size={22} />,
    title: "Reports",
    desc: "Generate audit-ready ESG reports in a few clicks, backed by real data.",
  },
];

const STATS = [
  { value: "40%", label: "Avg. carbon reduction" },
  { value: "1,200+", label: "Organizations onboard" },
  { value: "98%", label: "Reporting accuracy" },
  { value: "24/7", label: "Real-time monitoring" },
];

const Landing: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-800 overflow-x-hidden">
      {/* Ambient background accents */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-[#C8E6C9]/40 blur-3xl" />
        <div className="absolute top-1/3 -left-32 h-80 w-80 rounded-full bg-[#E8F5E9]/60 blur-3xl" />
      </div>

      {/* Navbar */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-white/80 backdrop-blur-md shadow-soft" : "bg-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary-light text-primary">
              <Leaf className="h-6 w-6 text-[#2E7D32]" />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-800">
              EcoSphere
            </span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-[#2E7D32] transition-colors">
              Features
            </a>
            <a href="#impact" className="text-sm font-medium text-slate-600 hover:text-[#2E7D32] transition-colors">
              Impact
            </a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-[#2E7D32] transition-colors">
              How it works
            </a>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/login"
              className="rounded-md px-4 py-2 text-sm font-semibold text-slate-700 hover:text-[#2E7D32] transition-colors"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="group flex items-center gap-1.5 rounded-md bg-[#2E7D32] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1B5E20] transition-all duration-200"
            >
              Get started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          <button
            className="md:hidden text-slate-600"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white px-6 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <a href="#features" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-slate-600">
                Features
              </a>
              <a href="#impact" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-slate-600">
                Impact
              </a>
              <a href="#how-it-works" onClick={() => setMobileOpen(false)} className="text-sm font-medium text-slate-600">
                How it works
              </a>
              <div className="mt-2 flex flex-col gap-3 border-t border-slate-100 pt-4">
                <Link
                  to="/login"
                  className="rounded-md border border-slate-200 px-4 py-2 text-center text-sm font-semibold text-slate-700"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-[#2E7D32] px-4 py-2 text-center text-sm font-semibold text-white"
                >
                  Get started
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-6 pt-16 pb-20 lg:px-8 lg:pt-24 lg:pb-28">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#C8E6C9] bg-primary-light px-4 py-1.5 text-xs font-semibold text-[#1B5E20]">
              <Sparkles className="h-3.5 w-3.5" />
              AI-powered ESG intelligence
            </div>

            <h1 className="mt-6 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Sustainability,
              <br />
              <span className="text-[#2E7D32]">measured and managed.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-500">
              EcoSphere brings your environmental, social, and governance data into
              one connected platform — so your organization can track progress,
              engage teams, and report with confidence.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/register"
                className="group flex items-center justify-center gap-2 rounded-md bg-[#2E7D32] px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-[#1B5E20] transition-all duration-200"
              >
                Start free today
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link
                to="/login"
                className="flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 hover:border-[#2E7D32] hover:text-[#2E7D32] transition-all duration-200"
              >
                Sign in to your account
              </Link>
            </div>

            <div className="mt-8 flex items-center gap-6 text-sm text-slate-400">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#2E7D32]" />
                No credit card required
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-[#2E7D32]" />
                Setup in minutes
              </div>
            </div>
          </div>

          {/* Visual card */}
          <div className="relative">
            <div className="absolute -inset-4 rounded-lg bg-gradient-to-tr from-[#E8F5E9] to-[#C8E6C9]/50 blur-2xl" />
            <div className="relative rounded-lg border border-slate-100/50 bg-white p-6 shadow-soft">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <span className="text-sm font-semibold text-slate-700">Sustainability Overview</span>
                <span className="flex items-center gap-1 rounded-full bg-primary-light px-2.5 py-1 text-xs font-semibold text-[#2E7D32]">
                  <TrendingUp className="h-3 w-3" /> +12.4%
                </span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-4">
                {[
                  { label: "Carbon Saved", value: "2,480t", icon: <Cloud className="h-4 w-4" /> },
                  { label: "Active Initiatives", value: "36", icon: <Zap className="h-4 w-4" /> },
                  { label: "Team Members", value: "1,204", icon: <Users className="h-4 w-4" /> },
                  { label: "Policies Live", value: "18", icon: <ShieldCheck className="h-4 w-4" /> },
                ].map((item) => (
                  <div key={item.label} className="rounded-md bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      {item.icon}
                      <span className="text-xs font-medium">{item.label}</span>
                    </div>
                    <p className="mt-2 text-xl font-bold text-slate-800">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex items-end gap-1.5 rounded-md bg-slate-50 p-4">
                {[40, 65, 45, 80, 60, 95, 70].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-sm bg-gradient-to-t from-[#2E7D32] to-[#66BB6A]"
                    style={{ height: `${h}px` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats band */}
      <section id="impact" className="border-y border-slate-100 bg-white/60">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-14 lg:grid-cols-4 lg:px-8">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-extrabold text-[#2E7D32] sm:text-4xl">{s.value}</p>
              <p className="mt-2 text-sm font-medium text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Everything your ESG program needs
          </h2>
          <p className="mt-4 text-lg text-slate-500">
            One connected platform for environmental impact, social good, governance,
            and the people who make it happen.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group rounded-lg border border-slate-100/50 bg-white p-6 shadow-soft transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary-light text-[#2E7D32] transition-colors group-hover:bg-[#2E7D32] group-hover:text-white">
                {f.icon}
              </div>
              <h3 className="mt-5 text-lg font-bold text-slate-800">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="bg-white/60 border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
              Get started in three steps
            </h2>
          </div>

          <div className="mt-16 grid gap-10 sm:grid-cols-3">
            {[
              { step: "01", title: "Create your account", desc: "Sign up and set up your organization's profile in minutes." },
              { step: "02", title: "Connect your data", desc: "Bring in environmental, social, and governance metrics from anywhere." },
              { step: "03", title: "Track & report", desc: "Watch progress unfold on live dashboards and export audit-ready reports." },
            ].map((s) => (
              <div key={s.step} className="text-center sm:text-left">
                <span className="text-4xl font-extrabold text-[#C8E6C9]">{s.step}</span>
                <h3 className="mt-3 text-lg font-bold text-slate-800">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <div className="relative overflow-hidden rounded-lg bg-[#1B5E20] px-8 py-16 text-center shadow-soft sm:px-16">
          <div className="pointer-events-none absolute -top-10 -right-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
          <Globe2 className="mx-auto h-10 w-10 text-white/90" />
          <h2 className="mt-6 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Ready to make sustainability measurable?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/80">
            Join organizations already using EcoSphere to track, engage, and report
            their ESG impact with confidence.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="flex items-center gap-2 rounded-md bg-white px-6 py-3.5 text-sm font-semibold text-[#1B5E20] shadow-sm hover:bg-slate-50 transition-all duration-200"
            >
              Create your account
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/login"
              className="flex items-center gap-2 rounded-md border border-white/30 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition-all duration-200"
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary-light text-primary">
              <Leaf className="h-4.5 w-4.5 text-[#2E7D32]" />
            </div>
            <span className="text-sm font-bold text-slate-700">EcoSphere</span>
          </div>
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} EcoSphere. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
