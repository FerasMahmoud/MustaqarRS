'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { MapPin, Phone, Mail, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';

export function Footer() {
  const t = useTranslations('footer');
  const tCommon = useTranslations('common');
  const tContact = useTranslations('contact');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'alreadySubscribed'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const currentYear = new Date().getFullYear();

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setStatus('error');
      setErrorMessage('Email is required');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setErrorMessage(data.error || t('newsletter.errorMessage'));
        return;
      }

      if (data.isNewSubscriber === false) {
        setStatus('alreadySubscribed');
        setErrorMessage(t('newsletter.alreadySubscribed'));
      } else {
        setStatus('success');
        setEmail('');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setStatus('error');
      setErrorMessage(t('newsletter.errorMessage'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-slate-900 text-white">
      <div className="container mx-auto px-4 py-16">
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 ${isRtl ? 'text-right' : 'text-left'}`}>
          {/* Brand */}
          <div className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
              Riyadh Studios
            </h3>
            <p className="text-slate-400 mb-6 max-w-md">
              {t('tagline')}
            </p>
            <div className="flex gap-4">
              <a
                href="https://instagram.com/soomstudios"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="https://x.com/soomstudios"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 transition-colors"
                aria-label="Twitter/X"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="https://facebook.com/soomstudios"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="https://linkedin.com/company/soomstudios"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center hover:bg-orange-500 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 text-white">{tCommon('home')}</h4>
            <ul className="space-y-3">
              <li>
                <a href="/#rooms" className="text-slate-400 hover:text-orange-400 transition-colors">
                  {tCommon('rooms')}
                </a>
              </li>
              <li>
                <a href="/#amenities" className="text-slate-400 hover:text-orange-400 transition-colors">
                  {tCommon('amenities')}
                </a>
              </li>
              <li>
                <a href="/#calendar" className="text-slate-400 hover:text-orange-400 transition-colors">
                  {tCommon('calendar')}
                </a>
              </li>
              <li>
                <a href="/#faq" className="text-slate-400 hover:text-orange-400 transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 text-white">{tCommon('contact')}</h4>
            <ul className="space-y-3">
              <li className={`flex items-center gap-3 text-slate-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <MapPin className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <span>{tContact('address')}</span>
              </li>
              <li className={`flex items-center gap-3 text-slate-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Phone className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <span dir="ltr">+966 50 XXX XXXX</span>
              </li>
              <li className={`flex items-center gap-3 text-slate-400 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <Mail className="w-5 h-5 text-orange-400 flex-shrink-0" />
                <span>info@riyadhstudios.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Signup */}
        <div className="border-t border-slate-800 mt-12 pt-8 mb-8">
          <div className={`max-w-md mx-auto ${isRtl ? 'text-right' : 'text-left'}`}>
            <h4 className="font-semibold mb-2 text-white">{t('newsletter.title')}</h4>
            <p className="text-slate-400 text-sm mb-4">{t('newsletter.description')}</p>
            <form onSubmit={handleNewsletterSubmit} className={`flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('newsletter.placeholder')}
                disabled={loading}
                className={`flex-1 px-4 py-2 rounded text-black text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 ${isRtl ? 'text-right' : 'text-left'}`}
              />
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:bg-orange-400 text-white rounded font-medium text-sm transition-colors"
              >
                {loading ? '...' : t('newsletter.button')}
              </button>
            </form>
            {status === 'success' && (
              <p className="text-green-400 text-sm mt-2">{t('newsletter.successMessage')}</p>
            )}
            {(status === 'error' || status === 'alreadySubscribed') && (
              <p className="text-orange-300 text-sm mt-2">{errorMessage}</p>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800 pt-8">
          <div className={`flex flex-col md:flex-row justify-between items-center gap-4 ${isRtl ? 'md:flex-row-reverse' : ''}`}>
            <p className="text-slate-400 text-sm">
              © {currentYear} Riyadh Studios. {t('rights')}.
            </p>
            <div className={`flex gap-6 text-sm ${isRtl ? 'flex-row-reverse' : ''}`}>
              <Link href={`/${locale}/terms`} className="text-slate-400 hover:text-orange-400 transition-colors">
                {t('terms')}
              </Link>
              <Link href={`/${locale}/privacy`} className="text-slate-400 hover:text-orange-400 transition-colors">
                {t('privacy')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
