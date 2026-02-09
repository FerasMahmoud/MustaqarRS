'use client';

import { useTranslations, useLocale } from 'next-intl';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqKeys = ['q1', 'q2', 'q3', 'q4', 'q5', 'q6'];

export function FAQ() {
  const t = useTranslations('faq');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  return (
    <section id="faq" className="py-24 bg-[#FFFBF5] dark:bg-[#111111]">
      <div className="w-full px-[3%]">
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-px bg-[#D4AF37]" />
            <span className="text-[#D4AF37] text-sm font-semibold tracking-[0.25em] uppercase">
              {isRtl ? 'أسئلة شائعة' : 'FAQ'}
            </span>
            <div className="w-16 h-px bg-[#D4AF37]" />
          </div>
          <h2 className="text-5xl md:text-6xl lg:text-7xl font-light mb-6 text-[#1a1a1a] dark:text-white tracking-wide">
            {isRtl ? 'الأسئلة' : 'Frequently Asked'}{' '}
            <span className="text-gold-gradient font-normal">{isRtl ? 'الشائعة' : 'Questions'}</span>
          </h2>
          <p className="text-xl md:text-2xl text-[#5A5A5A] dark:text-white/60 max-w-3xl mx-auto font-light leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className={`max-w-3xl mx-auto ${isRtl ? 'text-right' : 'text-left'}`}>
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqKeys.map((key, index) => (
              <AccordionItem
                key={key}
                value={`item-${index}`}
                className="bg-white dark:bg-[#141414] border border-[#e5dfd6] dark:border-[#D4AF37]/10 px-8 rounded-lg data-[state=open]:border-[#D4AF37]/30 data-[state=open]:shadow-lg data-[state=open]:shadow-gold/10 hover:border-[#D4AF37]/30 hover:shadow-md transition-all duration-300 group"
              >
                <AccordionTrigger className="text-xl font-medium text-[#1a1a1a] dark:text-white hover:no-underline hover:text-[#D4AF37] py-6 tracking-wide group-hover:text-[#D4AF37] transition-colors duration-300">
                  {t(`questions.${key}`)}
                </AccordionTrigger>
                <AccordionContent className="text-[#4A4A4A] dark:text-white/60 pb-6 text-base leading-relaxed">
                  {t(`questions.a${key.slice(1)}`)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
