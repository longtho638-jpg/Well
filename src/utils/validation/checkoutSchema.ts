import * as z from 'zod';

const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

export const createGuestInfoSchema = (t: (key: string) => string) => z.object({
    fullName: z.string().min(2, t('checkout.validation.fullNameRequired')),
    email: z.string().email(t('checkout.validation.emailInvalid')),
    phone: z.string().regex(phoneRegex, t('checkout.validation.phoneInvalid')),
    address: z.object({
        street: z.string().min(5, t('checkout.validation.streetRequired')),
        ward: z.string().min(1, t('checkout.validation.wardRequired')),
        district: z.string().min(1, t('checkout.validation.districtRequired')),
        city: z.string().min(1, t('checkout.validation.cityRequired')),
    }),
    note: z.string().optional(),
});

export type GuestInfoValues = z.infer<ReturnType<typeof createGuestInfoSchema>>;
