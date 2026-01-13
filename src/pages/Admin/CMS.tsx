/**
 * Admin CMS - Content Management System (Refactored)
 * Phase 3: High-Performance Content Orchestration for VC/IPO readiness.
 */

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Eye,
  FileText,
  Image as ImageIcon,
  Bell,
  Megaphone,
  Calendar,
  Plus,
  Trash2,
  Edit2,
  CheckCircle,
  Clock,
  Globe,
  Smartphone,
  Mail,
  Search,
  RefreshCw,
  X,
  MessageSquare,
} from 'lucide-react';

// Hooks & Types
import { useCMS, Banner, Announcement, NotificationTemplate } from '@/hooks/useCMS';

// ============================================================
// SUB-COMPONENTS
// ============================================================

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
      <span className={`px-2 py-0.5 rounded-lg border ${active ? 'bg-white/10 border-white/20' : 'bg-zinc-200 dark:bg-zinc-700 border-zinc-300 dark:border-white/5'
        }`}>
        {count}
      </span>
    )}
  </button>
);

const StatusBadge: React.FC<{ status: Banner['status'] | Announcement['status'] }> = ({ status }) => {
  const config = {
    active: { className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20', label: 'LIVE' },
    draft: { className: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20', label: 'DRAFT' },
    scheduled: { className: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20', label: 'QUEUE' },
  };
  const { className, label } = config[status];
  return (
    <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest border rounded-[2rem] ${className}`}>
      {label}
    </span>
  );
};

// ============================================================
// MAIN PAGE
// ============================================================

const CMS: React.FC = () => {
  const {
    activeTab,
    setActiveTab,
    filteredData,
    searchQuery,
    setSearchQuery,
    editingBanner,
    setEditingBanner,
    editingAnnouncement,
    setEditingAnnouncement,
    stats,
    refresh,
    handleSaveBanner,
    handleDeleteBanner,
    handleToggleAnnouncementStatus,
    handleSaveAnnouncement,
    handleDeleteAnnouncement,
    banners, announcements, templates
  } = useCMS();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter">Content Orchestrator</h2>
          <p className="text-zinc-500 font-medium text-lg mt-1">Cross-platform content delivery & notification governance.</p>
        </div>
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={refresh}
            className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 rounded-2xl shadow-sm text-zinc-500"
          >
            <RefreshCw className="w-5 h-5" />
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              if (activeTab === 'banners') setEditingBanner({ id: '', title: '', subtitle: '', ctaText: '', ctaLink: '', imageUrl: '', location: 'promotion', status: 'draft' });
              else if (activeTab === 'announcements') setEditingAnnouncement({ id: '', title: '', message: '', type: 'info', target: 'all', status: 'draft', createdAt: new Date().toISOString() });
            }}
            className="flex items-center gap-3 bg-[#00575A] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#004447] transition-all shadow-xl shadow-teal-500/20"
          >
            <Plus size={20} />
            CREATE {activeTab.slice(0, -1)}
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Content Banners', value: banners.length, icon: ImageIcon, color: 'text-blue-500' },
          { label: 'Live Banners', value: stats.activeBanners, icon: CheckCircle, color: 'text-emerald-500' },
          { label: 'Broadcasts', value: announcements.length, icon: Megaphone, color: 'text-amber-500' },
          { label: 'Total Templates', value: templates.length, icon: Mail, color: 'text-purple-500' },
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
            <TabButton active={activeTab === 'banners'} onClick={() => setActiveTab('banners')} icon={ImageIcon} label="Banners" count={banners.length} />
            <TabButton active={activeTab === 'announcements'} onClick={() => setActiveTab('announcements')} icon={Megaphone} label="Announcements" count={announcements.length} />
            <TabButton active={activeTab === 'templates'} onClick={() => setActiveTab('templates')} icon={Mail} label="Templates" count={templates.length} />
          </div>

          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-6 py-3 bg-zinc-100 dark:bg-zinc-800 border-none rounded-2xl text-zinc-900 dark:text-white placeholder:text-zinc-500 font-medium focus:ring-2 focus:ring-[#00575A]/20 transition-all text-sm"
            />
          </div>
        </div>
      </div>

      {/* Final Content List */}
      <div className="space-y-4 pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'banners' && (
            <motion.div key="banners" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              {filteredData.banners.map((banner) => (
                <div key={banner.id} className="p-6 bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5 rounded-3xl hover:border-emerald-500/30 transition-all group">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex gap-6">
                      <div className="w-24 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl overflow-hidden border border-zinc-200 dark:border-white/5 flex items-center justify-center text-zinc-400">
                        <ImageIcon size={24} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{banner.title}</h3>
                          <StatusBadge status={banner.status} />
                          <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg">
                            LOC: {banner.location}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-zinc-500">"{banner.subtitle}"</p>
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                          <span>ACTION: {banner.ctaText}</span>
                          <span>LINK: {banner.ctaLink}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setEditingBanner(banner)} className="p-3 text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDeleteBanner(banner.id)} className="p-3 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'announcements' && (
            <motion.div key="announcements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              {filteredData.announcements.map((ann) => (
                <div key={ann.id} className="p-6 bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5 rounded-3xl hover:border-amber-500/30 transition-all group">
                  <div className="flex items-start justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl border ${ann.type === 'warning' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          ann.type === 'promo' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            'bg-blue-500/10 text-blue-500 border-blue-500/20'
                          }`}>
                          <Bell size={18} />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-black text-zinc-900 dark:text-white tracking-tight">{ann.title}</h3>
                            <StatusBadge status={ann.status} />
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            <span className="flex items-center gap-1.5"><Globe size={11} /> TARGET: {ann.target}</span>
                            <span className="flex items-center gap-1.5"><Clock size={11} /> {new Date(ann.createdAt).toLocaleDateString('vi-VN')}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-zinc-500 text-sm leading-relaxed font-medium pl-14">{ann.message}</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button onClick={() => setEditingAnnouncement(ann)} className="p-3 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-xl transition-all"><Edit2 size={16} /></button>
                      <button onClick={() => handleToggleAnnouncementStatus(ann.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${ann.status === 'active' ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white' : 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 font-black'
                        }`}>
                        {ann.status === 'active' ? 'Archive' : 'Enable'}
                      </button>
                      <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-3 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'templates' && (
            <motion.div key="templates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              {filteredData.templates.map((template) => (
                <div key={template.id} className="p-6 bg-white dark:bg-zinc-900/50 border border-zinc-100 dark:border-white/5 rounded-3xl hover:border-purple-500/30 transition-all">
                  <div className="flex items-center justify-between gap-6">
                    <div className="flex gap-6">
                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-zinc-500">
                        {template.channel === 'email' ? <Mail size={24} /> : template.channel === 'push' ? <Smartphone size={24} /> : <MessageSquare size={24} />}
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-lg font-black text-zinc-900 dark:text-white">{template.name}</h3>
                          <span className="px-3 py-1 text-[9px] font-black uppercase tracking-widest bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-lg">{template.channel}</span>
                        </div>
                        <p className="text-zinc-500 text-xs font-mono">[{template.subject}]</p>
                        <div className="flex gap-2">
                          {template.variables.map(v => (
                            <span key={v} className="px-2 py-0.5 text-[9px] font-black bg-blue-500/5 text-blue-500 border border-blue-500/10 rounded uppercase tracking-tighter">
                              {`{${v}}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"><Edit2 size={18} /></button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals for editing would go here (same pattern as before but simplified/modularized) */}
    </motion.div>
  );
};

export default CMS;
