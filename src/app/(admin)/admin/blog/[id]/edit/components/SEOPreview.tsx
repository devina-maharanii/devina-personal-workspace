"use client";

interface SEOPreviewProps {
  slug: string;
  title: string;
  seoTitle: string;
  excerpt: string;
  seoDescription: string;
}

export default function SEOPreview({
  slug,
  title,
  seoTitle,
  excerpt,
  seoDescription,
}: SEOPreviewProps) {
  const seoTitleLength = seoTitle.length || title.length;
  const seoDescLength = seoDescription.length || excerpt.length;

  const titleScore = seoTitleLength >= 40 && seoTitleLength <= 60 ? "good" : "warning";
  const descScore = seoDescLength >= 120 && seoDescLength <= 160 ? "good" : "warning";

  return (
    <div className="border border-zinc-900 bg-zinc-900/10 p-6 rounded-2xl space-y-6">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-white">Google Search Results Simulator</h3>
        <p className="text-[11px] text-zinc-500">
          Inspect how this publication matches SEO crawling indexations on public search fields.
        </p>
      </div>

      {/* Google Simulator Card */}
      <div className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl space-y-1.5 font-sans">
        <div className="flex items-center gap-1.5 text-zinc-450 text-[11px] text-zinc-400 font-normal">
          <span>https://boilerplate.com</span>
          <span>›</span>
          <span className="truncate">blog › {slug || "untitled"}</span>
        </div>
        <h4 className="text-[#8ab4f8] text-base font-semibold leading-tight hover:underline cursor-pointer">
          {seoTitle || title || "Untitled Draft"}
        </h4>
        <p className="text-[#bdc1c6] text-xs leading-relaxed max-w-[600px]">
          {seoDescription || excerpt || "Read details from our engineering workspace logs..."}
        </p>
      </div>

      {/* Live Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-zinc-900">
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-zinc-400">SEO Title Length</span>
            <span className={titleScore === "good" ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
              {seoTitleLength} chars
            </span>
          </div>
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                titleScore === "good" ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, (seoTitleLength / 60) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-500">Optimal size: 40 - 60 characters.</p>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-zinc-400">Meta Description Length</span>
            <span className={descScore === "good" ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
              {seoDescLength} chars
            </span>
          </div>
          <div className="h-1.5 w-full bg-zinc-900 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                descScore === "good" ? "bg-emerald-500" : "bg-amber-500"
              }`}
              style={{ width: `${Math.min(100, (seoDescLength / 160) * 100)}%` }}
            />
          </div>
          <p className="text-[10px] text-zinc-500">Optimal size: 120 - 160 characters.</p>
        </div>
      </div>
    </div>
  );
}
