/**
 * RTL (Right-to-Left) Utilities for Arabic/Hebrew Support
 * Provides helper functions and types for RTL-aware styling
 */

import { useLocale } from 'next-intl';

/**
 * Hook to check if current locale is RTL
 * Usage: const isRtl = useRtl();
 */
export function useRtl(): boolean {
  const locale = useLocale();
  return locale === 'ar'; // Add other RTL locales as needed: 'he', 'fa', 'ur'
}

/**
 * Hook to get current text direction
 * Returns: 'rtl' or 'ltr'
 */
export function useDirection(): 'rtl' | 'ltr' {
  const isRtl = useRtl();
  return isRtl ? 'rtl' : 'ltr';
}

/**
 * Conditional class utility for RTL
 * Usage: cn(baseClass, rtlConditionalClass(rtlClass, ltrClass))
 */
export function rtlConditionalClass(rtlClass: string, ltrClass: string): string {
  return `${rtlClass} ${ltrClass}`;
}

/**
 * Type-safe RTL class builder
 * Prevents typos in class names
 */
export interface RTLClassConfig {
  base: string;
  rtl?: string;
  ltr?: string;
}

export function buildRTLClass(config: RTLClassConfig): string {
  const { base, rtl, ltr } = config;
  return `${base}${rtl ? ` ${rtl}` : ''}${ltr ? ` ${ltr}` : ''}`;
}

/**
 * Predefined RTL utilities for common patterns
 */
export const rtlUtilities = {
  /**
   * Icon with text - icon on opposite sides based on direction
   */
  flexRow: 'flex gap-4 rtl:flex-row-reverse',
  flexRowCenter: 'flex items-center gap-4 rtl:flex-row-reverse',
  flexRowBetween: 'flex justify-between items-center rtl:flex-row-reverse',

  /**
   * Text alignment utilities
   */
  textStart: 'text-left rtl:text-right',
  textEnd: 'text-right rtl:text-left',
  textCenter: 'text-center', // No RTL variant needed

  /**
   * Margin utilities (one side becomes opposite side in RTL)
   */
  marginStart: 'ml-4 rtl:ml-0 rtl:mr-4',
  marginEnd: 'mr-4 rtl:mr-0 rtl:ml-4',
  marginStartSmall: 'ml-2 rtl:ml-0 rtl:mr-2',
  marginStartLarge: 'ml-8 rtl:ml-0 rtl:mr-8',

  /**
   * Padding utilities
   */
  paddingStart: 'pl-4 rtl:pl-0 rtl:pr-4',
  paddingEnd: 'pr-4 rtl:pr-0 rtl:pl-4',

  /**
   * Card layouts
   */
  card: 'rounded-lg border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-lg',
  cardWithIcon: 'flex gap-4 rtl:flex-row-reverse rounded-lg border p-6',

  /**
   * Icon positioning
   */
  iconWrapper: 'flex-shrink-0 rounded-lg bg-indigo-100 p-3',
  iconElement: 'h-6 w-6 text-indigo-600',
};

/**
 * Object for mapping directions in code logic
 */
export const directionMap = {
  rtl: { flex: 'flex-row-reverse', text: 'text-right' },
  ltr: { flex: '', text: 'text-left' },
} as const;

/**
 * Helper to get direction-specific class
 * Usage: getDirectionClass('rtl', 'ltr') with useRtl() to decide
 */
export function getDirectionClass(rtlClass: string, ltrClass: string, isRtl: boolean): string {
  return isRtl ? rtlClass : ltrClass;
}

/**
 * Grid column order helper
 * Useful for moving elements between sides in responsive layouts
 */
export function getGridOrder(
  rtlOrder: string,
  ltrOrder: string,
  isRtl: boolean
): string {
  return isRtl ? rtlOrder : ltrOrder;
}

/**
 * Arrow icon rotation for RTL
 * Usage: <Icon className={getArrowRotation(isRtl)} />
 */
export function getArrowRotation(isRtl: boolean): string {
  return isRtl ? 'rtl:rotate-180' : '';
}

/**
 * Margin reversal utility
 * Converts left margin to right margin in RTL
 */
export function getMarginClass(
  side: 'left' | 'right' | 'start' | 'end',
  size: 'sm' | 'md' | 'lg' = 'md',
  isRtl: boolean
): string {
  const sizeMap = {
    sm: '2',
    md: '4',
    lg: '8',
  };

  const sizeName = sizeMap[size];

  switch (side) {
    case 'left':
      return isRtl ? `mr-${sizeName} ml-0` : `ml-${sizeName} mr-0`;
    case 'right':
      return isRtl ? `ml-${sizeName} mr-0` : `mr-${sizeName} ml-0`;
    case 'start':
      return isRtl ? `mr-${sizeName} ml-0` : `ml-${sizeName} mr-0`;
    case 'end':
      return isRtl ? `ml-${sizeName} mr-0` : `mr-${sizeName} ml-0`;
    default:
      return '';
  }
}

