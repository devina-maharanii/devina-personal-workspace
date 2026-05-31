/* eslint-disable @next/next/no-img-element */
/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState, useTransition } from "react";
import { MembershipRole } from "@prisma/client";
import { UploadButton } from "@/lib/uploadthing";
import { toast } from "sonner";
import { 
  Globe, 
  ShieldCheck, 
  ShieldAlert, 
  RefreshCw, 
  Loader2, 
  Palette, 
  Image as ImageIcon,
  HelpCircle,
  Copy,
  Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { saveCustomDomain, saveBrandSettings, verifyDomainDNS } from "@/lib/actions/domain-actions";
import { getErrorMessage } from "@/lib/utils";

interface DomainSettingsClientProps {
  userRole: MembershipRole | null;
  activeOrg: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
  initialSettings: {
    customDomain: string | null;
    domainVerificationToken: string | null;
    domainStatus: string | null;
    brandColor: string | null;
    customFooterText: string | null;
    domainVerifiedAt: Date | null;
  } | null;
}

export default function DomainSettingsClient({ 
  userRole, 
  activeOrg, 
  initialSettings 
}: DomainSettingsClientProps) {
  // Domain state
  const [domainInput, setDomainInput] = useState(initialSettings?.customDomain || "");
  const [domainStatus, setDomainStatus] = useState<string | null>(initialSettings?.domainStatus || null);
  const [verificationToken, setVerificationToken] = useState<string | null>(initialSettings?.domainVerificationToken || null);
  
  // Brand state
  const [brandColor, setBrandColor] = useState(initialSettings?.brandColor || "#6366f1");
  const [customFooterText, setCustomFooterText] = useState(initialSettings?.customFooterText || "");
  const [logo, setLogo] = useState<string | null>(activeOrg.logo);

  const [isPendingDomain, startDomainTransition] = useTransition();
  const [isPendingBrand, startBrandTransition] = useTransition();
  const [isVerifying, startVerifyTransition] = useTransition();
  const [copiedToken, setCopiedToken] = useState(false);

  const canEdit = userRole === "OWNER" || userRole === "ADMIN";

  const handleSaveDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (!domainInput.trim()) return;

    startDomainTransition(async () => {
      try {
        const settings = await saveCustomDomain(activeOrg.id, domainInput);
        setVerificationToken(settings.domainVerificationToken);
        setDomainStatus(settings.domainStatus);
        toast.success("Custom domain saved successfully! Please complete DNS verification.");
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to configure custom domain."));
      }
    });
  };

  const handleSaveBranding = (e: React.FormEvent) => {
    e.preventDefault();

    startBrandTransition(async () => {
      try {
        await saveBrandSettings(activeOrg.id, brandColor, customFooterText, logo);
        toast.success("Brand customizations updated successfully!");
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Failed to update brand settings."));
      }
    });
  };

  const handleVerifyDomain = () => {
    startVerifyTransition(async () => {
      try {
        const result = await verifyDomainDNS(activeOrg.id);
        if (result.success) {
          setDomainStatus("VERIFIED");
          toast.success("Domain verified successfully! SSL mapping is now active.");
        } else {
          setDomainStatus("ERROR");
          toast.error(result.message || "Domain verification failed. DNS records take time to propagate.");
        }
       
      } catch (err: unknown) {
        toast.error(getErrorMessage(err, "Verification check encountered an error."));
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedToken(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="space-y-8 select-none max-w-5xl">
      <div>
        <h1 className="text-xl font-bold text-white sm:text-2xl flex items-center gap-2">
          <Globe className="h-6 w-6 text-indigo-400" />
          <span>Domain & Branding Customization</span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Configure custom domains for your multi-tenant organizations and tailor public-facing pages with custom branding.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Forms */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Custom Domain Settings */}
          <div className="border border-zinc-850 bg-zinc-900/30 rounded-2xl p-6 space-y-6">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="h-5 w-5 text-indigo-400" />
                <span>Custom Domain Settings</span>
              </h3>
              <p className="text-xxs sm:text-xs text-zinc-400 mt-1">
                Map a sub-domain (e.g. <code className="bg-zinc-800 px-1 py-0.5 rounded text-indigo-300">blog.yourcompany.com</code>) to display your organization's public blog.
              </p>
            </div>

            <form onSubmit={handleSaveDomain} className="space-y-4">
              <div>
                <label htmlFor="custom-domain" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Your Custom Domain
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="custom-domain"
                    required
                    disabled={!canEdit || isPendingDomain}
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    placeholder="docs.company.com"
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                  {canEdit && (
                    <button
                      type="submit"
                      disabled={isPendingDomain}
                      className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {isPendingDomain && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      <span>Save Domain</span>
                    </button>
                  )}
                </div>
              </div>
            </form>

            {/* DNS Instructions Block (If domain configured) */}
            <AnimatePresence mode="wait">
              {verificationToken && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="pt-6 border-t border-zinc-800/60 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-zinc-300">DNS Configuration Instructions</h4>
                    <span className="text-xxs text-zinc-500">Records may take up to 24-48h to fully propagate</span>
                  </div>

                  <div className="space-y-3.5">
                    {/* CNAME Record */}
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">1. CNAME Record</span>
                        <span className="text-[10px] text-zinc-500 font-mono">Routing</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xxs font-mono">
                        <div className="bg-zinc-900/50 p-2 rounded">
                          <span className="block text-zinc-500 text-[8px] uppercase">Type</span>
                          <span className="text-white">CNAME</span>
                        </div>
                        <div className="bg-zinc-900/50 p-2 rounded">
                          <span className="block text-zinc-500 text-[8px] uppercase">Host</span>
                          <span className="text-white">{domainInput.split(".")[0] || "@"}</span>
                        </div>
                        <div className="bg-zinc-900/50 p-2 rounded relative group cursor-pointer" onClick={() => copyToClipboard("cname.saasplatform.com")}>
                          <span className="block text-zinc-500 text-[8px] uppercase">Value</span>
                          <span className="text-indigo-300 truncate block">cname.saasplatform.com</span>
                          <Copy className="absolute right-2 top-2 h-3 w-3 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    </div>

                    {/* TXT Record */}
                    <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">2. TXT Record</span>
                        <span className="text-[10px] text-zinc-500 font-mono">Verification</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xxs font-mono">
                        <div className="bg-zinc-900/50 p-2 rounded">
                          <span className="block text-zinc-500 text-[8px] uppercase">Type</span>
                          <span className="text-white">TXT</span>
                        </div>
                        <div className="bg-zinc-900/50 p-2 rounded">
                          <span className="block text-zinc-500 text-[8px] uppercase">Host</span>
                          <span className="text-white">@</span>
                        </div>
                        <div className="bg-zinc-900/50 p-2 rounded relative group cursor-pointer col-span-1" onClick={() => copyToClipboard(`txt-domain-verification=${verificationToken}`)}>
                          <span className="block text-zinc-500 text-[8px] uppercase">Value (Click to copy)</span>
                          <span className="text-amber-300 truncate block">txt-domain-verification={verificationToken.slice(0, 8)}...</span>
                          {copiedToken ? (
                            <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="absolute right-2 top-2 h-3.5 w-3.5 text-zinc-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Manual verification button */}
                  {canEdit && (
                    <button
                      type="button"
                      disabled={isVerifying}
                      onClick={handleVerifyDomain}
                      className="w-full py-2.5 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-transparent text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isVerifying ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      <span>Check DNS & Verify Now</span>
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Brand Customization */}
          <div className="border border-zinc-850 bg-zinc-900/30 rounded-2xl p-6">
            <div className="mb-6">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Palette className="h-5 w-5 text-indigo-400" />
                <span>Branding Customization</span>
              </h3>
              <p className="text-xxs sm:text-xs text-zinc-400 mt-1">
                Customize colors, assets, and metadata elements displayed on your custom domain public website.
              </p>
            </div>

            <form onSubmit={handleSaveBranding} className="space-y-6">
              
              {/* Brand Color & Custom Logo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Brand Color Picker */}
                <div className="space-y-2">
                  <label htmlFor="brand-color" className="block text-xs font-semibold text-zinc-400">
                    Primary Brand Color (Hex)
                  </label>
                  <div className="flex gap-2">
                    <div 
                      className="h-10 w-10 rounded-xl border border-zinc-800 shrink-0" 
                      style={{ backgroundColor: brandColor }}
                    />
                    <input
                      type="color"
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      disabled={!canEdit || isPendingBrand}
                      className="w-12 h-10 border-0 outline-none bg-transparent cursor-pointer rounded overflow-hidden"
                    />
                    <input
                      type="text"
                      id="brand-color"
                      required
                      value={brandColor}
                      onChange={(e) => setBrandColor(e.target.value)}
                      disabled={!canEdit || isPendingBrand}
                      placeholder="#6366f1"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Logo Upload */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-2">
                    Workspace Logo
                  </label>
                  <div className="flex items-center gap-4">
                    {logo ? (
                      <img
                        src={logo}
                        alt="Brand Logo"
                        className="h-10 w-10 rounded-xl border border-zinc-800 object-cover bg-zinc-950"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-xl border border-zinc-800 bg-zinc-950 flex items-center justify-center text-zinc-650">
                        <ImageIcon className="h-5 w-5" />
                      </div>
                    )}
                    {canEdit ? (
                      <UploadButton
                        endpoint="orgLogo"
                        onClientUploadComplete={(res) => {
                          const url = res?.[0]?.url;
                          if (url) {
                            setLogo(url);
                            toast.success("Logo uploaded successfully!");
                          }
                        }}
                        onUploadError={(err: Error) => {
                          toast.error(`Upload error: ${err.message}`);
                        }}
                        appearance={{
                          button:
                            "bg-zinc-850 hover:bg-zinc-800 text-white text-[10px] font-semibold px-3 py-1.5 rounded-lg transition-all cursor-pointer border border-zinc-800",
                          allowedContent: "hidden",
                        }}
                      />
                    ) : (
                      <span className="text-[10px] text-zinc-500">Read-only permissions</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Custom Footer Text */}
              <div>
                <label htmlFor="footer-text" className="block text-xs font-semibold text-zinc-400 mb-1.5">
                  Custom Footer Text
                </label>
                <input
                  type="text"
                  id="footer-text"
                  value={customFooterText}
                  onChange={(e) => setCustomFooterText(e.target.value)}
                  disabled={!canEdit || isPendingBrand}
                  placeholder="e.g. Acme Corp © 2026. All Rights Reserved."
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                />
              </div>

              {canEdit && (
                <div className="pt-4 border-t border-zinc-800/40 flex justify-end">
                  <button
                    type="submit"
                    disabled={isPendingBrand}
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isPendingBrand && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    <span>Save Brand Settings</span>
                  </button>
                </div>
              )}
            </form>
          </div>

        </div>

        {/* Right Side: Status Tracker & SSL details */}
        <div className="space-y-6">
          
          {/* Status Alert Card */}
          <div className="border border-zinc-850 bg-zinc-900/30 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Domain Status</h3>

            {domainStatus === "VERIFIED" ? (
              <div className="p-4 rounded-xl border border-emerald-950 bg-emerald-950/10 text-emerald-450 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <ShieldCheck className="h-4.5 w-4.5" />
                  <span>Active & Verified</span>
                </div>
                <p className="leading-relaxed">
                  Your custom domain is correctly configured and fully active. Traffic resolves automatically!
                </p>
                {initialSettings?.domainVerifiedAt && (
                  <div className="text-[10px] text-zinc-500 pt-1">
                    Verified on {new Date(initialSettings.domainVerifiedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            ) : domainStatus === "ERROR" ? (
              <div className="p-4 rounded-xl border border-red-950 bg-red-950/10 text-red-400 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldAlert className="h-4.5 w-4.5 text-red-500" />
                  <span>Verification Failed</span>
                </div>
                <p className="leading-relaxed">
                  DNS TXT verification record mismatches or is propagation pending. Please review DNS values and re-run.
                </p>
              </div>
            ) : domainStatus === "PENDING" ? (
              <div className="p-4 rounded-xl border border-amber-950 bg-amber-950/10 text-amber-450 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-amber-400">
                  <Loader2 className="h-4.5 w-4.5 animate-spin" />
                  <span>Verification Pending</span>
                </div>
                <p className="leading-relaxed">
                  Domain has been saved, but is not verified. Complete DNS TXT record configuration and check status.
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-400 space-y-1.5 text-xs text-center">
                <Globe className="h-8 w-8 text-zinc-650 mx-auto mb-2" />
                <span className="font-semibold block text-white">No Custom Domain Configured</span>
                <p className="leading-relaxed text-xxs">
                  Input a domain on the left to activate custom domain routing.
                </p>
              </div>
            )}

            {/* SSL Status Indicator */}
            {domainStatus && (
              <div className="pt-2 border-t border-zinc-800/40 flex items-center justify-between text-xs">
                <span className="text-zinc-500">SSL Status</span>
                {domainStatus === "VERIFIED" ? (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold font-mono text-xxs bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-900/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    SECURE (SSL Active)
                  </span>
                ) : (
                  <span className="text-zinc-600 font-mono text-xxs">Pending domain verification</span>
                )}
              </div>
            )}
          </div>

          {/* Quick FAQ / Help Info */}
          <div className="border border-zinc-850 bg-zinc-900/30 rounded-2xl p-6 space-y-4">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4 text-zinc-500" />
              <span>How does this work?</span>
            </h4>
            <div className="space-y-3 text-xxs text-zinc-400 leading-relaxed">
              <p>
                <strong>1. Add CNAME</strong>: Routes browser traffic from your custom subdomain to our web servers on Vercel.
              </p>
              <p>
                <strong>2. DNS TXT Check</strong>: Proof of domain ownership. We query the text record on your domain to authorize mapping.
              </p>
              <p>
                <strong>3. Automated SSL</strong>: Once verified, SSL certificates are automatically provisioned and managed by Vercel on edge routing.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
