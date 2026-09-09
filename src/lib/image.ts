// Serve right-sized Cloudinary images. Grids and thumbnails don't need the
// full-resolution upload, so we inject a width-limit transform to cut bytes.
export function cldThumb(url: string | null | undefined, width: number): string {
  if (!url) return ''
  if (!url.includes('res.cloudinary.com/') || !url.includes('/upload/')) return url
  if (/\/upload\/[^/]*\bw_\d+/.test(url)) return url
  return url.replace('/upload/', `/upload/w_${width},c_limit/`)
}
