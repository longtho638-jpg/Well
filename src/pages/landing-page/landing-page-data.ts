/**
 * Landing page static data: roadmap stages builder, awards, and social proof config
 */

import { Sprout, TreeDeciduous, Trees, Building2 } from 'lucide-react';

export const getRoadmapStages = (t: (key: string) => string) => [
  {
    id: 'seed',
    name: t('landing.roadmap.stages.seed.name'),
    icon: Sprout,
    status: 'active',
    statusLabel: t('landing.roadmap.stages.seed.status'),
    color: 'teal',
    gradient: 'from-teal-500 to-teal-600',
    bgGlow: 'bg-teal-500/20',
    textColor: 'text-teal-400',
    borderColor: 'border-teal-500/50',
    description: t('landing.roadmap.stages.seed.description'),
    mission: t('landing.roadmap.stages.seed.mission'),
    benefits: [
      t('landing.roadmap.stages.seed.benefits.income'),
      t('landing.roadmap.stages.seed.benefits.founder'),
      t('landing.roadmap.stages.seed.benefits.ai'),
      t('landing.roadmap.stages.seed.benefits.support'),
    ],
    unlockCondition: null,
  },
  {
    id: 'tree',
    name: t('landing.roadmap.stages.tree.name'),
    icon: TreeDeciduous,
    status: 'coming',
    statusLabel: t('landing.roadmap.stages.tree.status'),
    color: 'green',
    gradient: 'from-green-500 to-green-600',
    bgGlow: 'bg-green-500/20',
    textColor: 'text-green-400',
    borderColor: 'border-green-500/50',
    description: t('landing.roadmap.stages.tree.description'),
    mission: t('landing.roadmap.stages.tree.mission'),
    benefits: [
      t('landing.roadmap.stages.tree.benefits.copilot'),
      t('landing.roadmap.stages.tree.benefits.marketing'),
      t('landing.roadmap.stages.tree.benefits.dashboard'),
      t('landing.roadmap.stages.tree.benefits.passive'),
    ],
    unlockCondition: '1,000 Partner',
  },
  {
    id: 'forest',
    name: t('landing.roadmap.stages.forest.name'),
    icon: Trees,
    status: 'locked',
    statusLabel: t('landing.roadmap.stages.forest.status'),
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
    bgGlow: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/50',
    description: t('landing.roadmap.stages.forest.description'),
    mission: t('landing.roadmap.stages.forest.mission'),
    benefits: [
      t('landing.roadmap.stages.forest.benefits.platform'),
      t('landing.roadmap.stages.forest.benefits.market'),
      t('landing.roadmap.stages.forest.benefits.data'),
      t('landing.roadmap.stages.forest.benefits.equity'),
    ],
    unlockCondition: '10,000 Partner',
  },
  {
    id: 'metropolis',
    name: t('landing.roadmap.stages.metropolis.name'),
    icon: Building2,
    status: 'vision',
    statusLabel: t('landing.roadmap.stages.metropolis.status'),
    color: 'sky',
    gradient: 'from-sky-500 to-sky-600',
    bgGlow: 'bg-sky-500/20',
    textColor: 'text-sky-400',
    borderColor: 'border-sky-500/50',
    description: t('landing.roadmap.stages.metropolis.description'),
    mission: t('landing.roadmap.stages.metropolis.mission'),
    benefits: [
      t('landing.roadmap.stages.metropolis.benefits.franchise'),
      t('landing.roadmap.stages.metropolis.benefits.global'),
      t('landing.roadmap.stages.metropolis.benefits.diversified'),
      t('landing.roadmap.stages.metropolis.benefits.legacy'),
    ],
    unlockCondition: null,
    hasVisionLink: true,
  },
];

export const EA_AWARDS_DATA = [
  { title: 'ISO 9001:2015', icon: '🏆' },
  { title: 'FDA Certified', icon: '✅' },
  { title: 'GMP Compliant', icon: '🎖️' },
  { title: 'Top 100 Vietnam', icon: '⭐' },
];

export const getSocialProofItems = (t: (key: string) => string) => [
  { name: 'Minh Anh', action: t('landing.socialProof.actions.joined'), time: t('landing.socialProof.times.min2'), avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=MinhAnh&backgroundColor=b6e3f4' },
  { name: 'Hoàng Nam', action: t('landing.socialProof.actions.silver'), time: t('landing.socialProof.times.min5'), avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HoangNam&backgroundColor=c0aede' },
  { name: 'Thanh Hà', action: t('landing.socialProof.actions.withdraw'), time: t('landing.socialProof.times.min8'), avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=ThanhHa&backgroundColor=ffd5dc' },
  { name: 'Tuấn Anh', action: t('landing.socialProof.actions.team'), time: t('landing.socialProof.times.min12'), avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TuanAnh&backgroundColor=d1f4d9' },
  { name: 'Ngọc Linh', action: t('landing.socialProof.actions.order'), time: t('landing.socialProof.times.min15'), avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NgocLinh&backgroundColor=ffebd8' },
];

export const getTestimonials = (t: (key: string) => string) => [
  {
    name: t('landing.testimonials.items.item1.name'),
    role: t('landing.testimonials.items.item1.role'),
    content: t('landing.testimonials.items.item1.content'),
    rating: 5,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=NguyenMinhAnh&backgroundColor=b6e3f4',
  },
  {
    name: t('landing.testimonials.items.item2.name'),
    role: t('landing.testimonials.items.item2.role'),
    content: t('landing.testimonials.items.item2.content'),
    rating: 5,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=TranHoangNam&backgroundColor=c0aede',
  },
  {
    name: t('landing.testimonials.items.item3.name'),
    role: t('landing.testimonials.items.item3.role'),
    content: t('landing.testimonials.items.item3.content'),
    rating: 5,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=LeThanhHa&backgroundColor=ffd5dc',
  },
];

export const getHeroStats = (t: (key: string) => string) => [
  { value: 1243, suffix: '+', label: t('landing.heroStats.partnersActive') },
  { value: 5200000000, prefix: '₫', label: t('landing.heroStats.gmvTotal') },
  { value: 320, suffix: '%', label: t('landing.heroStats.yoyGrowth') },
  { value: 157, label: t('landing.heroStats.slotsRemaining') },
];
