'use client';

import { Calendar, User, Shield, Check } from 'lucide-react';

interface Step {
  icon: typeof Calendar;
  label: string;
}

interface BookingStepsProps {
  currentStep: number;
  isRtl: boolean;
}

export function BookingSteps({ currentStep, isRtl }: BookingStepsProps) {
  const steps: Step[] = [
    { icon: Calendar, label: isRtl ? 'الخطة' : 'Plan' },
    { icon: User, label: isRtl ? 'البيانات' : 'Details' },
    { icon: Shield, label: isRtl ? 'التحقق' : 'Verify' },
  ];

  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, idx) => {
        const StepIcon = s.icon;
        const stepNum = idx + 1;
        const isActive = currentStep === stepNum;
        const isCompleted = currentStep > stepNum;

        return (
          <div key={idx} className="flex items-center gap-2">
            <div
              className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
                isActive
                  ? 'bg-gold text-white shadow-lg shadow-gold/30'
                  : isCompleted
                  ? 'bg-gold/20 text-gold'
                  : 'bg-white border border-border text-muted-foreground'
              }`}
            >
              {isCompleted ? (
                <Check className="w-5 h-5" />
              ) : (
                <StepIcon className="w-5 h-5" />
              )}
            </div>
            {idx < steps.length - 1 && (
              <div className={`w-8 h-0.5 rounded ${currentStep > stepNum ? 'bg-gold' : 'bg-border'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}
