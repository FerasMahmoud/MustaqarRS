'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { AlertCircle } from 'lucide-react';
import { NATIONALITIES, type ValidationError } from '@/lib/validation';

interface IdentificationFormProps {
  formData: {
    idType: 'passport' | 'saudi_id' | 'iqama';
    idNumber: string;
    nationality: string;
    notes: string;
  };
  fieldErrors: Record<string, ValidationError>;
  isRtl: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onIdTypeChange: (value: 'passport' | 'saudi_id' | 'iqama') => void;
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

export function IdentificationForm({
  formData,
  fieldErrors,
  isRtl,
  onInputChange,
  onIdTypeChange,
}: IdentificationFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="text-xs text-gold font-semibold uppercase tracking-widest">
          {isRtl ? 'نوع الهوية' : 'ID Type'} *
        </Label>
        <RadioGroup
          value={formData.idType}
          onValueChange={(value) => onIdTypeChange(value as 'passport' | 'saudi_id' | 'iqama')}
          className="grid grid-cols-3 gap-2"
        >
          {[
            { value: 'passport', label: isRtl ? 'جواز سفر' : 'Passport' },
            { value: 'saudi_id', label: isRtl ? 'هوية سعودية' : 'Saudi ID' },
            { value: 'iqama', label: isRtl ? 'إقامة' : 'Iqama' },
          ].map((option) => (
            <Label
              key={option.value}
              htmlFor={option.value}
              className={`flex items-center justify-center p-3 cursor-pointer text-sm rounded-lg border-2 transition-all ${
                formData.idType === option.value
                  ? 'border-gold bg-gold/5 text-gold'
                  : 'border-border text-muted-foreground hover:border-gold/50'
              }`}
            >
              <RadioGroupItem value={option.value} id={option.value} className="sr-only" />
              {option.label}
            </Label>
          ))}
        </RadioGroup>
        <FieldError error={fieldErrors.idType} isRtl={isRtl} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="idNumber" className="text-xs text-gold font-semibold uppercase tracking-widest">
          {isRtl ? 'رقم الهوية' : 'ID Number'} *
        </Label>
        <Input
          id="idNumber"
          name="idNumber"
          value={formData.idNumber}
          onChange={onInputChange}
          placeholder={isRtl ? 'أدخل رقم الهوية' : 'Enter ID number'}
          className={`input-luxury h-12 ${
            fieldErrors.idNumber ? 'border-red-500' : ''
          }`}
        />
        <FieldError error={fieldErrors.idNumber} isRtl={isRtl} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="nationality" className="text-xs text-gold font-semibold uppercase tracking-widest">
          {isRtl ? 'الجنسية' : 'Nationality'} *
        </Label>
        <select
          id="nationality"
          name="nationality"
          value={formData.nationality}
          onChange={onInputChange}
          className={`w-full h-12 px-3 rounded-lg border-2 transition-all bg-white text-charcoal focus:outline-none focus:ring-2 focus:ring-gold/50 ${
            fieldErrors.nationality ? 'border-red-500' : 'border-border'
          }`}
        >
          {NATIONALITIES.map((nationality) => (
            <option key={nationality.code} value={nationality.code}>
              {isRtl ? nationality.ar : nationality.en}
            </option>
          ))}
        </select>
        <FieldError error={fieldErrors.nationality} isRtl={isRtl} />
      </div>

      {/* Notes (optional) */}
      <div className="space-y-2">
        <Label htmlFor="notes" className="text-xs text-gold font-semibold uppercase tracking-widest">
          {isRtl ? 'ملاحظات إضافية' : 'Additional Notes'} ({isRtl ? 'اختياري' : 'Optional'})
        </Label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={onInputChange}
          placeholder={isRtl ? 'أي طلبات خاصة أو ملاحظات' : 'Any special requests or notes'}
          rows={3}
          className="w-full input-luxury p-3 resize-none"
        />
      </div>
    </div>
  );
}
