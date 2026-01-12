/**
 * HealthCheck Types & Constants
 * Shared types for the health check quiz
 */

import React from 'react';

export interface QuizOption {
    label: string;
    value: string;
    score: number;
}

export interface Question {
    id: string;
    question: string;
    icon: React.ElementType;
    options: QuizOption[];
}

export interface ProductRecommendation {
    id: string;
    name: string;
    price: number;
    reason: string;
    benefits: string[];
    priority: 'high' | 'medium' | 'low';
}

export interface HealthDimension {
    dimension: string;
    score: number;
    fullMark: number;
}

// Score helper functions
export const getScoreColor = (score: number): string => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-amber-600';
    if (score >= 40) return 'from-orange-500 to-red-500';
    return 'from-red-600 to-rose-700';
};
