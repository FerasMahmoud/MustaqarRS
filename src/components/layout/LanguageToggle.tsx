'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { Globe } from 'lucide-react';
import { useState, useEffect } from 'react';

export function LanguageToggle() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const switchLocale = () => {
    const newLocale = locale === 'en' ? 'ar' : 'en';
    const pathWithoutLocale = pathname.replace(`/${locale}`, '') || '/';
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return (
    <button
      onClick={switchLocale}
      className={`flex items-center gap-2 px-3.5 py-2 transition-all duration-500 rounded-full hover:scale-105 active:scale-95 group ${
        isScrolled
          ? 'text-white/80 hover:text-white hover:bg-white/10'
          : 'text-[#4A4A4A] hover:text-[#D4AF37] hover:bg-[#D4AF37]/10'
      }`}
    >
      <Globe
        size={18}
        className={`transition-all duration-500 group-hover:rotate-180 ${
          isScrolled ? 'text-[#D4AF37]' : 'text-[#8B7355] group-hover:text-[#D4AF37]'
        }`}
      />
      <span className="text-sm font-semibold tracking-wide">
        {locale === 'en' ? 'العربية' : 'EN'}
      </span>
    </button>
  );
}
