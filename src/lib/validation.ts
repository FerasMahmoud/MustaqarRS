// Form validation utilities
import { z } from 'zod';

export interface ValidationError {
  field: string;
  message: string;
  messageAr: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Cleaning buffer constants
export const CLEANING_BUFFER_DAYS = 2;

// Zod schema for terms acceptance validation
export const termsAcceptedSchema = z.boolean().refine(val => val === true, {
  message: 'You must accept the terms and conditions',
});

// Bilingual error messages for terms acceptance
export const TERMS_ERROR_MESSAGES = {
  en: 'You must accept the terms and conditions',
  ar: 'يجب عليك الموافقة على الشروط والأحكام',
};

// Bilingual error messages for signature validation
export const SIGNATURE_ERROR_MESSAGES = {
  required: {
    en: 'Please provide your signature',
    ar: 'يرجى تقديم توقيعك',
  },
  empty: {
    en: 'Signature appears to be empty',
    ar: 'يبدو أن التوقيع فارغ',
  },
};

// Signature validation - checks if valid base64 with minimum length for actual drawing
export function isValidSignature(signature: string): boolean {
  // Check if signature exists and has minimum length
  if (!signature || signature.length < 500) {
    return false;
  }

  // Check if it's a valid base64 data URL (canvas toDataURL format)
  // Format: data:image/png;base64,<base64-data>
  const dataUrlRegex = /^data:image\/(png|jpeg|jpg|webp);base64,/;
  if (!dataUrlRegex.test(signature)) {
    // Also accept raw base64 without data URL prefix
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    const rawBase64 = signature.replace(/\s/g, '');
    if (!base64Regex.test(rawBase64)) {
      return false;
    }
  }

  // Extract base64 content (after the comma if data URL, or raw)
  const base64Content = signature.includes(',')
    ? signature.split(',')[1]
    : signature;

  // Check if base64 content has minimum length (at least 500 chars ensures actual drawing)
  if (!base64Content || base64Content.length < 500) {
    return false;
  }

  // Try to validate base64 encoding
  try {
    // In browser environment, atob will throw if invalid base64
    if (typeof atob === 'function') {
      atob(base64Content);
    }
  } catch {
    return false;
  }

  return true;
}

// Complete booking form schema with Zod
export const bookingFormSchema = z.object({
  // Step 1: Plan selection
  durationDays: z.number().min(1, 'Duration is required'),
  startDate: z.string().min(1, 'Start date is required'),

  // Step 2: Contact info
  customerName: z.string().min(5, 'Full name is required'),
  customerEmail: z.string().email().optional().or(z.literal('')),
  customerPhone: z.string().optional().or(z.literal('')),

  // Step 3: ID verification
  idType: z.enum(['passport', 'saudi_id', 'iqama']),
  idNumber: z.string().min(1, 'ID number is required'),
  nationality: z.string().min(1, 'Nationality is required'),

  // Step 4: Terms acceptance (required, must be true)
  termsAccepted: z.boolean().refine(val => val === true, {
    message: TERMS_ERROR_MESSAGES.en,
  }),

  // Step 4: Signature (required, must be valid base64 with minimum length)
  signature: z.string()
    .min(500, SIGNATURE_ERROR_MESSAGES.required.en)
    .refine(isValidSignature, {
      message: SIGNATURE_ERROR_MESSAGES.empty.en,
    }),

  // Optional fields
  cleaningService: z.boolean().optional(),
  notes: z.string().optional(),
});

// Type inference from schema
export type BookingFormData = z.infer<typeof bookingFormSchema>;

// Validate terms acceptance with bilingual error support
export function validateTermsAccepted(accepted: boolean): ValidationResult {
  const errors: ValidationError[] = [];

  if (accepted !== true) {
    errors.push({
      field: 'termsAccepted',
      message: TERMS_ERROR_MESSAGES.en,
      messageAr: TERMS_ERROR_MESSAGES.ar,
    });
  }

  return { valid: errors.length === 0, errors };
}

// Validate signature with bilingual error support
export function validateSignature(signature: string): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if signature is provided
  if (!signature || signature.length === 0) {
    errors.push({
      field: 'signature',
      message: SIGNATURE_ERROR_MESSAGES.required.en,
      messageAr: SIGNATURE_ERROR_MESSAGES.required.ar,
    });
    return { valid: false, errors };
  }

