import { z } from 'zod';

const indianMobileRegex = /^[6-9]\d{9}$/;

function normalizeMobile(val: string) {
  return val.replace(/\D/g, '').slice(-10);
}

const optionalIndianMobile = z
  .string()
  .optional()
  .transform((v) => (v?.trim() ? normalizeMobile(v.trim()) : undefined))
  .refine((v) => v === undefined || indianMobileRegex.test(v), {
    message: 'Must be a valid 10-digit India mobile number',
  });

export const enquiryFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name is required (min 2 characters)'),
  mobileNumber: z
    .string()
    .trim()
    .transform(normalizeMobile)
    .refine((v) => indianMobileRegex.test(v), {
      message: 'Enter a valid 10-digit India mobile number (starts with 6-9)',
    }),
  leadSource: z.string().min(1, 'Lead source is required'),
  dateOfEnquiry: z.string().min(1, 'Date of enquiry is required'),
  age: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? parseInt(v, 10) : undefined))
    .refine((v) => v === undefined || (Number.isInteger(v) && v >= 1 && v <= 120), {
      message: 'Age must be between 1 and 120',
    }),
  gender: z.string().optional(),
  profession: z.string().optional(),
  familyDetails: z.string().optional(),
  alternateContact: optionalIndianMobile,
  email: z
    .string()
    .optional()
    .transform((v) => v?.trim() || undefined)
    .refine((v) => !v || z.string().email().safeParse(v).success, {
      message: 'Invalid email address',
    }),
  address: z.string().optional(),
  preferredContactTime: z.string().optional(),
  offeredProgramId: z.string().optional(),
  offeredProgramDurationId: z.string().optional(),
  offeredDiscountId: z.string().optional(),
  offeredFlatDiscount: z
    .string()
    .optional()
    .transform((v) => (v?.trim() ? parseFloat(v) : undefined))
    .refine((v) => v === undefined || (v >= 0 && !Number.isNaN(v)), {
      message: 'Flat discount must be a positive amount',
    }),
  offerCategoryId: z.string().optional(),
  offerValidTill: z.string().optional(),
  initialNote: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.offeredDiscountId && data.offeredFlatDiscount != null && data.offeredFlatDiscount > 0) {
    ctx.addIssue({
      code: 'custom',
      message: 'Choose either a discount category or flat discount, not both',
      path: ['offeredFlatDiscount'],
    });
  }
});

export type EnquiryFormValues = z.infer<typeof enquiryFormSchema>;
