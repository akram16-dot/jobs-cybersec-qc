// Parser RSS/Atom minimaliste, zéro dépendance.
// Suffisant pour CyberSecJobs, InfoSec-Jobs, We Work Remotely et Emplois Québec.

export interface RssItem {
  title: string;
  link: string;
  description: string;
  pubDate: string | null;
  guid: string;
  category?: string;
}

function stripTags(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function firstTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i");
  const m = block.match(re);
  return m ? m[1] : "";
}

function firstAttr(block: string, tag: string, attr: string): string {
  const re = new RegExp(`<${tag}[^>]*\\s${attr}="([^"]+)"`, "i");
  const m = block.match(re);
  return m ? m[1] : "";
}

export function parseRss(xml: string): RssItem[] {
  const items: RssItem[] = [];

  // Essayer RSS 2.0 (<item>) puis Atom (<entry>)
  const itemBlocks = xml.match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of itemBlocks) {
    const title = stripTags(firstTag(block, "title"));
    const link = stripTags(firstTag(block, "link"));
    const description = stripTags(
      firstTag(block, "description") || firstTag(block, "content:encoded")
    );
    const pubDate = stripTags(firstTag(block, "pubDate")) || null;
    const guid = stripTags(firstTag(block, "guid")) || link;
    const category = stripTags(firstTag(block, "category"));
    if (title && link) {
      items.push({
        title,
        link,
        description: description.slice(0, 1500),
        pubDate,
        guid,
        category,
      });
    }
  }

  if (items.length === 0) {
    // Atom fallback
    const entryBlocks = xml.match(/<entry[\s\S]*?<\/entry>/gi) || [];
    for (const block of entryBlocks) {
      const title = stripTags(firstTag(block, "title"));
      const link =
        firstAttr(block, "link", "href") || stripTags(firstTag(block, "link"));
      const description = stripTags(
        firstTag(block, "summary") || firstTag(block, "content")
      );
      const pubDate =
        stripTags(firstTag(block, "published") || firstTag(block, "updated")) ||
        null;
      const guid = stripTags(firstTag(block, "id")) || link;
      if (title && link) {
        items.push({
          title,
          link,
          description: description.slice(0, 1500),
          pubDate,
          guid,
        });
      }
    }
  }

  return items;
}

export function parseDate(d: string | null): string | null {
  if (!d) return null;
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(t).toISOString();
}