  // Check minimum length (at least 500 chars of base64 to ensure actual drawing)
  if (signature.length < 500) {
    errors.push({
      field: 'signature',
      message: SIGNATURE_ERROR_MESSAGES.empty.en,
      messageAr: SIGNATURE_ERROR_MESSAGES.empty.ar,
    });
    return { valid: false, errors };
  }

  // Validate signature format and content
  if (!isValidSignature(signature)) {
    errors.push({
      field: 'signature',
      message: SIGNATURE_ERROR_MESSAGES.empty.en,
      messageAr: SIGNATURE_ERROR_MESSAGES.empty.ar,
    });
    return { valid: false, errors };
  }

  return { valid: true, errors };
}

// List of all countries/nationalities with English and Arabic names
export const NATIONALITIES = [
  { code: 'SA', en: 'Saudi Arabia', ar: 'المملكة العربية السعودية' },
  { code: 'AE', en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة' },
  { code: 'KW', en: 'Kuwait', ar: 'الكويت' },
  { code: 'QA', en: 'Qatar', ar: 'قطر' },
  { code: 'BH', en: 'Bahrain', ar: 'البحرين' },
  { code: 'OM', en: 'Oman', ar: 'عمان' },
  { code: 'YE', en: 'Yemen', ar: 'اليمن' },
  { code: 'JO', en: 'Jordan', ar: 'الأردن' },
  { code: 'LB', en: 'Lebanon', ar: 'لبنان' },
  { code: 'SY', en: 'Syria', ar: 'سوريا' },
  { code: 'IQ', en: 'Iraq', ar: 'العراق' },
  { code: 'PS', en: 'Palestine', ar: 'فلسطين' },
  { code: 'IL', en: 'Israel', ar: 'إسرائيل' },
  { code: 'EG', en: 'Egypt', ar: 'مصر' },
  { code: 'LY', en: 'Libya', ar: 'ليبيا' },
  { code: 'TN', en: 'Tunisia', ar: 'تونس' },
  { code: 'DZ', en: 'Algeria', ar: 'الجزائر' },
  { code: 'MA', en: 'Morocco', ar: 'المغرب' },
  { code: 'SD', en: 'Sudan', ar: 'السودان' },
  { code: 'SS', en: 'South Sudan', ar: 'جنوب السودان' },
  { code: 'ET', en: 'Ethiopia', ar: 'إثيوبيا' },
  { code: 'ER', en: 'Eritrea', ar: 'إريتريا' },
  { code: 'DJ', en: 'Djibouti', ar: 'جيبوتي' },
  { code: 'SO', en: 'Somalia', ar: 'الصومال' },
  { code: 'KE', en: 'Kenya', ar: 'كينيا' },
  { code: 'UG', en: 'Uganda', ar: 'أوغندا' },
  { code: 'RW', en: 'Rwanda', ar: 'رواندا' },
  { code: 'BW', en: 'Botswana', ar: 'بوتسوانا' },
  { code: 'ZA', en: 'South Africa', ar: 'جنوب أفريقيا' },
  { code: 'NG', en: 'Nigeria', ar: 'نيجيريا' },
  { code: 'GH', en: 'Ghana', ar: 'غانا' },
  { code: 'GB', en: 'United Kingdom', ar: 'المملكة المتحدة' },
  { code: 'US', en: 'United States', ar: 'الولايات المتحدة' },
  { code: 'CA', en: 'Canada', ar: 'كندا' },
  { code: 'AU', en: 'Australia', ar: 'أستراليا' },
  { code: 'NZ', en: 'New Zealand', ar: 'نيوزيلندا' },
  { code: 'FR', en: 'France', ar: 'فرنسا' },
  { code: 'DE', en: 'Germany', ar: 'ألمانيا' },
  { code: 'IT', en: 'Italy', ar: 'إيطاليا' },
  { code: 'ES', en: 'Spain', ar: 'إسبانيا' },
  { code: 'PT', en: 'Portugal', ar: 'البرتغال' },
  { code: 'NL', en: 'Netherlands', ar: 'هولندا' },
  { code: 'BE', en: 'Belgium', ar: 'بلجيكا' },
  { code: 'SE', en: 'Sweden', ar: 'السويد' },
  { code: 'NO', en: 'Norway', ar: 'النرويج' },
  { code: 'DK', en: 'Denmark', ar: 'الدنمارك' },
  { code: 'FI', en: 'Finland', ar: 'فنلندا' },
  { code: 'PL', en: 'Poland', ar: 'بولندا' },
  { code: 'CH', en: 'Switzerland', ar: 'سويسرا' },
  { code: 'AT', en: 'Austria', ar: 'النمسا' },
  { code: 'CZ', en: 'Czech Republic', ar: 'جمهورية التشيك' },
  { code: 'RU', en: 'Russia', ar: 'روسيا' },
  { code: 'UA', en: 'Ukraine', ar: 'أوكرانيا' },
  { code: 'GR', en: 'Greece', ar: 'اليونان' },
  { code: 'TR', en: 'Turkey', ar: 'تركيا' },
  { code: 'IN', en: 'India', ar: 'الهند' },
  { code: 'PK', en: 'Pakistan', ar: 'باكستان' },
  { code: 'BD', en: 'Bangladesh', ar: 'بنغلاديش' },
  { code: 'LK', en: 'Sri Lanka', ar: 'سريلانكا' },
  { code: 'NP', en: 'Nepal', ar: 'نيبال' },
  { code: 'CN', en: 'China', ar: 'الصين' },
  { code: 'JP', en: 'Japan', ar: 'اليابان' },
  { code: 'KR', en: 'South Korea', ar: 'كوريا الجنوبية' },
  { code: 'KP', en: 'North Korea', ar: 'كوريا الشمالية' },
  { code: 'TH', en: 'Thailand', ar: 'تايلاند' },
  { code: 'VN', en: 'Vietnam', ar: 'فيتنام' },
  { code: 'MY', en: 'Malaysia', ar: 'ماليزيا' },
  { code: 'SG', en: 'Singapore', ar: 'سنغافورة' },
  { code: 'ID', en: 'Indonesia', ar: 'إندونيسيا' },
  { code: 'PH', en: 'Philippines', ar: 'الفلبين' },
  { code: 'HK', en: 'Hong Kong', ar: 'هونج كونج' },
  { code: 'TW', en: 'Taiwan', ar: 'تايوان' },
  { code: 'MX', en: 'Mexico', ar: 'المكسيك' },
  { code: 'BR', en: 'Brazil', ar: 'البرازيل' },
  { code: 'AR', en: 'Argentina', ar: 'الأرجنتين' },
  { code: 'CL', en: 'Chile', ar: 'تشيلي' },
  { code: 'CO', en: 'Colombia', ar: 'كولومبيا' },
  { code: 'PE', en: 'Peru', ar: 'بيرو' },
  { code: 'VE', en: 'Venezuela', ar: 'فنزويلا' },
  { code: 'CU', en: 'Cuba', ar: 'كوبا' },
];

// Email validation - RFC 5322 simplified
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const trimmed = email.trim().toLowerCase();
  // Check basic format
  if (!emailRegex.test(trimmed)) return false;
  // Validate no consecutive dots, no special chars in local part (except .-_)
  const [localPart, domain] = trimmed.split('@');
  if (!localPart || !domain) return false;
  // Local part can contain: a-z, 0-9, .-_
  if (!/^[a-z0-9._-]+$/.test(localPart)) return false;
  // Cannot start or end with a dot
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  // No consecutive dots
  if (localPart.includes('..')) return false;
  return true;
}

