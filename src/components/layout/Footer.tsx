'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { MapPin, Phone, Mail, Instagram, Crown, Facebook, Linkedin, Youtube, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

// TikTok icon component (not available in lucide-react)
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
    </svg>
  );
}

// WhatsApp icon component
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

// X (Twitter) icon component
function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );
}

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type SubscriptionStatus = 'idle' | 'loading' | 'success' | 'error' | 'already_subscribed';

export function Footer() {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  const tContact = useTranslations('contact');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<SubscriptionStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const currentYear = new Date().getFullYear();

  // Smooth scroll handler for anchor links
  const handleSmoothScroll = useCallback((e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // If element not found, navigate to home page with hash
      window.location.href = `/${locale}#${targetId}`;
    }
  }, [locale]);

  const validateEmail = (emailInput: string): boolean => {
    return emailRegex.test(emailInput.trim());
  };

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim();

    // Client-side validation
    if (!trimmedEmail) {
      setStatus('error');
      const errorMsg = isRtl ? 'البريد الإلكتروني مطلوب' : 'Email is required';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setStatus('error');
      const errorMsg = isRtl ? 'يرجى إدخال بريد إلكتروني صالح' : 'Please enter a valid email address';
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: trimmedEmail }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        const errorMsg = data.error || t('newsletter.errorMessage');
        setErrorMessage(errorMsg);
        toast.error(errorMsg);
        return;
      }

      if (data.isNewSubscriber === false) {
        setStatus('already_subscribed');
        setEmail('');
        toast.info(t('newsletter.alreadySubscribed'));
        // Auto-reset after 5 seconds
        setTimeout(() => setStatus('idle'), 5000);
      } else {
        setStatus('success');
        setEmail('');
        toast.success(t('newsletter.successMessage'));
        // Auto-reset after 5 seconds
        setTimeout(() => setStatus('idle'), 5000);
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setStatus('error');
      const errorMsg = t('newsletter.errorMessage');
      setErrorMessage(errorMsg);
      toast.error(errorMsg);
    }
  };

  // Social media links configuration with branded colors for hover
  const socialLinks = [
    {
      href: 'https://instagram.com/soomstudios',
      icon: Instagram,
      label: 'Instagram',
      ariaLabel: isRtl ? 'تابعنا على انستغرام' : 'Follow us on Instagram',
      hoverBg: 'hover:bg-gradient-to-tr hover:from-[#f09433] hover:via-[#dc2743] hover:to-[#bc1888]',
      focusBg: 'focus:bg-gradient-to-tr focus:from-[#f09433] focus:via-[#dc2743] focus:to-[#bc1888]'
    },
    {
      href: 'https://x.com/soomstudios',
      icon: XIcon,
      label: 'X',
      ariaLabel: isRtl ? 'تابعنا على X' : 'Follow us on X',
      hoverBg: 'hover:bg-black',
      focusBg: 'focus:bg-black'
    },
    {
      href: 'https://facebook.com/soomstudios',
      icon: Facebook,
      label: 'Facebook',
      ariaLabel: isRtl ? 'تابعنا على فيسبوك' : 'Follow us on Facebook',
      hoverBg: 'hover:bg-[#1877F2]',
      focusBg: 'focus:bg-[#1877F2]'
    },
    {
      href: 'https://linkedin.com/company/soomstudios',
      icon: Linkedin,
      label: 'LinkedIn',
      ariaLabel: isRtl ? 'تابعنا على لينكد إن' : 'Follow us on LinkedIn',
      hoverBg: 'hover:bg-[#0A66C2]',
      focusBg: 'focus:bg-[#0A66C2]'
    },
    {
      href: 'https://youtube.com/@soomstudios',
      icon: Youtube,
      label: 'YouTube',
      ariaLabel: isRtl ? 'اشترك في قناتنا على يوتيوب' : 'Subscribe to our YouTube channel',
      hoverBg: 'hover:bg-[#FF0000]',
      focusBg: 'focus:bg-[#FF0000]'
    },
    {
      href: 'https://tiktok.com/@soomstudios',
      icon: TikTokIcon,
      label: 'TikTok',
      ariaLabel: isRtl ? 'تابعنا على تيك توك' : 'Follow us on TikTok',
      hoverBg: 'hover:bg-black',
      focusBg: 'focus:bg-black'
    },
    {
      href: 'https://wa.me/966531182200',
      icon: WhatsAppIcon,
      label: 'WhatsApp',
      ariaLabel: isRtl ? 'تواصل معنا عبر واتساب' : 'Contact us on WhatsApp',
      hoverBg: 'hover:bg-[#25D366]',
      focusBg: 'focus:bg-[#25D366]'
    },
  ];

  // Quick navigation links
  const quickLinks = [
    { href: `/${locale}#rooms`, label: tCommon('rooms'), targetId: 'rooms' },
    { href: `/${locale}#amenities`, label: tCommon('amenities'), targetId: 'amenities' },
    { href: `/${locale}#calendar`, label: tCommon('calendar'), targetId: 'calendar' },
    { href: `/${locale}#faq`, label: isRtl ? 'الأسئلة الشائعة' : 'FAQ', targetId: 'faq' },
    { href: `/${locale}#location`, label: tCommon('location'), targetId: 'location' },
  ];

  // Services/About links
  const serviceLinks = [
    { href: `/${locale}#features`, label: t('about'), targetId: 'features', isAnchor: true },
    { href: `/${locale}#testimonials`, label: t('testimonials'), targetId: 'testimonials', isAnchor: true },
    { href: `/${locale}#contact`, label: tCommon('contact'), targetId: 'contact', isAnchor: true },
    { href: `/${locale}/terms`, label: t('terms'), isAnchor: false },
    { href: `/${locale}/privacy`, label: t('privacy'), isAnchor: false },
  ];

  return (
    <footer className="bg-[#1a1a1a] text-white border-t border-[#D4AF37]/10">
      <div className="container-luxury py-20">
        {/* Main Footer Content */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 ${isRtl ? 'text-right' : 'text-left'}`}>
          {/* Brand & About */}
          <div className="lg:col-span-1">
            <Link href={`/${locale}`} className={`flex items-center gap-3 mb-6 group ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="w-12 h-12 border border-[#D4AF37]/50 flex items-center justify-center rounded group-hover:border-[#D4AF37] group-hover:bg-[#D4AF37]/10 transition-all duration-300">
                <Crown className="w-6 h-6 text-[#D4AF37] group-hover:scale-110 transition-transform duration-300" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-light tracking-[0.15em] text-white uppercase group-hover:text-[#D4AF37] transition-colors duration-300">
                  {isRtl ? 'سوم' : 'Soom'}
                </span>
                <span className="text-xs text-[#D4AF37] tracking-[0.3em] uppercase -mt-1">
                  {isRtl ? 'ستوديوهات' : 'Studios'}
                </span>
              </div>
            </Link>
            <p className="text-white/60 mb-8 font-light leading-relaxed text-sm">
              {t('tagline')}
            </p>

            {/* Social Media Icons */}
            <nav className="mb-4" aria-label={isRtl ? 'روابط التواصل الاجتماعي' : 'Social media links'}>
              <h4 className="text-xs font-semibold mb-4 text-[#D4AF37] tracking-[0.2em] uppercase">
                {t('followUs')}
              </h4>
              <ul className={`flex flex-wrap gap-3 ${isRtl ? 'justify-end' : 'justify-start'}`} role="list">
                {socialLinks.map((social) => {
                  const IconComponent = social.icon;
                  return (
                    <li key={social.label}>
                      <a
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`w-10 h-10 border border-[#D4AF37]/30 flex items-center justify-center rounded
                          hover:border-transparent hover:scale-110 focus:border-transparent focus:scale-110
                          transition-all duration-300 group outline-none focus:ring-2 focus:ring-[#D4AF37]/50 focus:ring-offset-2 focus:ring-offset-[#2D2D2D]
                          ${social.hoverBg} ${social.focusBg}`}
                        aria-label={social.ariaLabel}
                        title={social.label}
                      >
                        <IconComponent className="w-4 h-4 text-[#D4AF37] group-hover:text-white group-focus:text-white transition-colors duration-300" />
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>

          {/* Quick Links */}
          <nav aria-label={isRtl ? 'روابط سريعة' : 'Quick links'}>
            <h4 className="text-xs font-semibold mb-6 text-[#D4AF37] tracking-[0.2em] uppercase">
              {t('quickLinks')}
            </h4>
            <ul className="space-y-3" role="list">
              {quickLinks.map((link) => (
                <li key={link.targetId}>
                  <a
                    href={link.href}
                    onClick={(e) => handleSmoothScroll(e, link.targetId)}
                    className={`text-white/60 hover:text-[#D4AF37] focus:text-[#D4AF37] transition-all duration-300 text-sm tracking-wide font-light
                      inline-flex items-center gap-2 group cursor-pointer outline-none focus:underline focus:underline-offset-4 ${isRtl ? 'flex-row-reverse' : ''}`}
                  >
                    <span className={`w-0 h-px bg-[#D4AF37] group-hover:w-4 group-focus:w-4 transition-all duration-300 ${isRtl ? 'order-last' : ''}`}></span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Services & Legal Links */}
          <div>
            <nav aria-label={isRtl ? 'الخدمات والروابط القانونية' : 'Services and legal links'}>
              <h4 className="text-xs font-semibold mb-6 text-[#D4AF37] tracking-[0.2em] uppercase">
                {t('services')}
              </h4>
              <ul className="space-y-3" role="list">
                {serviceLinks.map((link, index) => (
                  <li key={index}>
                    {link.isAnchor ? (
                      <a
                        href={link.href}
                        onClick={(e) => handleSmoothScroll(e, link.targetId!)}
                        className={`text-white/60 hover:text-[#D4AF37] focus:text-[#D4AF37] transition-all duration-300 text-sm tracking-wide font-light
                          inline-flex items-center gap-2 group cursor-pointer outline-none focus:underline focus:underline-offset-4 ${isRtl ? 'flex-row-reverse' : ''}`}
                      >
                        <span className={`w-0 h-px bg-[#D4AF37] group-hover:w-4 group-focus:w-4 transition-all duration-300 ${isRtl ? 'order-last' : ''}`}></span>
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className={`text-white/60 hover:text-[#D4AF37] focus:text-[#D4AF37] transition-all duration-300 text-sm tracking-wide font-light
                          inline-flex items-center gap-2 group outline-none focus:underline focus:underline-offset-4 ${isRtl ? 'flex-row-reverse' : ''}`}
                      >
                        <span className={`w-0 h-px bg-[#D4AF37] group-hover:w-4 group-focus:w-4 transition-all duration-300 ${isRtl ? 'order-last' : ''}`}></span>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </nav>

            {/* Contact Information */}
            <address className="mt-8 not-italic">
              <h4 className="text-xs font-semibold mb-4 text-[#D4AF37] tracking-[0.2em] uppercase">
                {tCommon('contact')}
              </h4>
              <ul className="space-y-3" role="list">
                <li className={`flex items-start gap-3 text-white/60 text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <MapPin className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <span className="font-light">{tContact('address')}</span>
                </li>
                <li className={`flex items-start gap-3 text-white/60 text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Phone className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <a
                    href="tel:+966531182200"
                    className="font-light hover:text-[#D4AF37] focus:text-[#D4AF37] transition-colors duration-300 outline-none focus:underline focus:underline-offset-4"
                    dir="ltr"
                    aria-label={isRtl ? 'اتصل بنا على الرقم +966531182200' : 'Call us at +966531182200'}
                  >
                    +966531182200
                  </a>
                </li>
                <li className={`flex items-start gap-3 text-white/60 text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <Mail className="w-4 h-4 text-[#D4AF37] flex-shrink-0 mt-0.5" aria-hidden="true" />
                  <a
                    href="mailto:Firas@fitechco.com"
                    className="font-light hover:text-[#D4AF37] focus:text-[#D4AF37] transition-colors duration-300 outline-none focus:underline focus:underline-offset-4"
                    aria-label={isRtl ? 'راسلنا عبر البريد الإلكتروني Firas@fitechco.com' : 'Email us at Firas@fitechco.com'}
                  >
                    Firas@fitechco.com
                  </a>
                </li>
              </ul>
            </address>
          </div>

          {/* Newsletter Signup */}
          <div>
            <h4 id="newsletter-heading" className="text-xs font-semibold mb-6 text-[#D4AF37] tracking-[0.2em] uppercase">
              {t('newsletter.title')}
            </h4>
            <p className="text-white/60 text-sm font-light mb-4">
              {t('newsletter.description')}
            </p>
            <form
              onSubmit={handleNewsletterSubmit}
              className={`flex ${isRtl ? 'flex-row-reverse' : ''}`}
              aria-labelledby="newsletter-heading"
              role="form"
            >
              <input
                type="email"
                id="newsletter-email"
                name="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  // Clear error state when user starts typing
                  if (status === 'error') {
                    setStatus('idle');
                    setErrorMessage('');
                  }
                }}
                placeholder={t('newsletter.placeholder')}
                className={`flex-1 newsletter-input text-charcoal placeholder-gray-400 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] ${
                  isRtl ? 'newsletter-input-rtl' : ''
                } ${status === 'error' ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
                disabled={status === 'loading'}
                aria-label={t('newsletter.placeholder')}
                aria-invalid={status === 'error'}
                aria-describedby={status === 'error' ? 'newsletter-error' : undefined}
                autoComplete="email"
              />
              <button
                type="submit"
                disabled={status === 'loading'}
                className={`newsletter-btn text-sm font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center min-w-[100px]
                  hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-[#2D2D2D] ${isRtl ? 'newsletter-btn-rtl' : ''}`}
                aria-busy={status === 'loading'}
              >
                {status === 'loading' ? (
                  <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  t('newsletter.button')
                )}
              </button>
            </form>

            {/* Success Message */}
            {status === 'success' && (
              <div
                className={`flex items-center gap-2 mt-3 animate-fade-in ${isRtl ? 'flex-row-reverse' : ''}`}
                role="status"
                aria-live="polite"
              >
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" aria-hidden="true" />
                <p className="text-green-400 text-xs font-light">
                  {t('newsletter.successMessage')}
                </p>
              </div>
            )}

            {/* Already Subscribed Message */}
            {status === 'already_subscribed' && (
              <div
                className={`flex items-center gap-2 mt-3 animate-fade-in ${isRtl ? 'flex-row-reverse' : ''}`}
                role="status"
                aria-live="polite"
              >
                <CheckCircle2 className="w-4 h-4 text-[#D4AF37] flex-shrink-0" aria-hidden="true" />
                <p className="text-[#D4AF37] text-xs font-light">
                  {t('newsletter.alreadySubscribed')}
                </p>
              </div>
            )}

            {/* Error Message */}
            {status === 'error' && errorMessage && (
              <div
                id="newsletter-error"
                className={`flex items-center gap-2 mt-3 animate-fade-in ${isRtl ? 'flex-row-reverse' : ''}`}
                role="alert"
                aria-live="polite"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" aria-hidden="true" />
                <p className="text-red-400 text-xs font-light">
                  {errorMessage}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#D4AF37]/10 py-8"></div>

        {/* Bottom Bar */}
        <div className={`flex flex-col md:flex-row justify-between items-center gap-6 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
          <p className="text-white/40 text-xs tracking-wider font-light">
            &copy; {currentYear} {isRtl ? 'سوم ستوديوهات' : 'Soom Studios'}. {t('rights')}.
          </p>
          <nav aria-label={isRtl ? 'روابط تذييل الصفحة' : 'Footer navigation'}>
            <ul className={`flex gap-8 text-xs ${isRtl ? 'flex-row-reverse' : ''}`} role="list">
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className="text-white/40 hover:text-[#D4AF37] focus:text-[#D4AF37] transition-colors duration-300 tracking-wide font-light hover:underline focus:underline underline-offset-4 outline-none"
                >
                  {t('terms')}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="text-white/40 hover:text-[#D4AF37] focus:text-[#D4AF37] transition-colors duration-300 tracking-wide font-light hover:underline focus:underline underline-offset-4 outline-none"
                >
                  {t('privacy')}
                </Link>
              </li>
              <li>
                <button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="text-white/40 hover:text-[#D4AF37] focus:text-[#D4AF37] transition-colors duration-300 tracking-wide font-light hover:underline focus:underline underline-offset-4 cursor-pointer outline-none"
                  aria-label={isRtl ? 'العودة إلى أعلى الصفحة' : 'Scroll back to top of page'}
                >
                  {isRtl ? 'العودة للأعلى' : 'Back to Top'}
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
