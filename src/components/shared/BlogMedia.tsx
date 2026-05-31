import Image from "next/image";

function isLocalImage(src?: string | null): src is string {
  return !!src && !/^https?:\/\//i.test(src);
}

function getInitials(name?: string | null) {
  return (
    (name || "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || "")
      .join("") || "A"
  );
}

export function BlogAvatar({
  src,
  name,
  sizeClassName = "h-7 w-7",
  imageSize = 28,
  fallbackClassName = "text-[10px]",
}: {
  src?: string | null;
  name?: string | null;
  sizeClassName?: string;
  imageSize?: number;
  fallbackClassName?: string;
}) {
  if (isLocalImage(src)) {
    return (
      <Image
        src={src}
        alt={name || "Author"}
        width={imageSize}
        height={imageSize}
        className={`${sizeClassName} rounded-full bg-zinc-800 object-cover`}
      />
    );
  }

  return (
    <div className={`${sizeClassName} rounded-full bg-gradient-to-br from-indigo-500 via-cyan-500 to-emerald-400 flex items-center justify-center font-black text-white shadow-sm ${fallbackClassName}`}>
      {getInitials(name)}
    </div>
  );
}

export function BlogCover({
  src,
  title,
  className,
  imageClassName = "object-cover",
  sizes,
  priority = false,
  fallbackTitleClassName = "text-[11px]",
}: {
  src?: string | null;
  title: string;
  className: string;
  imageClassName?: string;
  sizes?: string;
  priority?: boolean;
  fallbackTitleClassName?: string;
}) {
  if (isLocalImage(src)) {
    return (
      <div className={`relative overflow-hidden bg-zinc-900 ${className}`}>
        <Image
          src={src}
          alt={title}
          fill
          className={imageClassName}
          sizes={sizes}
          priority={priority}
        />
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-950 to-indigo-950 ${className}`}>
      <div className="absolute inset-0 opacity-50 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.35),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(34,211,238,0.2),transparent_30%)]" />
      <div className="absolute inset-x-5 bottom-5">
        <p className={`font-semibold uppercase tracking-[0.22em] text-indigo-200/80 line-clamp-4 ${fallbackTitleClassName}`}>
          {title}
        </p>
      </div>
    </div>
  );
}