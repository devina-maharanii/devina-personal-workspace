import fs from 'fs';
import path from 'path';

let prisma;

const outDir = path.join(process.cwd(), 'public', 'og');
fs.mkdirSync(outDir, { recursive: true });

let posts = [];
try {
  const mod = await import('@prisma/client');
  const { PrismaClient } = mod;
  prisma = new PrismaClient();
  posts = await prisma.blogPost.findMany({
    where: { published: true },
    select: { slug: true, title: true, seoTitle: true },
  });
} catch (_e) {
  console.warn('Prisma unavailable — falling back to data/ markdown files');
  const dataDir = path.join(process.cwd(), 'data');
  if (fs.existsSync(dataDir)) {
    const files = fs.readdirSync(dataDir).filter((f) => f.endsWith('.md'));
    posts = files.map((f) => {
      const content = fs.readFileSync(path.join(dataDir, f), 'utf8');
      const lines = content.split('\n');
      let title = lines.find((l) => l.startsWith('# ')) || f.replace('.md', '');
      if (title.startsWith('# ')) title = title.replace('# ', '').trim();
      const slug = f.replace('.md', '');
      return { slug, title };
    });
  }
}

for (const p of posts) {
  const title = p.seoTitle || p.title || 'Article';
  const slug = p.slug;
  const svg = generateSvg(title);
  const filePath = path.join(outDir, `${slug}.svg`);
  fs.writeFileSync(filePath, svg, 'utf8');
  console.log('Wrote', filePath);
}

if (prisma) await prisma.$disconnect();

function generateSvg(title) {
  const escaped = escapeXml(title);
  return `<?xml version="1.0" encoding="utf-8"?>\n<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">\n  <defs>\n    <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">\n      <stop offset="0%" stop-color="#0f172a" />\n      <stop offset="100%" stop-color="#0ea5a4" />\n    </linearGradient>\n  </defs>\n  <rect width="100%" height="100%" fill="url(#g)" />\n  <g>\n    <text x="60" y="160" font-family="Inter, Roboto, Arial, sans-serif" font-size="42" fill="#ffffff" opacity="0.95">Boilerplate Pro</text>\n    <text x="60" y="260" font-family="Inter, Roboto, Arial, sans-serif" font-size="60" fill="#ffffff" font-weight="700">${escaped}</text>\n    <text x="60" y="340" font-family="Inter, Roboto, Arial, sans-serif" font-size="20" fill="#f0f9ff" opacity="0.9">Engineering insights • Deployments • Learnings</text>\n  </g>\n</svg>`;
}

function escapeXml(unsafe) {
  return String(unsafe).replace(/[&<>"']/g, function (c) {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&apos;';
    }
  });
}

// done
