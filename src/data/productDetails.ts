/**
 * Product Detail Data
 * Centralized mock data and types for product detail pages.
 */

export interface ProductBenefit {
    title: string;
    desc: string;
}

export interface ProductDetails {
    ingredients: string[];
    benefits: ProductBenefit[];
    usage: string;
}

export const MOCK_PRODUCT_DETAILS: ProductDetails = {
    ingredients: [
        "Premium Vitamin C (Ascorbic Acid)",
        "Organic Zinc Gluconate",
        "Elderberry Extract",
        "Echinacea Purpurea",
        "Natural Flavors"
    ],
    benefits: [
        { title: "Boosts Immunity", desc: "Strengthens natural defenses with concentrated Vitamin C." },
        { title: "Increases Energy", desc: "Reduces systemic fatigue and improves metabolic focus." },
        { title: "Skin Health", desc: "Promotes natural collagen synthesis for radiant skin." }
    ],
    usage: "Take 1 tablet daily with purified water, preferably after a meal for optimal absorption."
};