// Phone validation - supports Saudi and international formats
export function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-()]/g, '');

  // Saudi phone formats:
  // 0531182200 (starts with 0)
  // +966531182200 (with +966)
  // 966531182200 (with 966, no +)
  // 531182200 (without country code, 9 digits for Saudi)
  const saudiFormats = [
    /^0\d{9}$/, // 05XXXXXXXXX (0 + 9 digits)
    /^\+966\d{9}$/, // +966XXXXXXXXX
    /^966\d{9}$/, // 966XXXXXXXXX
    /^5\d{8}$/ // 5XXXXXXXX (9 digits for Saudi only)
  ];

  // Check if it's a valid Saudi number
  if (saudiFormats.some(regex => regex.test(cleaned))) {
    return true;
  }

  // International format: must have country code with + or at least 10 digits
  // Examples: +44123456789, +12345678901, +33123456789, etc.
  const internationalRegex = /^\+\d{1,3}\d{6,14}$/; // +country code + 6-14 digits

  if (internationalRegex.test(cleaned)) {
    return true;
  }

  // Also accept country code without +: 44123456789, 12345678901, etc. (but must be 10-15 chars)
  const countryCodeRegex = /^\d{10,15}$/;
  if (countryCodeRegex.test(cleaned) && !cleaned.match(/^[0-9]{9}$/)) {
    // Must have at least 10 digits and not be exactly 9 digits (which would be ambiguous)
    return true;
  }

  return false;
}

