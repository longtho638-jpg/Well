/**
 * Admin CMS - Content Management System
 * Tab content panels extracted to cms-tab-content-panels.tsx
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Search, RefreshCw, Plus, ImageIcon, Megaphone, Mail } from 'lucide-react';
import { useCMS } from '@/hooks/useCMS';
import { useTranslation } from '@/hooks';
import { BannersTabPanel, AnnouncementsTabPanel, TemplatesTabPanel } from './cms-tab-content-panels';

// ─── Tab Button ──────────────────────────────────────────────

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
  count?: number;
}> = ({ active, onClick, icon: Icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${active
      ? 'bg-[#00575A] text-white shadow-xl shadow-teal-500/20'
      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800'
      }`}
  >
    <Icon size={14} />
    {label}
    {count !== undefined && (
      <span className={`px-2 py-0.5 rounded-lg border ${active ? 'bg-white/10 border-white/20' : 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-white/5'}`}>
        {count}
      </span>
    )}
  </button>
);

// ─── Main Page ───────────────────────────────────────────────

const CMS: React.FC = () => {
  const { t } = useTranslation();
  const {
    activeTab, setActiveTab, filteredData, searchQuery, setSearchQuery,
    setEditingBanner, setEditingAnnouncement, stats, refresh,
    handleDeleteBanner, handleToggleAnnouncementStatus, handleDeleteAnnouncement,
    banners, announcements, templates,
  } = useCMS();

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">{t('cms.content_orchestrator')}</h2>
          <p className="text-zinc-500 font-medium text-lg mt-1">{t('cms.cross_platform_content_deliver')}</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={refresh} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm text-zinc-500">
            <RefreshCw className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (activeTab === 'banners') setEditingBanner({ id: '', title: '', subtitle: '', ctaText: '', ctaLink: '', imageUrl: '', location: 'promotion', status: 'draft' });
              else if (activeTab === 'announcements') setEditingAnnouncement({ id: '', title: '', message: '', type: 'info', target: 'all', status: 'draft', createdAt: new Date().toISOString() });
            }}
            className="flex items-center gap-3 bg-[#00575A] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#004447] transition-all shadow-xl shadow-teal-500/20"
          >
            <Plus size={20} />
            {t('cms.create')}{activeTab.slice(0, -1)}
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: t('admin.cms.stat_content_banners'), value: banners.length, icon: ImageIcon, color: 'text-blue-500' },
          { label: t('admin.cms.stat_live_banners'), value: stats.activeBanners, icon: CheckCircle, color: 'text-emerald-500' },
          { label: t('admin.cms.stat_broadcasts'), value: announcements.length, icon: Megaphone, color: 'text-amber-500' },
          { label: t('admin.cms.stat_total_templates'), value: templates.length, icon: Mail, color: 'text-purple-500' },
        ].map((stat, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 p-6 rounded-3xl shadow-sm">
            <div className="flex items-center gap-3 mb-4 text-zinc-500 font-black text-[10px] uppercase tracking-widest">
              <stat.icon size={16} className={stat.color} />
              {stat.label}
            </div>
            <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Controls Bar */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 p-6 rounded-[2.5rem] shadow-sm space-y-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex flex-wrap gap-2">
            <TabButton active={activeTab === 'banners'} onClick={() => setActiveTab('banners')} icon={ImageIcon} label={t('cms.tab_banners')} count={banners.length} />
            <TabButton active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} icon={Megaphone} label={t('cms.tab_announcements')} count={announcements.length} />
            <TabButton active={activeTab === 'templates'} onClick={() => setActiveTab('templates')} icon={Mail} label={t('cms.tab_templates')} count={templates.length} />
          </div>
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text" placeholder={t('cms.search_placeholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-6 py-3 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-500 font-medium focus:ring-2 focus:ring-[#00575A]/20 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4 pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'banners' && <BannersTabPanel banners={filteredData.banners} t={t} setEditingBanner={setEditingBanner} handleDeleteBanner={handleDeleteBanner} />}
          {activeTab === 'announcements' && <AnnouncementsTabPanel announcements={filteredData.announcements} t={t} setEditingAnnouncement={setEditingAnnouncement} handleToggleAnnouncementStatus={handleToggleAnnouncementStatus} handleDeleteAnnouncement={handleDeleteAnnouncement} />}
          {activeTab === 'templates' && <TemplatesTabPanel templates={filteredData.templates} />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default CMS;
