'use client';

import Image from 'next/image';

/**
 * Concordia College brand logo.
 *
 * The logo image itself contains the college name in text, so we do NOT
 * render any additional text alongside it — just the logo, sized to fit
 * cleanly in navbars, sidebars, auth screens, and footers.
 *
 * Usage:
 *   <BrandLogo size="sm" />   // sidebar / navbar
 *   <BrandLogo size="md" />   // auth screens (default)
 *   <BrandLogo size="lg" />   // landing hero
 *   <BrandLogo variant="light" />  // for dark backgrounds (footer)
 */
type LogoSize = 'xs' | 'sm' | 'sidebar' | 'md' | 'lg' | 'xl';
type LogoVariant = 'default' | 'light' | 'mono';

const SIZES: Record<LogoSize, { h: number; w: number; className: string }> = {
  xs:      { h: 22, w: 74,  className: 'h-[22px] w-[74px]' },   // tiny sidebar collapsed
  sm:      { h: 30, w: 101, className: 'h-[30px] w-[101px]' },  // navbar
  sidebar: { h: 38, w: 128, className: 'h-[38px] w-[128px]' },  // portal sidebar (larger, readable)
  md:      { h: 36, w: 121, className: 'h-9 w-[121px]' },       // auth screens
  lg:      { h: 48, w: 161, className: 'h-12 w-[161px]' },      // landing hero
  xl:      { h: 64, w: 215, className: 'h-16 w-[215px]' },      // large hero
};

export function BrandLogo({
  size = 'md',
  variant = 'default',
  className = '',
  priority = false,
}: {
  size?: LogoSize;
  variant?: LogoVariant;
  className?: string;
  priority?: boolean;
}) {
  const dim = SIZES[size];
  // For light variant on dark backgrounds, we use a CSS brightness filter
  // to keep the logo visible. The source PNG has dark text, so on dark
  // backgrounds we invert it.
  const filterClass =
    variant === 'light'
      ? 'brightness-0 invert opacity-95'
      : variant === 'mono'
        ? 'brightness-0 opacity-80'
        : '';

  return (
    <Image
      src="/concordia-logo.png"
      alt="Concordia College"
      width={dim.w}
      height={dim.h}
      priority={priority}
      className={`${dim.className} ${filterClass} ${className} object-contain`}
    />
  );
}

/**
 * Compact logo mark — just the icon portion, for very tight spaces like
 * collapsed sidebars or mobile app bars. Uses the full logo at a small
 * size since the logo already includes the wordmark.
 */
export function BrandMark({ className = '', size = 32 }: { className?: string; size?: number }) {
  return (
    <Image
      src="/concordia-logo.png"
      alt="Concordia College"
      width={size * 3.35}
      height={size}
      className={`${className} object-contain`}
    />
  );
}
