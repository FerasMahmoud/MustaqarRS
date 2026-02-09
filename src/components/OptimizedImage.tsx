interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * OptimizedImage component that serves WebP images for modern browsers
 * with automatic JPG/PNG fallback using the <picture> element
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  style,
}: OptimizedImageProps) {
  // Convert JPG/PNG path to WebP (e.g., image.jpg -> image.webp)
  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  const mimeType = src.endsWith('.png') ? 'image/png' : 'image/jpeg';

  return (
    <picture>
      <source srcSet={webpSrc} type="image/webp" />
      <source srcSet={src} type={mimeType} />
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        style={style}
      />
    </picture>
  );
}
