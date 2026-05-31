"use client";

import { useEffect, useState } from "react";
import {
  Info,
  Database,
  ShieldCheck,
  Share2,
  Lock,
  User,
  Globe,
  RefreshCw,
  Mail,
  ChevronRight,
} from "lucide-react";

const SECTIONS = [
  { id: "introduction", title: "1. Introduction", icon: Info },
  { id: "information-collection", title: "2. Information We Collect", icon: Database },
  { id: "information-use", title: "3. How We Use Information", icon: ShieldCheck },
  { id: "information-sharing", title: "4. Sharing & Disclosure", icon: Share2 },
  { id: "data-security", title: "5. Data Security & Retention", icon: Lock },
  { id: "user-rights", title: "6. Your Rights & Choices", icon: User },
  { id: "third-party-links", title: "7. Third-Party Links & Services", icon: Globe },
  { id: "policy-changes", title: "8. Changes to this Policy", icon: RefreshCw },
  { id: "contact-us", title: "9. Contact Us", icon: Mail },
];

export default function PrivacyContent() {
  const [activeSection, setActiveSection] = useState("introduction");

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
            Legal & Compliance
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Privacy Policy
          </h1>
          <div className="mt-4 h-1 w-20 rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500" />
          <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground leading-relaxed">
            At Boilerplate Pro, your privacy is a priority. This document outlines how we collect, use, store, and protect your information. Last updated:{" "}
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

          {/* Section 1: Introduction */}
          <section id="introduction" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <Info className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">1. Introduction</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                Welcome to Boilerplate Pro. We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice or our practices with regard to your personal information, please contact us at{" "}
                <a href="mailto:support@boilerplate.pro" className="text-indigo-600 dark:text-indigo-400 hover:underline hover:text-indigo-500 dark:hover:text-indigo-300 font-medium">support@boilerplate.pro</a>.
              </p>
              <p>
                This Privacy Policy describes how we collect, use, process, and disclose your information, including personal information, in conjunction with your access to and use of the Boilerplate Pro web application and related services. By accessing or using our platform, you acknowledge that you have read and agreed to this Privacy Policy.
              </p>
            </div>
          </section>

          {/* Section 2: Information We Collect */}
          <section id="information-collection" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <Database className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">2. Information We Collect</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                We collect information to provide better services to our users. The categories of information we collect include:
              </p>
              
              <div className="space-y-4 mt-6">
                <div className="rounded-xl border border-border bg-card/40 p-5">
                  <h4 className="font-semibold text-foreground mb-2">A. Information You Provide Directly</h4>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm">
                    <li><strong className="text-foreground">Account Credentials:</strong> When you register for an account, we collect your name, email address, password, and optional profile picture.</li>
                    <li><strong className="text-foreground">Billing Information:</strong> If you subscribe to a paid tier, Stripe (our third-party payment processor) collects payment details, credit card numbers, billing addresses, and invoice details. We do not store raw credit card details on our servers.</li>
                    <li><strong className="text-foreground">Communications:</strong> Records of your feedback, customer support queries, or participation in surveys.</li>
                  </ul>
                </div>

                <div className="rounded-xl border border-border bg-card/40 p-5">
                  <h4 className="font-semibold text-foreground mb-2">B. Information Collected Automatically</h4>
                  <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm">
                    <li><strong className="text-foreground">Usage Data:</strong> We track metrics such as access times, features utilized, pages viewed, and navigation patterns within the application.</li>
                    <li><strong className="text-foreground">Device & Connection Details:</strong> IP addresses, browser types, browser language settings, operating systems, and device identifiers.</li>
                    <li><strong className="text-foreground">Cookies & Storage:</strong> We use essential cookies, local storage objects, and session states to maintain authentication status, preferences, and security integrity.</li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Section 3: How We Use Information */}
          <section id="information-use" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">3. How We Use Information</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                We process your information based on legitimate business interests, performance of contracts, and compliance with legal obligations. Specifically, we use your data to:
              </p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                {[
                  "Maintain, operate, and troubleshoot the application.",
                  "Process subscriptions, handle invoicing, and billing.",
                  "Personalize and customize your user dashboard.",
                  "Send administrative alerts, contract updates, or security notices.",
                  "Analyze platform metrics to optimize performance and usability.",
                  "Prevent malicious activities, unauthorized access, and fraud."
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

          {/* Section 4: Sharing & Disclosure */}
          <section id="information-sharing" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <Share2 className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">4. Sharing & Disclosure</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                We do not sell your personal data. We only share information under the following limited circumstances:
              </p>
              <div className="space-y-4 mt-4">
                <p>
                  <strong className="text-foreground">With Trusted Vendors:</strong> We share access to specific parameters with SaaS subcontractors that facilitate core functionalities. E.g., <strong className="text-foreground/80">Stripe</strong> (billing processing), <strong className="text-foreground/80">Clerk</strong> (authentication administration), <strong className="text-foreground/80">Resend</strong> (system mail relay), and our primary hosting and database providers. All providers are contractually obliged to safeguard data.
                </p>
                <p>
                  <strong className="text-foreground">Legal Obligations:</strong> We may disclose information if required to do so by regulatory authority, court order, or law enforcement demand, or to protect the safety, rights, and properties of Boilerplate Pro and its user base.
                </p>
                <p>
                  <strong className="text-foreground">Business Mergers:</strong> In the event that Boilerplate Pro undergoes reorganization, acquisition, or sale of assets, data assets may be transferred under confidentiality protections.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5: Data Security & Retention */}
          <section id="data-security" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">5. Data Security & Retention</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                The security of your personal data is paramount. We implement a variety of standard administrative, technical, and physical safeguards:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-muted-foreground text-sm mt-4">
                <li>All sessions and communications are encrypted in transit using industry-standard TLS (HTTPS).</li>
                <li>Sensitive persistent configurations and system database backups are encrypted at rest.</li>
                <li>Access to system logs and underlying database clusters is restricted to authorized operations personnel.</li>
              </ul>
              <p className="mt-4">
                We retain your information as long as your account remains active. Upon request, or after period of account inactivity, we will purge/anonymize database entries within standard operational limits (typically 30 days), unless legal constraints dictate longer hold parameters.
              </p>
            </div>
          </section>

          {/* Section 6: Your Rights & Choices */}
          <section id="user-rights" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <User className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">6. Your Rights & Choices</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                Depending on your location (such as the European Union under GDPR, or California under CCPA), you possess specific rights regarding personal data control:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="rounded-xl border border-border bg-card/40 p-5">
                  <h5 className="font-semibold text-foreground mb-2">GDPR (European Union)</h5>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs">
                    <li>Right of Access & Portability</li>
                    <li>Right of Rectification (corrections)</li>
                    <li>Right of Erasure (&quot;Right to be Forgotten&quot;)</li>
                    <li>Right to Object or Restrict Processing</li>
                  </ul>
                </div>
                <div className="rounded-xl border border-border bg-card/40 p-5">
                  <h5 className="font-semibold text-foreground mb-2">CCPA (California)</h5>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground text-xs">
                    <li>Right to Know what info is collected</li>
                    <li>Right to Delete personal records</li>
                    <li>Right to Non-discrimination for using rights</li>
                    <li>Right to Opt-Out of data transfers</li>
                  </ul>
                </div>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                To invoke any of these rights, please drop an email message to <a href="mailto:support@boilerplate.pro" className="text-indigo-600 dark:text-indigo-400 hover:underline">support@boilerplate.pro</a>. We will process and respond to legitimate requests within 30 days of validation.
              </p>
            </div>
          </section>

          {/* Section 7: Third-Party Links & Services */}
          <section id="third-party-links" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <Globe className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">7. Third-Party Links & Services</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                Our services may contain hyperlinks pointing to external websites or third-party integrations (e.g., social networks, external analytics, external blogs) not owned or controlled by Boilerplate Pro. We are not responsible for the privacy paradigms, terms of usage, or information collection methods of such websites. We advise users to review the corresponding privacy policies before transmitting any personal details.
              </p>
            </div>
          </section>

          {/* Section 8: Changes to this Policy */}
          <section id="policy-changes" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <RefreshCw className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">8. Changes to this Policy</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                We reserve the right to revise this Privacy Policy periodically. We will signal modifications by posting the new version on this page and updating the &quot;Last updated&quot; date at the top of this document. For significant updates, we may notify you via the email address on file or post prominent banner notifications in the dashboard. Continued use of our platform constitutes agreement to the updated Privacy Policy.
              </p>
            </div>
          </section>

          {/* Section 9: Contact Us */}
          <section id="contact-us" className="scroll-mt-28 space-y-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400 shadow-md shadow-indigo-500/5">
                <Mail className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-bold text-foreground tracking-tight sm:text-3xl">9. Contact Us</h2>
            </div>
            <div className="text-foreground/90 leading-relaxed space-y-4 lg:pl-[3.25rem]">
              <p>
                If you have questions, comments, or regulatory concerns regarding this policy, feel free to contact our data protection team:
              </p>
              
              <div className="mt-4 rounded-2xl border border-border bg-card/40 p-6 max-w-md">
                <h5 className="font-semibold text-foreground mb-2">Boilerplate Pro Compliance Team</h5>
                <p className="text-sm text-muted-foreground space-y-1">
                  <span>Email: </span>
                  <a href="mailto:support@boilerplate.pro" className="text-indigo-600 dark:text-indigo-400 hover:underline">support@boilerplate.pro</a>
                  <br />
                  <span>Response SLA: </span>
                  <span className="text-foreground/90">Within 2 business days</span>
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
