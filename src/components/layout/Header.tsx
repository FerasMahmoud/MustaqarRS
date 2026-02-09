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
            width={48}
            height={48}
            priority
            className="w-12 h-12 object-contain transition-all duration-500 group-hover:drop-shadow-lg"
          />
          <span className="text-sm sm:text-lg font-bold text-[#1A1A1A]">
            {locale === 'ar' ? 'شركة مستقر' : 'شركة مستقر'}
          </span>
        </Link>

        {/* Language Toggle */}
        <LanguageToggle />
      </div>
    </header>
  );
}
