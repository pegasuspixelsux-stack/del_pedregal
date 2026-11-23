'use client';

import NextImage from 'next/image';
import { Image as IKImage } from '@imagekit/next';

const URL_ENDPOINT = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT ?? '';

/** Ready-made sizes: thumbnails, cards and full-width gallery images. */
const PRESETS = {
  thumb: { width: 240, quality: 70 },
  card: { width: 900, quality: 75 },
  gallery: { width: 1800, quality: 85 },
} as const;

export type PropertyImageVariant = keyof typeof PRESETS;

interface PropertyImageProps {
  /** ImageKit URL (or path) of the photo. Photos hosted elsewhere are shown unoptimized. */
  src: string;
  alt: string;
  variant?: PropertyImageVariant;
  /** Fill the parent (which must be positioned). Default: true. */
  fill?: boolean;
  /** Required for responsive sizing when `fill` is used, e.g. "(min-width: 768px) 33vw, 100vw". */
  sizes?: string;
  priority?: boolean;
  className?: string;
}

/**
 * Property photo with ImageKit delivery: resized to the variant's width, quality-tuned and
 * served as WebP/AVIF automatically (format "auto"), with a responsive srcset.
 */
export default function PropertyImage({
  src,
  alt,
  variant = 'card',
  fill = true,
  sizes,
  priority,
  className = 'object-cover',
}: PropertyImageProps) {
  if (!src) return null;

  // "/image_bottles/…" are files in this project's public folder, not ImageKit paths.
  const isLocal = src.startsWith('/image_bottles/');
  const isImageKit =
    !isLocal && (src.startsWith('/') || (URL_ENDPOINT !== '' && src.startsWith(URL_ENDPOINT)));

  if (!isImageKit) {
    // Not on ImageKit (e.g. the Wikimedia sample photos): resized and converted to WebP/AVIF by Next's image optimizer
    // (hosts allowed in next.config.ts), instead of downloading the full-size original.
    return (
      <NextImage
        src={src}
        alt={alt}
        fill={fill}
        sizes={sizes}
        priority={priority}
        quality={75}
        className={className}
      />
    );
  }

  const { width, quality } = PRESETS[variant];
  return (
    <IKImage
      urlEndpoint={URL_ENDPOINT}
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      priority={priority}
      transformation={[{ width, quality, format: 'auto' }]}
      className={className}
    />
  );
}
