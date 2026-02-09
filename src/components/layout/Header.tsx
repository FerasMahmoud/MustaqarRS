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
          className="flex items-center gap-3 group transition-all duration-500 hover:scale-105"
        >
          <Image
            src="/logo.png"
            alt="شركة مستقر Logo"
            width={64}
            height={64}
            priority
            className="w-16 h-16 object-contain transition-all duration-500 group-hover:drop-shadow-lg"
          />
          <div className="flex flex-col">
            <span className="text-sm sm:text-lg font-bold text-[#1A1A1A] leading-tight">
              {locale === 'ar' ? 'شركة مستقر لإدارة الشقق الفندقية' : 'شركة مستقر لإدارة الشقق الفندقية'}
            </span>
            <span className="text-[10px] sm:text-xs text-[#C9A96E] font-medium">
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
