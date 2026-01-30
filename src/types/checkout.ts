
export interface GuestProfile {
    fullName: string;
    email: string;
    phone: string;
    address: {
        street: string;
        ward: string;
        district: string;
        city: string;
    };
    note?: string;
}

export type PaymentMethod = 'cod' | 'banking';

export interface OrderPayload {
    items: {
        productId: string;
        quantity: number;
        price: number;
    }[];
    customer: {
        userId?: string; // Optional: if logged in
        guestProfile?: GuestProfile; // Optional: if guest
    };
    paymentMethod: PaymentMethod;
    totalAmount: number;
}
