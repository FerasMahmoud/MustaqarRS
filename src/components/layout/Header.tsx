'use client';

import { useLocale } from 'next-intl';
import Link from 'next/link';
import Image from 'next/image';
import { LanguageToggle } from './LanguageToggle';

export function Header() {
  const locale = useLocale();

  return (
    <header className="w-full bg-white border-b border-[#E8E3DB]">
      <div className="container-luxury flex h-20 items-center justify-between">
        {/* Logo & Title */}
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 sm:gap-3 group transition-all duration-500 hover:scale-105"
        >
          <Image
            src="/logo.webp"
            alt="شركة مستقر Logo"
            width={80}
            height={80}
            priority
            className="w-14 h-14 sm:w-20 sm:h-20 object-contain flex-shrink-0 transition-all duration-500 group-hover:drop-shadow-lg"
          />
          <div className="flex flex-col justify-center pt-1">
            <span className="text-xs sm:text-lg font-bold text-[#1A1A1A] leading-tight">
              {locale === 'ar' ? 'شركة مستقر لإدارة الشقق الفندقية' : 'شركة مستقر لإدارة الشقق الفندقية'}
            </span>
            <span className="text-[9px] sm:text-xs text-[#C9A96E] font-medium mt-0.5">
              تسويق - تأجير - تأثيث
            </span>
          </div>
        </Link>

        {/* Language Toggle */}
        <LanguageToggle />
      </div>
    </header>
  );
}
