const URL_RE = /(https?:\/\/[^\s]+)/gi;

function shortUrl(raw: string): string {
  try {
    const u = new URL(raw);
    const path = u.pathname.length > 1 ? u.pathname : "";
    const short = u.hostname.replace(/^www\./, "") + path;
    return short.length > 60 ? `${short.slice(0, 57)}…` : short;
  } catch {
    return raw;
  }
}

/** Wishlist text with any http(s) links turned into short, clickable links. */
export function WishText({ text }: { text: string }) {
  const parts = text.split(URL_RE);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 500 }}>
            {shortUrl(part)}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}
