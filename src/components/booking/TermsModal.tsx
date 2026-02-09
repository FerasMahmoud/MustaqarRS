'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { X, ChevronDown, FileText, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import SignatureCanvas from 'react-signature-canvas';

interface TermsModalProps {
  isOpen: boolean;
  onAccept: (signature: string) => void;
  onClose: () => void;
  locale: 'en' | 'ar';
}

// Inner component that resets state each time the modal opens
function TermsModalContent({
  onAccept,
  onClose,
  locale,
}: Omit<TermsModalProps, 'isOpen'>) {
  const t = useTranslations('terms');
  const isRtl = locale === 'ar';

  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [hasSignature, setHasSignature] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const acceptButtonRef = useRef<HTMLButtonElement>(null);
  const signatureRef = useRef<SignatureCanvas>(null);

  // Focus the close button when modal mounts
  useEffect(() => {
    const timer = setTimeout(() => closeButtonRef.current?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle scroll detection
  const handleScroll = useCallback(() => {
    const container = contentRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const scrollableHeight = scrollHeight - clientHeight;

    if (scrollableHeight > 0) {
      const progress = Math.min((scrollTop / scrollableHeight) * 100, 100);
      setScrollProgress(progress);

      // Check if scrolled to bottom (within 100px threshold)
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 100;
      if (isAtBottom && !hasScrolledToBottom) {
        setHasScrolledToBottom(true);
      }
    } else {
      // Content doesn't require scrolling
      setHasScrolledToBottom(true);
      setScrollProgress(100);
    }
  }, [hasScrolledToBottom]);

  // Check scroll on mount
  useEffect(() => {
    // Small delay to ensure content is rendered
    const timer = setTimeout(handleScroll, 100);
    return () => clearTimeout(timer);
  }, [handleScroll]);

  // Define handlers before effects that use them
  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  }, [onClose]);

  const handleAccept = useCallback(() => {
    if (hasScrolledToBottom && signatureRef.current && !signatureRef.current.isEmpty()) {
      const signatureData = signatureRef.current.toDataURL('image/png');
      onAccept(signatureData);
      handleClose();
    }
  }, [hasScrolledToBottom, onAccept, handleClose]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }, [handleClose]);

  // Canvas signature handlers
  const clearSignature = useCallback(() => {
    if (signatureRef.current) {
      signatureRef.current.clear();
      setHasSignature(false);
    }
  }, []);

  const handleSignatureEnd = useCallback(() => {
    if (signatureRef.current && !signatureRef.current.isEmpty()) {
      setHasSignature(true);
    }
  }, []);

  // Handle escape key and body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleClose]);

  // Focus trap
  useEffect(() => {
    if (!modalRef.current) return;

    const modal = modalRef.current;
    const focusableElements = modal.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    modal.addEventListener('keydown', handleTabKey);
    return () => modal.removeEventListener('keydown', handleTabKey);
  }, []);

  // Memoize the sections for performance
  const termsSections = useMemo(() => [
    { key: 'acceptance', type: 'text' },
    { key: 'booking', type: 'list', listKey: 'requirements' },
    { key: 'cancellation', type: 'list', listKey: 'policies' },
    { key: 'checkInOut', type: 'list', listKey: 'details' },
    { key: 'guestResponsibilities', type: 'list', listKey: 'rules' },
    { key: 'included', type: 'list', listKey: 'items' },
    { key: 'liability', type: 'list', listKey: 'points' },
    { key: 'privacy', type: 'text' },
    { key: 'rightToRefuse', type: 'text' },
    { key: 'modifications', type: 'text' },
    { key: 'governingLaw', type: 'text' },
    { key: 'contact', type: 'contact' },
  ], []);

  const canAccept = hasScrolledToBottom && hasSignature;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="terms-modal-title"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isClosing ? 'opacity-0' : 'opacity-100'
        }`}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        ref={modalRef}
        className={`relative w-[90%] md:w-[80%] lg:w-[70%] xl:w-[60%] max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] transform transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
        dir={isRtl ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-[#E8E3DB] bg-gradient-to-r from-[#FAF8F5] to-white rounded-t-2xl">
          <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="w-10 h-10 rounded-xl bg-[#C9A96E]/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-[#C9A96E]" />
              </div>
              <div>
                <h2
                  id="terms-modal-title"
                  className="text-lg font-semibold text-[#2D2D2D]"
                >
                  {t('title')}
                </h2>
                <p className="text-xs text-[#8B7355]">
                  {t('lastUpdated')}: January 2026
                </p>
              </div>
            </div>
            <button
              ref={closeButtonRef}
              onClick={handleClose}
              className="w-10 h-10 rounded-full bg-[#F5F3F0] hover:bg-[#E8E3DB] flex items-center justify-center transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:ring-offset-2"
              aria-label={isRtl ? 'إغلاق' : 'Close'}
            >
              <X className="w-5 h-5 text-[#2D2D2D]" />
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 relative">
            <div className="h-1.5 bg-[#E8E3DB] rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#C9A96E] to-[#D4B884] rounded-full transition-all duration-300 ease-out"
                style={{ width: `${scrollProgress}%` }}
              />
            </div>
            <div className={`mt-2 flex items-center gap-2 text-xs ${isRtl ? 'flex-row-reverse' : ''}`}>
              {hasScrolledToBottom ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-emerald-600 font-medium">
                    {isRtl ? 'تم قراءة جميع الشروط' : 'All terms read'}
                  </span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 text-[#8B7355] animate-bounce" />
                  <span className="text-[#8B7355]">
                    {isRtl ? 'قم بالتمرير للأسفل لقراءة جميع الشروط' : 'Scroll down to read all terms'}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-6 py-6 scroll-smooth"
          style={{ maxHeight: '50vh' }}
          tabIndex={0}
          aria-label={isRtl ? 'محتوى الشروط والأحكام' : 'Terms and conditions content'}
        >
          {/* Important Notice */}
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-sm text-amber-800 leading-relaxed">
              {t('importantNotice')}
            </p>
          </div>

          {/* Terms Sections */}
          <div className="space-y-8">
            {termsSections.map((section) => (
              <section key={section.key} className="scroll-mt-4">
                <h3 className="text-base font-semibold text-[#2D2D2D] mb-3 pb-2 border-b border-[#E8E3DB]">
                  {t(`sections.${section.key}.title`)}
                </h3>
                <p className="text-sm text-[#4A4A4A] leading-relaxed mb-3">
                  {t(`sections.${section.key}.content`)}
                </p>

                {section.type === 'list' && section.listKey && (
                  <ul className={`space-y-2 ${isRtl ? 'pr-4' : 'pl-4'}`}>
                    {(() => {
                      const items = t.raw(`sections.${section.key}.${section.listKey}`) as string[];
                      return items.map((item: string, index: number) => (
                        <li
                          key={index}
                          className={`text-sm text-[#4A4A4A] leading-relaxed flex gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}
                        >
                          <span className="text-[#C9A96E] flex-shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ));
                    })()}
                  </ul>
                )}

                {section.type === 'contact' && (
                  <div className={`mt-3 space-y-2 ${isRtl ? 'text-right' : 'text-left'}`}>
                    <p className="text-sm text-[#4A4A4A]">
                      <span className="font-medium">{isRtl ? 'البريد الإلكتروني:' : 'Email:'}</span>{' '}
                      <a
                        href={`mailto:${t('sections.contact.email')}`}
                        className="text-[#C9A96E] hover:underline"
                      >
                        {t('sections.contact.email')}
                      </a>
                    </p>
                    <p className="text-sm text-[#4A4A4A]">
                      <span className="font-medium">{isRtl ? 'الهاتف:' : 'Phone:'}</span>{' '}
                      <a
                        href={`tel:${t('sections.contact.phone')}`}
                        className="text-[#C9A96E] hover:underline"
                        dir="ltr"
                      >
                        {t('sections.contact.phone')}
                      </a>
                    </p>
                  </div>
                )}
              </section>
            ))}
          </div>

          {/* End of content marker */}
          <div className="mt-8 pt-6 border-t border-[#E8E3DB] text-center">
            <p className="text-sm text-[#8B7355]">
              {isRtl ? '— نهاية الشروط والأحكام —' : '— End of Terms & Conditions —'}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-[#E8E3DB] bg-gradient-to-r from-white to-[#FAF8F5] rounded-b-2xl">
          {/* Signature Canvas */}
          <div className="mb-4">
            <label
              htmlFor="signature-canvas"
              className={`block text-sm font-medium text-[#2D2D2D] mb-2 ${isRtl ? 'text-right' : 'text-left'}`}
            >
              {isRtl ? 'ارسم توقيعك الرقمي' : 'Draw your digital signature'}
            </label>

            <div className="relative">
              {/* Canvas Container */}
              <div
                className={`rounded-xl border-2 overflow-hidden bg-white transition-all duration-200 ${
                  hasScrolledToBottom
                    ? hasSignature
                      ? 'border-[#C9A96E]'
                      : 'border-[#E8E3DB] hover:border-[#C9A96E]/50'
                    : 'border-[#E8E3DB] opacity-50 cursor-not-allowed'
                }`}
              >
                <SignatureCanvas
                  ref={signatureRef}
                  canvasProps={{
                    id: 'signature-canvas',
                    className: 'w-full h-40 touch-none',
                    style: { touchAction: 'none' }
                  }}
                  onEnd={handleSignatureEnd}
                  penColor="#2D2D2D"
                  backgroundColor="#FFFFFF"
                />
              </div>

              {/* Placeholder Text */}
              {!hasSignature && hasScrolledToBottom && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[#8B7355]/50 text-sm font-light">
                    {isRtl ? 'ارسم هنا...' : 'Draw here...'}
                  </span>
                </div>
              )}
            </div>

            {/* Clear Button */}
            {hasSignature && (
              <button
                type="button"
                onClick={clearSignature}
                className={`mt-2 text-sm text-[#C9A96E] hover:text-[#B89A5F] transition-colors duration-200 ${isRtl ? 'float-left' : 'float-right'}`}
              >
                {isRtl ? 'مسح التوقيع' : 'Clear Signature'}
              </button>
            )}

            {/* Helper Text */}
            <p
              id="signature-help"
              className={`mt-1 text-xs text-[#8B7355] clear-both ${isRtl ? 'text-right' : 'text-left'}`}
            >
              {hasScrolledToBottom
                ? (isRtl ? 'ارسم توقيعك باستخدام الماوس أو إصبعك' : 'Draw your signature using mouse or finger')
                : (isRtl ? 'يجب قراءة جميع الشروط قبل التوقيع' : 'You must read all terms before signing')
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className={`flex gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 rounded-xl border-2 border-[#E8E3DB] text-[#2D2D2D] font-medium text-sm hover:bg-[#F5F3F0] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:ring-offset-2"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              ref={acceptButtonRef}
              onClick={handleAccept}
              disabled={!canAccept}
              className={`flex-1 px-6 py-3 rounded-xl font-medium text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                canAccept
                  ? 'bg-gradient-to-r from-[#C9A96E] to-[#D4B884] text-white hover:from-[#B89A5F] hover:to-[#C9A96E] focus:ring-[#C9A96E] shadow-lg shadow-[#C9A96E]/25'
                  : 'bg-[#E8E3DB] text-[#999] cursor-not-allowed'
              }`}
              aria-disabled={!canAccept}
            >
              <span className={`flex items-center justify-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {canAccept && <CheckCircle2 className="w-4 h-4" />}
                {isRtl ? 'قبول والتوقيع' : 'Accept & Sign'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Wrapper component that conditionally renders the content
// This ensures state is reset each time the modal opens
export function TermsModal({ isOpen, onAccept, onClose, locale }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <TermsModalContent
      onAccept={onAccept}
      onClose={onClose}
      locale={locale}
    />
  );
}

export default TermsModal;
