'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Database,
  BarChart3,
  Cookie,
  Users,
  Lock,
  Clock,
  UserCheck,
  Baby,
  ExternalLink,
  RefreshCw,
  Mail,
  Phone
} from 'lucide-react';

export default function PrivacyPage() {
  const t = useTranslations('privacy');
  const tCommon = useTranslations('common');
  const tFooter = useTranslations('footer');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  const ArrowIcon = isRtl ? ArrowRight : ArrowLeft;

  const currentDate = new Date().toLocaleDateString(locale === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const sections = [
    {
      key: 'introduction',
      icon: BookOpen,
      listKey: null
    },
    {
      key: 'dataCollection',
      icon: Database,
      listKey: 'items'
    },
    {
      key: 'dataUsage',
      icon: BarChart3,
      listKey: 'purposes'
    },
    {
      key: 'cookies',
      icon: Cookie,
      listKey: 'details'
    },
    {
      key: 'thirdParties',
      icon: Users,
      listKey: 'services'
    },
    {
      key: 'dataSecurity',
      icon: Lock,
      listKey: null
    },
    {
      key: 'dataRetention',
      icon: Clock,
      listKey: null
    },
    {
      key: 'userRights',
      icon: UserCheck,
      listKey: 'rights'
    },
    {
      key: 'children',
      icon: Baby,
      listKey: null
    },
    {
      key: 'externalLinks',
      icon: ExternalLink,
      listKey: null
    },
    {
      key: 'changes',
      icon: RefreshCw,
      listKey: null
    }
  ];

  return (
    <div className="min-h-screen bg-cream pt-24 pb-16">
      {/* Header */}
      <div className="bg-charcoal text-white py-16">
        <div className="container-luxury">
          <Link
            href={`/${locale}`}
            className={`inline-flex items-center gap-2 text-gold hover:text-gold-light transition-colors mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <ArrowIcon className="w-4 h-4" />
            <span>{isRtl ? 'العودة للرئيسية' : 'Back to Home'}</span>
          </Link>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-wide mb-4">
            {t('title')}
          </h1>
          <p className="text-white/60 text-sm">
            {t('lastUpdated')}: {currentDate}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="container-luxury py-12">
        <div className="max-w-4xl mx-auto">
          {/* Quick Navigation */}
          <nav className={`bg-white rounded-xl p-6 shadow-sm mb-10 ${isRtl ? 'text-right' : 'text-left'}`}>
            <h2 className="text-lg font-semibold text-charcoal mb-4">
              {isRtl ? 'جدول المحتويات' : 'Table of Contents'}
            </h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sections.map((section, index) => (
                <li key={section.key}>
                  <a
                    href={`#${section.key}`}
                    className={`flex items-center gap-2 text-charcoal-light hover:text-gold transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
                  >
                    <span className="text-gold font-medium">{index + 1}.</span>
                    <span className="text-sm">{t(`sections.${section.key}.title`)}</span>
                  </a>
                </li>
              ))}
              <li>
                <a
                  href="#contact"
                  className={`flex items-center gap-2 text-charcoal-light hover:text-gold transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                  <span className="text-gold font-medium">{sections.length + 1}.</span>
                  <span className="text-sm">{t('sections.contact.title')}</span>
                </a>
              </li>
            </ul>
          </nav>

          {/* Important Notice */}
          <div className={`bg-gold/10 border border-gold/30 rounded-xl p-6 mb-10 ${isRtl ? 'text-right' : 'text-left'}`}>
            <p className="text-charcoal leading-relaxed">
              {isRtl
                ? 'خصوصيتك مهمة لنا. يرجى قراءة هذه السياسة بعناية لفهم كيفية تعاملنا مع معلوماتك الشخصية.'
                : 'Your privacy is important to us. Please read this policy carefully to understand how we handle your personal information.'
              }
            </p>
          </div>

          {/* Sections */}
          <div className="space-y-10">
            {sections.map((section) => {
              const Icon = section.icon;
              const items = section.listKey ? t.raw(`sections.${section.key}.${section.listKey}`) as string[] : null;

              return (
                <section
                  key={section.key}
                  id={section.key}
                  className={`bg-white rounded-xl p-8 shadow-sm ${isRtl ? 'text-right' : 'text-left'}`}
                >
                  <div className={`flex items-center gap-4 mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                    <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center">
                      <Icon className="w-6 h-6 text-gold" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-semibold text-charcoal">
                      {t(`sections.${section.key}.title`)}
                    </h2>
                  </div>
                  <p className="text-charcoal-light leading-relaxed mb-4">
                    {t(`sections.${section.key}.content`)}
                  </p>
                  {items && items.length > 0 && (
                    <ul className={`space-y-2 mt-4 ${isRtl ? 'pr-4' : 'pl-4'}`}>
                      {items.map((item: string, index: number) => (
                        <li
                          key={index}
                          className={`flex items-start gap-3 text-charcoal-light ${isRtl ? 'flex-row-reverse' : ''}`}
                        >
                          <span className="w-1.5 h-1.5 bg-gold rounded-full mt-2.5 flex-shrink-0"></span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}

            {/* Contact Section */}
            <section
              id="contact"
              className={`bg-charcoal text-white rounded-xl p-8 ${isRtl ? 'text-right' : 'text-left'}`}
            >
              <div className={`flex items-center gap-4 mb-6 ${isRtl ? 'flex-row-reverse' : ''}`}>
                <div className="w-12 h-12 bg-gold/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-gold" />
                </div>
                <h2 className="text-xl md:text-2xl font-semibold">
                  {t('sections.contact.title')}
                </h2>
              </div>
              <p className="text-white/70 leading-relaxed mb-6">
                {t('sections.contact.content')}
              </p>
              <div className="flex flex-col sm:flex-row gap-6">
                <a
                  href={`mailto:${t('sections.contact.email')}`}
                  className={`flex items-center gap-3 text-gold hover:text-gold-light transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
                >
                  <Mail className="w-5 h-5" />
                  <span>{t('sections.contact.email')}</span>
                </a>
                <a
                  href={`tel:${t('sections.contact.phone').replace(/\s/g, '')}`}
                  className={`flex items-center gap-3 text-gold hover:text-gold-light transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
                  dir="ltr"
                >
                  <Phone className="w-5 h-5" />
                  <span>{t('sections.contact.phone')}</span>
                </a>
              </div>
            </section>
          </div>

          {/* Footer Navigation */}
          <div className={`mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4 ${isRtl ? 'sm:flex-row-reverse' : ''}`}>
            <Link
              href={`/${locale}`}
              className={`flex items-center gap-2 text-charcoal-light hover:text-gold transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <ArrowIcon className="w-4 h-4" />
              <span>{tCommon('home')}</span>
            </Link>
            <Link
              href={`/${locale}/terms`}
              className={`flex items-center gap-2 text-gold hover:text-gold-dark transition-colors ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <span>{tFooter('terms')}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
