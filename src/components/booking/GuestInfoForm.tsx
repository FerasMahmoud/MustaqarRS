'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import type { ValidationError } from '@/lib/validation';

interface GuestInfoFormProps {
  formData: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
  };
  fieldErrors: Record<string, ValidationError>;
  isRtl: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  onBack: () => void;
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

export function GuestInfoForm({
  formData,
  fieldErrors,
  isRtl,
  onInputChange,
  onNext,
  onBack,
}: GuestInfoFormProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 space-y-6">
      <div>
        <h2 className="text-booking-section heading-serif text-charcoal mb-2">
          {isRtl ? 'معلومات الاتصال' : 'Contact Information'}
        </h2>
        <p className="text-booking-body-sm text-muted-foreground">
          {isRtl ? 'أدخل بياناتك للتواصل' : 'Enter your contact details'}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customerName" className="text-booking-label-lg text-gold font-semibold uppercase tracking-widest">
            {isRtl ? 'الاسم الكامل' : 'Full Name'} *
          </Label>
          <Input
            id="customerName"
            name="customerName"
            value={formData.customerName}
            onChange={onInputChange}
            placeholder={isRtl ? 'الاسم الأول والأخير' : 'First and Last Name'}
            className={`input-luxury h-12 ${
              fieldErrors.customerName ? 'border-red-500' : ''
            }`}
          />
          <FieldError error={fieldErrors.customerName} isRtl={isRtl} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerEmail" className="text-xs text-gold font-semibold uppercase tracking-widest">
            {isRtl ? 'البريد الإلكتروني' : 'Email'} *
          </Label>
          <Input
            id="customerEmail"
            name="customerEmail"
            type="email"
            value={formData.customerEmail}
            onChange={onInputChange}
            placeholder={isRtl ? 'أدخل بريدك الإلكتروني' : 'Enter your email'}
            className={`input-luxury h-12 ${
              fieldErrors.customerEmail ? 'border-red-500' : ''
            }`}
          />
          <FieldError error={fieldErrors.customerEmail} isRtl={isRtl} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customerPhone" className="text-xs text-gold font-semibold uppercase tracking-widest">
            {isRtl ? 'رقم الهاتف' : 'Phone Number'} *
          </Label>
          <Input
            id="customerPhone"
            name="customerPhone"
            type="tel"
            value={formData.customerPhone}
            onChange={onInputChange}
            placeholder={isRtl ? '+966531182200 أو 0531182200' : '+966531182200 or 0531182200'}
            dir="ltr"
            className={`input-luxury h-12 ${
              fieldErrors.customerPhone ? 'border-red-500' : ''
            }`}
          />
          <FieldError error={fieldErrors.customerPhone} isRtl={isRtl} />
        </div>
      </div>

      <div className="flex gap-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 rounded-xl h-12 border-border text-charcoal hover:bg-cream font-medium"
        >
          {isRtl ? 'السابق' : 'Back'}
        </Button>
        <Button
          onClick={onNext}
          className="flex-1 btn-primary rounded-xl h-12 font-medium"
        >
          {isRtl ? 'التالي' : 'Continue'}
        </Button>
      </div>
    </div>
  );
}
