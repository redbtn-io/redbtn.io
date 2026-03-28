export async function GET() {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://redbtn.io/</loc>
    <lastmod>2026-03-27</lastmod>
    <priority>1.0</priority>
  </url>
</urlset>`;
  return new Response(body, {
    headers: { "Content-Type": "application/xml" },
  });
}