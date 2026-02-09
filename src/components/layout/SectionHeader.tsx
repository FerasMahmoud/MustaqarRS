'use client';

import { useLocale } from 'next-intl';

interface SectionHeaderProps {
  label: string;
  title: string;
  subtitle: string;
  labelAr?: string;
  titleAr?: string;
  subtitleAr?: string;
}

export function SectionHeader({
  label,
  title,
  subtitle,
  labelAr = label,
  titleAr = title,
  subtitleAr = subtitle,
}: SectionHeaderProps) {
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <div className="text-center mb-16">
      {/* Label with gold lines */}
      <div className={`flex items-center justify-center gap-4 mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
        <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-gold"></div>
        <span className="text-xs font-semibold text-gold uppercase tracking-widest">
          {isRtl ? labelAr : label}
        </span>
        <div className={`w-12 h-0.5 bg-gradient-to-${isRtl ? 'l' : 'r'} from-transparent to-gold`}></div>
      </div>

      {/* Large serif title */}
      <h2 className="heading-serif text-4xl md:text-5xl lg:text-6xl text-charcoal mb-6 leading-tight">
        {isRtl ? titleAr : title}
      </h2>

      {/* Subtitle paragraph */}
      <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
        {isRtl ? subtitleAr : subtitle}
      </p>
    </div>
  );
}
