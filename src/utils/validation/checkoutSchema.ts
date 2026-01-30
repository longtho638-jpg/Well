import * as z from 'zod';

const phoneRegex = /^(0|\+84)[3|5|7|8|9][0-9]{8}$/;

export const guestInfoSchema = z.object({
    fullName: z.string().min(2, "Họ tên phải có ít nhất 2 ký tự"),
    email: z.string().email("Email không hợp lệ"),
    phone: z.string().regex(phoneRegex, "Số điện thoại không hợp lệ (VN)"),
    address: z.object({
        street: z.string().min(5, "Địa chỉ phải chi tiết hơn (số nhà, tên đường)"),
        ward: z.string().min(1, "Phường/Xã là bắt buộc"),
        district: z.string().min(1, "Quận/Huyện là bắt buộc"),
        city: z.string().min(1, "Tỉnh/Thành phố là bắt buộc"),
    }),
    note: z.string().optional(),
});

export type GuestInfoValues = z.infer<typeof guestInfoSchema>;
