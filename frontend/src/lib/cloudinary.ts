// src/lib/cloudinary.ts
//
// Cloudinary can resize and re-encode an image on the fly if a transformation
// segment is inserted after `/upload/` in its delivery URL. This turns the
// full-size original the admin uploaded (often 2–5 MB straight off a phone)
// into a right-sized WebP/AVIF, without changing what is stored in the DB.
//
//   .../image/upload/v123/nacos/a.jpg
//   .../image/upload/f_auto,q_auto,c_limit,w_800/v123/nacos/a.jpg
//
// Anything that isn't a Cloudinary image URL (local /images/..., data: URIs,
// raw/video assets, URLs that already carry a transformation) is returned
// untouched, so this is safe to wrap around any image src.

const CLOUDINARY_IMAGE_UPLOAD = /^(https?:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.*)$/;

// A transformation segment looks like `w_500,c_fill` / `f_auto`; a version
// segment is `v1712345678`; the public id is everything after that.
const HAS_TRANSFORMATION = /^(?!v\d+\/)[a-z]{1,3}_[^/]*\//;

/**
 * Return a resized, auto-format, auto-quality version of a Cloudinary image URL.
 *
 * @param url   The stored image URL.
 * @param width Max width in CSS pixels x device pixel ratio you want to serve
 *              (aim for ~2x the displayed size). Height keeps its aspect ratio
 *              and images are never upscaled (`c_limit`).
 */
export function optimizeImage(url: string, width = 800): string {
  if (!url) return url;
  const match = CLOUDINARY_IMAGE_UPLOAD.exec(url);
  if (!match) return url;

  const [, base, rest] = match;
  if (HAS_TRANSFORMATION.test(rest)) return url;

  return `${base}f_auto,q_auto,c_limit,w_${width}/${rest}`;
}
