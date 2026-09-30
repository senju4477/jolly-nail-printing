export function getSiteUrl(value = process.env.NEXT_PUBLIC_SITE_URL): URL {
  const url = new URL(value || "https://centredbycare.com.au");
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password ||
      url.pathname !== "/" || url.search || url.hash) {
    throw new Error("NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin without a path or credentials.");
  }
  return url;
}
