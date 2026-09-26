/** Asks Cloudinary for a copy no wider than `width`; other hosts are returned untouched. */
export function cldThumb(url: string | null | undefined, width: number): string {
  if (!url) return ''
  if (!url.includes('res.cloudinary.com/') || !url.includes('/upload/')) return url
  if (/\/upload\/[^/]*\bw_\d+/.test(url)) return url
  return url.replace('/upload/', `/upload/w_${width},c_limit/`)
}