// Saudi ID validation (10 digits starting with 1 or 2)
export function isValidSaudiId(id: string): boolean {
  const cleaned = id.replace(/\s/g, '');
  return /^[12]\d{9}$/.test(cleaned);
}

// Iqama validation (10 digits starting with 2)
export function isValidIqama(id: string): boolean {
  const cleaned = id.replace(/\s/g, '');
  return /^2\d{9}$/.test(cleaned);
}

// Passport validation (alphanumeric, 6-20 characters)
export function isValidPassport(passport: string): boolean {
  const cleaned = passport.replace(/\s/g, '');
  return /^[A-Z0-9]{6,20}$/i.test(cleaned);
}

// Name validation - requires first AND last name (at least 2 words, each at least 2 characters)
export function isValidName(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length < 5) return false; // Minimum: "AB CD" (5 chars)

  // Split by whitespace and filter empty strings
  const words = trimmed.split(/\s+/).filter(word => word.length > 0);

  // Must have at least 2 words (first and last name)
  if (words.length < 2) return false;

  // Each word must be at least 2 characters long
  // Allow: ASCII Latin, accented chars, Arabic, hyphens, apostrophes
  // But NOT leading/trailing hyphens or apostrophes
  return words.every(word => {
    if (word.length < 2) return false;

    // Reject if starts or ends with hyphen or apostrophe
    if (word[0] === '-' || word[word.length - 1] === '-') return false;
    if (word[0] === "'" || word[word.length - 1] === "'") return false;

    // Check each character: must be letter, hyphen, or apostrophe
    // This includes: A-Z, a-z, accented chars (é, ñ, ü, etc.), Arabic, -, '
    for (const char of word) {
      // Allow ASCII letters
      if ((char >= 'a' && char <= 'z') || (char >= 'A' && char <= 'Z')) continue;
      // Allow hyphens and apostrophes (but position checked above)
      if (char === '-' || char === "'") continue;
      // Allow any character with code point >= 0x80 (covers accented, Arabic, etc.)
      if (char.charCodeAt(0) >= 0x80) continue;
      // Character not allowed
      return false;
    }

    return true;
  });
}

// Date validation (must be today or future)
export function isValidFutureDate(dateString: string): boolean {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date >= today;
}

