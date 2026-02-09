'use client';

import { Label } from '@/components/ui/label';
import { Shield, CheckCircle, AlertCircle } from 'lucide-react';
import type { ValidationError } from '@/lib/validation';

interface TermsAndSignatureProps {
  termsAccepted: boolean;
  signature: string;
  fieldErrors: Record<string, ValidationError>;
  isRtl: boolean;
  onOpenTermsModal: () => void;
}

function FieldError({ error, isRtl }: { error?: ValidationError; isRtl: boolean }) {
  if (!error) return null;
  return (
    <p className="text-red-500 text-booking-body-sm mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {isRtl ? error.messageAr : error.message}
    </p>
  );
}

export function TermsAndSignature({
  termsAccepted,
  signature,
  fieldErrors,
  isRtl,
  onOpenTermsModal,
}: TermsAndSignatureProps) {
  const isCompleted = termsAccepted && signature;
  const hasError = fieldErrors.termsAccepted || fieldErrors.signature;

  return (
    <div className="space-y-3">
      <Label className="text-xs text-gold font-semibold uppercase tracking-widest">
        {isRtl ? 'الشروط والأحكام' : 'Terms & Conditions'} *
      </Label>

      {/* Status and Action */}
      <div
        className={`p-4 rounded-xl border-2 transition-all ${
          isCompleted
            ? 'border-green-500 bg-green-50'
            : hasError
            ? 'border-red-500 bg-red-50'
            : 'border-border bg-cream/50'
        }`}
      >
        {isCompleted ? (
          // Accepted state with signature preview
          <div className="space-y-3">
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-green-700 font-medium text-sm">
                  {isRtl ? 'تم قبول الشروط والتوقيع' : 'Terms Accepted & Signed'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenTermsModal}
              className="w-full py-2 px-4 rounded-lg border border-green-500 text-green-700 text-sm font-medium hover:bg-green-100 transition-all"
            >
              {isRtl ? 'تعديل التوقيع' : 'Edit Signature'}
            </button>
          </div>
        ) : (
          // Pending state
          <div className="space-y-3">
            <div className={`flex items-center gap-2 ${isRtl ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                hasError
                  ? 'bg-red-100'
                  : 'bg-gold/10'
              }`}>
                <Shield className={`w-5 h-5 ${
                  hasError
                    ? 'text-red-500'
                    : 'text-gold'
                }`} />
              </div>
              <div className="flex-1">
                <p className={`font-medium text-sm ${
                  hasError
                    ? 'text-red-600'
                    : 'text-charcoal'
                }`}>
                  {isRtl ? 'مطلوب قبول الشروط والتوقيع' : 'Terms acceptance & signature required'}
                </p>
                <p className="text-muted-foreground text-xs">
                  {isRtl ? 'اقرأ الشروط وقدم توقيعك' : 'Read terms and provide your signature'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onOpenTermsModal}
              className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
                hasError
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-gold hover:bg-gold/90 text-white hover:shadow-lg hover:shadow-gold/30'
              } ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <Shield className="w-4 h-4" />
              {isRtl ? 'عرض وقبول الشروط' : 'View & Accept Terms'}
            </button>
          </div>
        )}
      </div>

      {/* Error messages */}
      <FieldError error={fieldErrors.termsAccepted} isRtl={isRtl} />
      <FieldError error={fieldErrors.signature} isRtl={isRtl} />
    </div>
  );
}
