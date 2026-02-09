'use client';

import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { forwardRef, useId } from 'react';

interface TermsCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  onBlur?: () => void;
  locale: 'en' | 'ar';
  error?: string;
  disabled?: boolean;
  name?: string;
}

const translations = {
  en: {
    agreeToTerms: 'I agree to the',
    termsAndConditions: 'Terms and Conditions',
    required: 'You must accept the terms and conditions to proceed',
  },
  ar: {
    agreeToTerms: 'أوافق على',
    termsAndConditions: 'الشروط والأحكام',
    required: 'يجب الموافقة على الشروط والأحكام للمتابعة',
  },
};

export const TermsCheckbox = forwardRef<HTMLInputElement, TermsCheckboxProps>(
  function TermsCheckbox(
    { checked, onChange, onBlur, locale, error, disabled = false, name = 'termsAccepted' },
    ref
  ) {
    const isRtl = locale === 'ar';
    const t = translations[locale];
    const id = useId();
    const checkboxId = `${id}-terms-checkbox`;
    const errorId = `${id}-terms-error`;

    return (
      <div className="space-y-2">
        <div
          className={`
            p-4 rounded-lg border-2 transition-all duration-200
            ${error
              ? 'border-red-400 bg-red-50'
              : checked
                ? 'border-[#C9A96E] bg-[#C9A96E]/5'
                : 'border-[#E8E3DB] bg-white hover:border-[#C9A96E]/50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <label
            htmlFor={checkboxId}
            className={`
              flex items-center gap-3 cursor-pointer select-none
              ${isRtl ? 'flex-row-reverse' : ''}
              ${disabled ? 'cursor-not-allowed' : ''}
            `}
          >
            <div className="relative flex-shrink-0">
              <input
                ref={ref}
                type="checkbox"
                id={checkboxId}
                name={name}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                onBlur={onBlur}
                disabled={disabled}
                aria-invalid={!!error}
                aria-describedby={error ? errorId : undefined}
                className={`
                  w-5 h-5 rounded border-2 appearance-none cursor-pointer
                  transition-all duration-200
                  focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/30 focus:ring-offset-1
                  ${error
                    ? 'border-red-400 bg-red-50'
                    : checked
                      ? 'border-[#C9A96E] bg-[#C9A96E]'
                      : 'border-[#C9A96E] bg-white'
                  }
                  ${disabled ? 'cursor-not-allowed opacity-50' : ''}
                `}
              />
              {/* Custom checkmark */}
              {checked && (
                <svg
                  className="absolute top-0.5 left-0.5 w-4 h-4 text-white pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </div>

            <span
              className={`
                flex-1 text-booking-body text-[#2D2D2D]
                ${isRtl ? 'text-right' : 'text-left'}
              `}
            >
              {t.agreeToTerms}{' '}
              <Link
                href={`/${locale}/terms`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className={`
                  inline-flex items-center gap-1 text-[#C9A96E] hover:text-[#8B7355]
                  underline underline-offset-2 transition-colors font-medium
                  focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/30 focus:rounded
                  ${isRtl ? 'flex-row-reverse' : ''}
                `}
              >
                {t.termsAndConditions}
                <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
                <span className="sr-only">
                  {locale === 'ar' ? '(يفتح في نافذة جديدة)' : '(opens in new tab)'}
                </span>
              </Link>
            </span>
          </label>
        </div>

        {/* Error message */}
        {error && (
          <p
            id={errorId}
            role="alert"
            className={`
              text-booking-body-sm text-red-600 font-medium
              flex items-center gap-1.5
              ${isRtl ? 'flex-row-reverse text-right' : 'text-left'}
            `}
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}
      </div>
    );
  }
);

// Default export for convenience
export default TermsCheckbox;
