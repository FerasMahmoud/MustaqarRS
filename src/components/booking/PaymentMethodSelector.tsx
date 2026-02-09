'use client';

import { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Building2 } from 'lucide-react';

interface PaymentMethodSelectorProps {
  paymentMethod: 'stripe' | 'bank_transfer';
  onPaymentMethodChange: (method: 'stripe' | 'bank_transfer') => void;
  isRtl: boolean;
}

// Check if Stripe is configured (client-side check using public key)
const isStripeConfigured = (): boolean => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  return !!(key && key.startsWith('pk_') && !key.includes('YOUR_'));
};

export function PaymentMethodSelector({
  paymentMethod,
  onPaymentMethodChange,
  isRtl,
}: PaymentMethodSelectorProps) {
  const stripeAvailable = isStripeConfigured();

  // Auto-select bank transfer if Stripe isn't configured
  useEffect(() => {
    if (!stripeAvailable && paymentMethod === 'stripe') {
      onPaymentMethodChange('bank_transfer');
    }
  }, [stripeAvailable, paymentMethod, onPaymentMethodChange]);

  // If Stripe isn't configured, only show bank transfer
  if (!stripeAvailable) {
    return (
      <div className="border-t border-border pt-6 space-y-3">
        <Label className="text-xs text-gold font-semibold uppercase tracking-widest">
          {isRtl ? 'طريقة الدفع' : 'Payment Method'}
        </Label>
        <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-gold bg-gold/5">
          <Building2 className="w-6 h-6 text-gold mb-2" />
          <span className="text-charcoal text-sm font-medium">{isRtl ? 'تحويل بنكي' : 'Bank Transfer'}</span>
          <span className="text-muted-foreground text-xs mt-1">{isRtl ? 'سنتواصل معك' : "We'll contact you"}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-border pt-6 space-y-3">
      <Label className="text-xs text-gold font-semibold uppercase tracking-widest">
        {isRtl ? 'طريقة الدفع' : 'Payment Method'}
      </Label>
      <RadioGroup
        value={paymentMethod}
        onValueChange={(value) => onPaymentMethodChange(value as 'stripe' | 'bank_transfer')}
        className="grid grid-cols-2 gap-4"
      >
        <Label
          htmlFor="stripe"
          className={`flex flex-col items-center justify-center p-4 cursor-pointer transition-all rounded-xl border-2 ${
            paymentMethod === 'stripe'
              ? 'border-gold bg-gold/5'
              : 'border-border hover:border-gold/50'
          }`}
        >
          <RadioGroupItem value="stripe" id="stripe" className="sr-only" />
          <CreditCard className="w-6 h-6 text-gold mb-2" />
          <span className="text-charcoal text-sm font-medium">{isRtl ? 'بطاقة ائتمان' : 'Credit Card'}</span>
          <span className="text-muted-foreground text-xs mt-1">{isRtl ? 'دفع فوري' : 'Instant Payment'}</span>
        </Label>
        <Label
          htmlFor="bank_transfer"
          className={`flex flex-col items-center justify-center p-4 cursor-pointer transition-all rounded-xl border-2 ${
            paymentMethod === 'bank_transfer'
              ? 'border-gold bg-gold/5'
              : 'border-border hover:border-gold/50'
          }`}
        >
          <RadioGroupItem value="bank_transfer" id="bank_transfer" className="sr-only" />
          <Building2 className="w-6 h-6 text-gold mb-2" />
          <span className="text-charcoal text-sm font-medium">{isRtl ? 'تحويل بنكي' : 'Bank Transfer'}</span>
          <span className="text-muted-foreground text-xs mt-1">{isRtl ? 'سنتواصل معك' : "We'll contact you"}</span>
        </Label>
      </RadioGroup>
    </div>
  );
}
