"use client";

import { useEffect, useState } from "react";
import {
  Scale,
  User,
  CreditCard,
  ShieldAlert,
  FileText,
  Shield,
  AlertCircle,
  Globe,
  Mail,
  ChevronRight,
} from "lucide-react";

const SECTIONS = [
  { id: "acceptance", title: "1. Acceptance of Terms", icon: Scale },
  { id: "accounts", title: "2. User Accounts & Security", icon: User },
  { id: "billing", title: "3. Payments, Billing & Refunds", icon: CreditCard },
  { id: "acceptable-use", title: "4. Acceptable Use Guidelines", icon: ShieldAlert },
  { id: "intellectual-property", title: "5. Intellectual Property", icon: FileText },
  { id: "warranties", title: "6. Warranties & Disclaimers", icon: Shield },
  { id: "limitation-liability", title: "7. Limitation of Liability", icon: AlertCircle },
  { id: "governing-law", title: "8. Governing Law", icon: Globe },
  { id: "modifications", title: "9. Modifications & Contact", icon: Mail },
];

export default function TermsContent() {
  const [activeSection, setActiveSection] = useState("acceptance");

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-20% 0px -55% 0px",
      threshold: 0,
    };

    const handleIntersection = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(handleIntersection, observerOptions);

    SECTIONS.forEach((section) => {
      const el = document.getElementById(section.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 100; // Offset for sticky navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
      setActiveSection(id);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      {/* Header Banner */}
      <div className="relative mb-16 overflow-hidden rounded-[2.5rem] border border-border bg-gradient-to-b from-card/60 to-card/25 p-8 text-center backdrop-blur-xl md:p-16">
        <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-indigo-500/10 blur-[100px] pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-emerald-500/10 blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
            Terms & Conditions
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Terms of Service
          </h1>
          <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500" />
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground leading-relaxed">
            Welcome to Boilerplate Pro. These Terms of Service govern your use of our SaaS platforms and services. Last updated:{" "}
            <span className="font-semibold text-foreground/90">May 22, 2026</span>.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left Sticky Sidebar for Table of Contents */}
        <aside className="hidden lg:block lg:col-span-4">
          <div className="sticky top-28 space-y-6 rounded-2xl border border-border bg-card/40 p-6 backdrop-blur-md">
            <div className="flex items-center gap-2 border-b border-border pb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/90">Table of Contents</h3>
            </div>
            <nav className="flex flex-col space-y-1">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleScrollTo(section.id)}
                    className={`group flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 text-left border-l-2 ${
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400 bg-indigo-500/5 border-indigo-600 dark:border-indigo-500 pl-4"
                        : "text-muted-foreground border-transparent hover:text-foreground hover:bg-secondary/40 pl-3"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`h-4 w-4 shrink-0 transition-colors duration-200 ${
                        isActive ? "text-indigo-600 dark:text-indigo-400" : "text-muted-foreground group-hover:text-foreground"
                      }`} />
                      <span>{section.title}</span>
                    </div>
                    <ChevronRight className={`h-3 w-3 shrink-0 opacity-0 transition-all duration-200 ${
                      isActive ? "opacity-100 translate-x-0.5 text-indigo-600 dark:text-indigo-400" : "group-hover:opacity-40 group-hover:translate-x-0.5"
                    }`} />
                  </button>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Right Main Content Panel */}
        <div className="lg:col-span-8 space-y-16">
          {/* Mobile Jump Section Dropdown/Chips */}
          <div className="lg:hidden rounded-2xl border border-border bg-card/40 p-5 backdrop-blur-md mb-8">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Jump to Section</h3>
            <div className="flex flex-wrap gap-2">
              {SECTIONS.map((section) => (
                <button
                  key={section.id}
                  onClick={() => handleScrollTo(section.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition ${
                    activeSection === section.id
                      ? "border-indigo-500/40 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                  }`}
                >
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          {/* Section 1: Acceptance of Terms */}
          <section id="acceptance" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <Scale className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">1. Acceptance of Terms</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                By creating an account, subscribing, or using the Boilerplate Pro web application and platform services (collectively, the &quot;Services&quot;), you agree to be bound by these Terms of Service (the &quot;Terms&quot;). If you do not agree to all of these Terms, you are explicitly prohibited from accessing or using our Services.
              </p>
              
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5 text-sm text-amber-800 dark:text-amber-300/90">
                <div className="flex items-center gap-2 mb-2 font-semibold">
                  <ShieldAlert className="h-4 w-4" />
                  <span>Important Legal Warning</span>
                </div>
                Please read this document carefully. By agreeing to these Terms, you acknowledge that you have the legal capacity to enter into a binding agreement, and that you represent either yourself or an authorized corporate entity.
              </div>
            </div>
          </section>

          {/* Section 2: User Accounts & Security */}
          <section id="accounts" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">2. User Accounts & Security</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                To access many of our core configurations, you must register for an account. You represent and warrant that the information you provide during registration is accurate, current, and complete.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm mt-4">
                <li><strong className="text-foreground">Account Responsibility:</strong> You are solely responsible for maintaining the confidentiality of your session token, credentials, and authentication password.</li>
                <li><strong className="text-foreground">Activity Auditing:</strong> You assume responsibilities for all activities, actions, and transactions executed under your designated user account.</li>
                <li><strong className="text-foreground">Unauthorized Breaches:</strong> You must immediately notify our response team of any known security compromise, credential leaks, or unauthorized usage of your account profile.</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Payments, Billing & Refunds */}
          <section id="billing" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <CreditCard className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">3. Payments, Billing & Refunds</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                Boilerplate Pro offers free tiers alongside monthly or annual recurring paid subscriptions. By opting into a paid tier, you agree to our pricing, billing schedules, and payment terms:
              </p>
              
              <div className="space-y-4 mt-6">
                <div className="rounded-xl border border-border bg-card/40 p-5">
                  <h4 className="font-semibold text-foreground mb-2">A. Recurring Billing & Authorization</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Subscribers authorize Stripe, our payment processor, to bill the designated payment instrument automatically on each corresponding monthly/annual renewal cycle. Fees are collected in advance of the service interval.
                  </p>
                </div>

                <div className="rounded-xl border border-border bg-card/40 p-5">
                  <h4 className="font-semibold text-foreground mb-2">B. Cancellations & Refund Policies</h4>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    You can cancel subscriptions at any time through your User billing panel. Paid fees are generally non-refundable except where mandated by local consumer protection statutes or unless otherwise stated (e.g. standard 14-day satisfaction refund windows).
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 4: Acceptable Use Guidelines */}
          <section id="acceptable-use" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">4. Acceptable Use Guidelines</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                You agree not to misuse Boilerplate Pro’s services. Specifically, you must not, and must not permit third parties to:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {[
                  "Conduct high-frequency automated scraping without express authorization.",
                  "Reverse engineer, decompile, or copy platform source files.",
                  "Inject malicious payloads, trojans, or distribute malware.",
                  "Circumvent authentication, rate-limiting, or security boundaries.",
                  "Utilize Services for spam, unsolicited messaging, or phishing.",
                  "Interfere with server networks, API infrastructure, or load balancing."
                ].map((item, idx) => (
                  <li key={idx} className="flex gap-3 items-start text-sm text-muted-foreground">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Section 5: Intellectual Property */}
          <section id="intellectual-property" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <FileText className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">5. Intellectual Property</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                Ownership parameters represent a clear-cut division between Boilerplate Pro assets and your custom works:
              </p>
              <div className="space-y-4 mt-4">
                <p>
                  <strong className="text-foreground">Our Property:</strong> Boilerplate Pro, including logo elements, code structure, assets, documentation pages, visual designs, database schemas, and proprietary SaaS libraries are our intellectual property and protected by copyright, trade secrets, and trademark laws.
                </p>
                <p>
                  <strong className="text-foreground">Your Property:</strong> Any custom files, code repositories, user assets, metadata, or data models created, compiled, or uploaded to our service remain yours. You grant us a limited, worldwide, royalty-free license to transmit, store, and process this content solely to provide the services.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Warranties & Disclaimers */}
          <section id="warranties" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <Shield className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">6. Warranties & Disclaimers</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p className="italic">
                &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; REPRESENT THE CORE DISCLAIMER PARADIGM.
              </p>
              <p>
                Boilerplate Pro makes no representations or warranties of any kind, whether express, implied, statutory, or otherwise, concerning the application services. To the maximum extent permitted by law, we disclaim all warranties, including but not limited to, implied warranties of merchantability, satisfactory quality, fitness for a particular purpose, non-infringement, quiet enjoyment, and any warranties arising out of any course of dealing.
              </p>
            </div>
          </section>

          {/* Section 7: Limitation of Liability */}
          <section id="limitation-liability" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <AlertCircle className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">7. Limitation of Liability</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                To the fullest extent permitted by law, Boilerplate Pro, its affiliates, directors, officers, employees, or agents shall not be liable for any indirect, incidental, special, punitive, exemplary, or consequential damages. This includes, without limitation, damages for loss of profits, revenue, data, goodwill, use, or other intangible losses, resulting from:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm mt-4">
                <li>Your access to, use of, or inability to access the platform.</li>
                <li>Any unauthorized access to, alteration of, or security breach involving your transmission or storage parameters.</li>
                <li>Conduct or user content generated by other platform participants.</li>
              </ul>
              <p className="mt-4">
                In no event shall Boilerplate Pro’s aggregate liability for all claims related to the Services exceed the total amount paid by you in the twelve (12) months preceding the date of the claim.
              </p>
            </div>
          </section>

          {/* Section 8: Governing Law */}
          <section id="governing-law" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <Globe className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">8. Governing Law</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                These Terms and your relationship with Boilerplate Pro shall be governed by, and construed in accordance with, the laws of the state of Delaware (or applicable domestic jurisdiction), excluding its conflicts of law rules. Any legal lawsuit or litigation action arising out of these Terms must be filed in the competent courts located in Delaware.
              </p>
            </div>
          </section>

          {/* Section 9: Modifications & Contact */}
          <section id="modifications" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">9. Modifications & Contact</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                We reserve the right, at our sole discretion, to modify or replace these Terms of Service at any time. If a revision is material, we will provide at least 30 days’ notice prior to any new terms taking effect. By continuing to access or use our Services after those revisions become effective, you agree to be bound by the revised Terms.
              </p>
              
              <div className="mt-4 rounded-2xl border border-border bg-card/40 p-6 max-w-md">
                <h5 className="font-semibold text-foreground mb-2">Legal Operations contact</h5>
                <p className="text-sm text-muted-foreground space-y-1">
                  <span>Email: </span>
                  <a href="mailto:support@boilerplate.pro" className="text-indigo-600 dark:text-indigo-400 hover:underline">support@boilerplate.pro</a>
                  <br />
                  <span>SLA response: </span>
                  <span className="text-foreground/90">Within 3 business days</span>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