/**
 * Component props interface for RTL-aware components
 */
export interface RTLAwareProps {
  /** Current text direction */
  direction?: 'rtl' | 'ltr';
  /** Whether to reverse flex direction */
  reverseOnRtl?: boolean;
  /** Custom RTL class to apply */
  rtlClassName?: string;
  /** Custom LTR class to apply */
  ltrClassName?: string;
}

/**
 * Style object builder for RTL with CSS variables
 * Usage: const styles = getRTLStyles(isRtl, { marginStart: '1rem' })
 */
export interface RTLStyleConfig {
  marginStart?: string;
  marginEnd?: string;
  paddingStart?: string;
  paddingEnd?: string;
  textAlign?: 'left' | 'right' | 'center';
}

export function getRTLStyles(
  isRtl: boolean,
  config: RTLStyleConfig
): React.CSSProperties {
  const styles: React.CSSProperties = {};

  if (config.marginStart) {
    styles.marginLeft = isRtl ? 0 : config.marginStart;
    styles.marginRight = isRtl ? config.marginStart : 0;
  }

  if (config.marginEnd) {
    styles.marginRight = isRtl ? 0 : config.marginEnd;
    styles.marginLeft = isRtl ? config.marginEnd : 0;
  }

  if (config.paddingStart) {
    styles.paddingLeft = isRtl ? 0 : config.paddingStart;
    styles.paddingRight = isRtl ? config.paddingStart : 0;
  }

  if (config.paddingEnd) {
    styles.paddingRight = isRtl ? 0 : config.paddingEnd;
    styles.paddingLeft = isRtl ? config.paddingEnd : 0;
  }

  if (config.textAlign) {
    if (config.textAlign === 'left') {
      styles.textAlign = isRtl ? 'right' : 'left';
    } else if (config.textAlign === 'right') {
      styles.textAlign = isRtl ? 'left' : 'right';
    } else {
      styles.textAlign = config.textAlign;
    }
  }

  return styles;
}

/**
 * Common RTL-aware component classes
 * Ready to use in components
 */
export const rtlComponentClasses = {
  /**
   * Icon + Text Card (icon floats in RTL)
   */
  iconCard: {
    container: 'rounded-xl border border-gray-200 bg-white p-6 space-y-4',
    header: 'flex gap-3 rtl:flex-row-reverse items-start',
    icon: 'h-6 w-6 text-indigo-600 flex-shrink-0 mt-1',
    title: 'font-semibold text-gray-900',
    text: 'text-left rtl:text-right text-gray-600',
  },

  /**
   * Hero + Content Layout
   */
  heroLayout: {
    container: 'grid grid-cols-1 lg:grid-cols-2 gap-8 items-center',
    image: 'rounded-2xl overflow-hidden order-2 lg:rtl:order-last lg:ltr:order-first',
    content: 'order-1 lg:rtl:order-first lg:ltr:order-last space-y-6',
    title: 'text-4xl font-bold text-left rtl:text-right',
    subtitle: 'text-lg text-gray-600 text-left rtl:text-right',
  },

  /**
   * Bento Grid
   */
  bentoGrid: {
    container: 'grid gap-6 auto-rows-max grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    card: 'rounded-xl border border-gray-200 bg-white p-6 hover:shadow-lg transition-all',
    cardFeatured: 'col-span-2 row-span-2',
  },

  /**
   * Button with Icon
   */
  buttonWithIcon: {
    container: 'flex items-center gap-2 rtl:flex-row-reverse px-6 py-3 rounded-lg',
    icon: 'h-5 w-5 rtl:rotate-180',
  },

  /**
   * Navigation / Header
   */
  navbar: {
    container: 'flex items-center justify-between px-6 py-4 bg-white border-b',
    logo: 'font-bold text-xl text-gray-900',
    nav: 'flex gap-8 rtl:flex-row-reverse',
    link: 'text-gray-600 hover:text-gray-900 transition',
  },
};

/**
 * Validation utility to ensure locale is RTL-compatible
 */
export const rtlLocales = ['ar', 'he', 'fa', 'ur'] as const;
export type RTLLocale = (typeof rtlLocales)[number];

export function isRTLLocale(locale: string): locale is RTLLocale {
  return rtlLocales.includes(locale as RTLLocale);
}

/**
 * Export all utilities as a namespace
 */
export const RTL = {
  useRtl,
  useDirection,
  rtlConditionalClass,
  buildRTLClass,
  getDirectionClass,
  getGridOrder,
  getArrowRotation,
  getMarginClass,
  getRTLStyles,
  utilities: rtlUtilities,
  componentClasses: rtlComponentClasses,
  isRTLLocale,
};

export default RTL;
