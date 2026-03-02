/**
 * AI landing page builder and GROW token redemption marketplace types
 * Extracted from src/types.ts for file size management
 */

export type LandingPageTemplateType = 'elegant' | 'dynamic' | 'expert';

export interface LandingPageTemplate {
  id: string;
  type: LandingPageTemplateType;
  name: string;
  description: string;
  imageUrl: string;
  colorScheme: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

export interface UserLandingPage {
  id: string;
  userId: string;
  template: LandingPageTemplateType;
  portraitUrl?: string;
  aiGeneratedBio: string;
  customBio?: string;
  publishedUrl: string;
  isPublished: boolean;
  createdAt: string;
  views: number;
  conversions: number;
}

export interface RedemptionItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  growCost: number;
  category: 'electronics' | 'travel' | 'education' | 'experience';
  stock: number;
  estimatedValue: number;
  redemptionCount: number;
  isAvailable: boolean;
  highlights: string[];
}

export interface RedemptionOrder {
  id: string;
  userId: string;
  itemId: string;
  itemName: string;
  growSpent: number;
  status: 'pending' | 'processing' | 'shipped' | 'completed';
  createdAt: string;
  completedAt?: string;
  trackingNumber?: string;
}