// Validate booking form - Step 1 (Plan selection)
export function validateStep1(data: {
  billingPeriod?: string;
  durationDays?: number;
  startDate: string;
  bookings?: { start_date: string; end_date: string }[]; // NEW: For gap-filling support
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Support both old billingPeriod and new durationDays
  if (!data.durationDays && !data.billingPeriod) {
    errors.push({
      field: 'durationDays',
      message: 'Please select a rental duration',
      messageAr: 'يرجى اختيار مدة الإيجار',
    });
  } else if (data.durationDays) {
    // If bookings data provided, validate based on optimal duration
    if (data.bookings && data.startDate) {
      const optimal = calculateOptimalDuration(data.startDate, data.durationDays, data.bookings);

      // Validate based on mode
      if (optimal.mode === 'standard' && data.durationDays < 30) {
        errors.push({
          field: 'durationDays',
          message: 'Minimum rental period is 30 days for standard bookings',
          messageAr: 'الحد الأدنى للإيجار هو 30 يوم للحجوزات العادية',
        });
      }

      // Check if requested duration exceeds available
      if (data.durationDays > optimal.maxAvailable && optimal.maxAvailable !== Infinity) {
        errors.push({
          field: 'durationDays',
          message: `Only ${optimal.maxAvailable} days available before next booking`,
          messageAr: `${optimal.maxAvailable} يوم فقط متاحة قبل الحجز التالي`,
        });
      }
    } else {
      // Fallback to standard 30-day minimum if no bookings data
      if (data.durationDays < 30) {
        errors.push({
          field: 'durationDays',
          message: 'Minimum rental period is 30 days',
          messageAr: 'الحد الأدنى للإيجار هو 30 يوم',
        });
      }
    }
  }

  if (!data.startDate) {
    errors.push({
      field: 'startDate',
      message: 'Please select a start date',
      messageAr: 'يرجى اختيار تاريخ البدء',
    });
  } else if (!isValidFutureDate(data.startDate)) {
    errors.push({
      field: 'startDate',
      message: 'Start date must be today or in the future',
      messageAr: 'يجب أن يكون تاريخ البدء اليوم أو في المستقبل',
    });
  }

  return { valid: errors.length === 0, errors };
}

// Validate booking form - Step 2 (Contact info)
export function validateStep2(data: {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  // Name validation - requires first and last name
  if (!data.customerName || !isValidName(data.customerName)) {
    errors.push({
      field: 'customerName',
      message: 'Please enter your full name (first and last name required)',
      messageAr: 'يرجى إدخال اسمك الكامل (الاسم الأول والأخير مطلوبان)',
    });
  }

  // Email and Phone validation - require at least ONE valid contact method
  const hasValidEmail = data.customerEmail && isValidEmail(data.customerEmail);
  const hasValidPhone = data.customerPhone && isValidPhone(data.customerPhone);

  // Email field validation
  if (!data.customerEmail) {
    // Email is empty - check if phone is valid, if not error both
    if (!hasValidPhone) {
      errors.push({
        field: 'customerEmail',
        message: 'Please enter a valid email address (required if phone is invalid)',
        messageAr: 'يرجى إدخال بريد إلكتروني صحيح (مطلوب إذا كان الهاتف غير صحيح)',
      });
    }
  } else if (!isValidEmail(data.customerEmail)) {
    // Email is entered but invalid
    errors.push({
      field: 'customerEmail',
      message: 'Please enter a valid email address (e.g., example@email.com)',
      messageAr: 'يرجى إدخال بريد إلكتروني صحيح (مثال: example@email.com)',
    });
  }

  // Phone field validation
  if (!data.customerPhone) {
    // Phone is empty - check if email is valid, if not error both
    if (!hasValidEmail) {
      errors.push({
        field: 'customerPhone',
        message: 'Please enter a valid phone number (required if email is invalid)',
        messageAr: 'يرجى إدخال رقم هاتف صحيح (مطلوب إذا كان البريد الإلكتروني غير صحيح)',
      });
    }
  } else if (!isValidPhone(data.customerPhone)) {
    // Phone is entered but invalid
    errors.push({
      field: 'customerPhone',
      message: 'Please enter a valid phone number (Saudi: 0531182200 or +966531182200; International: +country code)',
      messageAr: 'يرجى إدخال رقم هاتف صحيح (سعودي: 0531182200 أو +966531182200؛ دولي: +كود البلد)',
    });
  }

  // Final check: must have at least ONE valid contact method
  if (!hasValidEmail && !hasValidPhone) {
    // Only show this error if both fields are invalid/empty
    if (!errors.some(e => e.field === 'customerEmail' || e.field === 'customerPhone')) {
      errors.push({
        field: 'customerEmail',
        message: 'Please provide either a valid email address or phone number',
        messageAr: 'يرجى تقديم بريد إلكتروني صحيح أو رقم هاتف صحيح',
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

// Validate booking form - Step 3 (ID verification)
export function validateStep3(data: {
  idType: 'passport' | 'saudi_id' | 'iqama';
  idNumber: string;
  nationality: string;
}): ValidationResult {
  const errors: ValidationError[] = [];

  if (!data.idType || !['passport', 'saudi_id', 'iqama'].includes(data.idType)) {
    errors.push({
      field: 'idType',
      message: 'Please select an ID type',
      messageAr: 'يرجى اختيار نوع الهوية',
    });
  }

  if (!data.idNumber) {
    errors.push({
      field: 'idNumber',
      message: 'Please enter your ID number',
      messageAr: 'يرجى إدخال رقم الهوية',
    });
  } else {
    let isValidId = false;
    switch (data.idType) {
      case 'saudi_id':
        isValidId = isValidSaudiId(data.idNumber);
        if (!isValidId) {
          errors.push({
            field: 'idNumber',
            message: 'Please enter a valid Saudi ID (10 digits starting with 1 or 2)',
            messageAr: 'يرجى إدخال هوية سعودية صحيحة (10 أرقام تبدأ بـ 1 أو 2)',
          });
        }
        break;
      case 'iqama':
        isValidId = isValidIqama(data.idNumber);
        if (!isValidId) {
          errors.push({
            field: 'idNumber',
            message: 'Please enter a valid Iqama number (10 digits starting with 2)',
            messageAr: 'يرجى إدخال رقم إقامة صحيح (10 أرقام تبدأ بـ 2)',
          });
        }
        break;
      case 'passport':
        isValidId = isValidPassport(data.idNumber);
        if (!isValidId) {
          errors.push({
            field: 'idNumber',
            message: 'Please enter a valid passport number (6-20 alphanumeric characters)',
            messageAr: 'يرجى إدخال رقم جواز سفر صحيح (6-20 حرف أو رقم)',
          });
        }
        break;
    }
  }

  if (!data.nationality || !data.nationality.toString().trim()) {
    errors.push({
      field: 'nationality',
      message: 'Please select your nationality',
      messageAr: 'يرجى اختيار جنسيتك',
    });
  }

  return { valid: errors.length === 0, errors };
}

// Duration options with savings percentages (30-day months for consistency)
// Discount structure: 1-2mo=0%, 3-5mo=5%, 6-8mo=7%, 9-11mo=9%, 12-14mo=11%, etc (+2% every 3 months)
export const DURATION_OPTIONS = [
  { days: 30, label: { en: '1 Month', ar: 'شهر' }, savings: 0 },
  { days: 60, label: { en: '2 Months', ar: 'شهرين' }, savings: 0 },
  { days: 90, label: { en: '3 Months', ar: '3 أشهر' }, savings: 5 },
  { days: 120, label: { en: '4 Months', ar: '4 أشهر' }, savings: 5 },
  { days: 150, label: { en: '5 Months', ar: '5 أشهر' }, savings: 5 },
  { days: 180, label: { en: '6 Months', ar: '6 أشهر' }, savings: 7 },
  { days: 270, label: { en: '9 Months', ar: '9 أشهر' }, savings: 9 },
  { days: 360, label: { en: '1 Year', ar: 'سنة' }, savings: 11 },
  { days: 720, label: { en: '2 Years', ar: 'سنتين' }, savings: 19 },
  { days: 1080, label: { en: '3 Years', ar: '3 سنوات' }, savings: 25 },
];

// Get savings percentage for a given duration (supports custom durations)
// Pattern: 1-2mo=0%, 3-5mo=5%, 6-8mo=7%, 9-11mo=9%, 12-14mo=11%, +2% every 3 months
export function getSavingsPercent(days: number): number {
  const months = Math.round(days / 30);

  if (months <= 2) return 0;      // 1-2 months: 0%
  if (months <= 5) return 5;      // 3-5 months: 5%
  if (months <= 8) return 7;      // 6-8 months: 7%
  if (months <= 11) return 9;     // 9-11 months: 9%
  if (months <= 14) return 11;    // 12-14 months: 11%
  if (months <= 17) return 13;    // 15-17 months: 13%
  if (months <= 20) return 15;    // 18-20 months: 15%
  if (months <= 23) return 17;    // 21-23 months: 17%
  if (months <= 26) return 19;    // 24-26 months: 19%
  if (months <= 29) return 21;    // 27-29 months: 21%
  if (months <= 32) return 23;    // 30-32 months: 23%
  return 25;                      // 33-36 months: 25%
}

// Calculate booking price based on days
export function calculateBookingPriceByDays(
  monthlyRate: number,
  durationDays: number,
  includeCleaningService: boolean = false
): {
  totalPrice: number;
  originalPrice: number;
  days: number;
  savings: number;
  savingsPercent: number;
  cleaningFee?: number;
  cleaningPeriods?: number;
  cleaningRateType?: 'weekly' | 'monthly';
} {
  const months = durationDays / 30;
  const originalPrice = Math.round(monthlyRate * months);
  const savingsPercent = getSavingsPercent(durationDays);
  const totalPrice = savingsPercent > 0
    ? Math.round(originalPrice * (1 - savingsPercent / 100))
    : originalPrice;
  const savings = originalPrice - totalPrice;

  const result: {
    totalPrice: number;
    originalPrice: number;
    days: number;
    savings: number;
    savingsPercent: number;
    cleaningFee?: number;
    cleaningPeriods?: number;
    cleaningRateType?: 'weekly' | 'monthly';
  } = {
    totalPrice,
    originalPrice,
    days: durationDays,
    savings,
    savingsPercent,
  };

  if (includeCleaningService) {
    const cleaning = calculateCleaningFee(durationDays);
    result.cleaningFee = cleaning.cleaningFee;
    result.cleaningPeriods = cleaning.cleaningPeriods;
    result.cleaningRateType = cleaning.rateType;
    result.totalPrice = totalPrice + cleaning.cleaningFee;
  }

  return result;
}

// Calculate cleaning service fee based on duration
export function calculateCleaningFee(durationDays: number): {
  cleaningFee: number;
  cleaningPeriods: number;
  rateType: 'weekly' | 'monthly';
} {
  if (durationDays < 30) {
    // Weekly rate: 50 SAR per week
    const weeks = Math.ceil(durationDays / 7);
    return {
      cleaningFee: weeks * 50,
      cleaningPeriods: weeks,
      rateType: 'weekly',
    };
  } else {
    // Monthly rate: 200 SAR per month
    const months = Math.ceil(durationDays / 30);
    return {
      cleaningFee: months * 200,
      cleaningPeriods: months,
      rateType: 'monthly',
    };
  }
}

// Calculate booking price (legacy support for billingPeriod)
export function calculateBookingPrice(
  monthlyRate: number,
  yearlyRate: number,
  billingPeriod: 'monthly' | 'yearly',
  startDate: string,
  endDate?: string
): {
  totalPrice: number;
  days: number;
  savings: number;
  savingsPercent: number;
} {
  const price = billingPeriod === 'yearly' ? yearlyRate : monthlyRate;
  const savings = billingPeriod === 'yearly' ? (monthlyRate * 12) - yearlyRate : 0;
  const savingsPercent = billingPeriod === 'yearly'
    ? Math.round((savings / (monthlyRate * 12)) * 100)
    : 0;

  // Calculate days
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date(start);
  if (!endDate) {
    if (billingPeriod === 'yearly') {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setMonth(end.getMonth() + 1);
    }
  }
  const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

  return {
    totalPrice: price,
    days,
    savings,
    savingsPercent,
  };
}

// Calculate end date based on days
export function calculateEndDateByDays(startDate: string, days: number): string {
  const [year, month, day] = startDate.split('-').map(Number);
  const end = new Date(year, month - 1, day + days - 1);
  // Construct date string manually to avoid timezone conversion
  const yyyy = end.getFullYear();
  const mm = String(end.getMonth() + 1).padStart(2, '0');
  const dd = String(end.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Calculate end date based on billing period (legacy)
export function calculateEndDate(startDate: string, billingPeriod: 'monthly' | 'yearly'): string {
  const start = new Date(startDate);
  const end = new Date(start);

  if (billingPeriod === 'yearly') {
    end.setFullYear(end.getFullYear() + 1);
  } else {
    end.setMonth(end.getMonth() + 1);
  }

  return end.toISOString().split('T')[0];
}

// Check if a date range is available (no conflicts with existing bookings)
export function isRangeAvailable(
  startDate: string,
  durationDays: number,
  bookings: { start_date: string; end_date: string }[]
): { available: boolean; conflictDate: string | null } {
  // Parse dates directly to avoid timezone issues
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);

  const end = new Date(startYear, startMonth - 1, startDay + durationDays - 1);

  for (const booking of bookings) {
    const [bookingYear, bookingMonth, bookingDay] = booking.start_date.split('-').map(Number);
    const [endYear, endMonth, endDay] = booking.end_date.split('-').map(Number);

    const bookingStart = new Date(bookingYear, bookingMonth - 1, bookingDay);
    const bookingEnd = new Date(endYear, endMonth - 1, endDay);

    // Check for overlap: (start <= bookingEnd && end >= bookingStart)
    if (start <= bookingEnd && end >= bookingStart) {
      return {
        available: false,
        conflictDate: booking.start_date
      };
    }
  }

  return { available: true, conflictDate: null };
}

// Get all dates in a range as array of "YYYY-MM-DD" strings
export function getDateRange(startDate: string, durationDays: number): string[] {
  const dates: string[] = [];
  const [year, month, day] = startDate.split('-').map(Number);

  for (let i = 0; i < durationDays; i++) {
    const date = new Date(year, month - 1, day + i);
    // Construct date string manually to avoid timezone conversion
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    dates.push(`${yyyy}-${mm}-${dd}`);
  }

  return dates;
}

// Calculate maximum available days from a start date before hitting next booking
export function getMaxAvailableDays(
  startDate: string,
  bookings: { start_date: string; end_date: string }[]
): number {
  const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
  const start = new Date(startYear, startMonth - 1, startDay);

  // Find the earliest booking that starts AFTER our start date
  let earliestConflict: Date | null = null;

  for (const booking of bookings) {
    const [bookingYear, bookingMonth, bookingDay] = booking.start_date.split('-').map(Number);
    const bookingStart = new Date(bookingYear, bookingMonth - 1, bookingDay);

    // Only consider bookings that start after our start date
    if (bookingStart > start) {
      if (!earliestConflict || bookingStart < earliestConflict) {
        earliestConflict = bookingStart;
      }
    }
  }

  if (!earliestConflict) {
    return Infinity; // No upcoming bookings
  }

  // Calculate days until conflict (subtract cleaning buffer days)
  const daysDiff = Math.ceil((earliestConflict.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff - CLEANING_BUFFER_DAYS; // Leave 2 day gap before next booking for cleaning
}

// Calculate optimal booking duration based on available days
export function calculateOptimalDuration(
  startDate: string,
  requestedDays: number,
  bookings: { start_date: string; end_date: string }[]
): {
  recommendedDays: number;
  mode: 'standard' | 'gap-filling' | 'auto-extended';
  maxAvailable: number;
} {
  const maxAvailable = getMaxAvailableDays(startDate, bookings);

  // Case 1: Infinite availability - use requested duration
  if (maxAvailable === Infinity) {
    if (requestedDays >= 30) {
      return { recommendedDays: requestedDays, mode: 'standard', maxAvailable };
    } else if (requestedDays >= 7) {
      return { recommendedDays: requestedDays, mode: 'gap-filling', maxAvailable };
    }
  }

  // Case 2: Gap >= 30 days - standard booking
  if (maxAvailable >= 30) {
    return { recommendedDays: Math.min(requestedDays, maxAvailable), mode: 'standard', maxAvailable };
  }

  // Case 3: Gap 7-29 days - gap-filling booking
  if (maxAvailable >= 7) {
    return { recommendedDays: maxAvailable, mode: 'gap-filling', maxAvailable };
  }

  // Case 4: Gap < 7 days - auto-extend to fill entire gap
  if (maxAvailable > 0) {
    return { recommendedDays: maxAvailable, mode: 'auto-extended', maxAvailable };
  }

  // No availability
  return { recommendedDays: 0, mode: 'standard', maxAvailable: 0 };
}
