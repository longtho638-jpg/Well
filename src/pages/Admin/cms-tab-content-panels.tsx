/**
 * CMS Tab Content Panels — Banners, Announcements, Templates tab views.
 * Extracted from CMS.tsx to keep main page under 200 LOC.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Edit2, Clock, Globe, Smartphone, Mail, MessageSquare, ImageIcon, Bell } from 'lucide-react';
import type { Banner, Announcement } from '@/hooks/useCMS';

// ─── Status Badge ────────────────────────────────────────────

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

// ─── Banners Tab ─────────────────────────────────────────────

interface BannersTabProps {
  banners: Banner[];
  t: (key: string) => string;
  setEditingBanner: (b: Banner) => void;
  handleDeleteBanner: (id: string) => void;
}

export const BannersTabPanel: React.FC<BannersTabProps> = ({ banners, t, setEditingBanner, handleDeleteBanner }) => (
  <motion.div key="banners" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
    {banners.map((banner) => (
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
                  {t('cms.loc')}{banner.location}
                </span>
              </div>
              <p className="text-sm font-medium text-zinc-500">"{banner.subtitle}"</p>
              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                <span>{t('cms.action')}{banner.ctaText}</span>
                <span>{t('cms.link')}{banner.ctaLink}</span>
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
);

// ─── Announcements Tab ───────────────────────────────────────

interface AnnouncementsTabProps {
  announcements: Announcement[];
  t: (key: string) => string;
  setEditingAnnouncement: (a: Announcement) => void;
  handleToggleAnnouncementStatus: (id: string) => void;
  handleDeleteAnnouncement: (id: string) => void;
}

export const AnnouncementsTabPanel: React.FC<AnnouncementsTabProps> = ({
  announcements, t, setEditingAnnouncement, handleToggleAnnouncementStatus, handleDeleteAnnouncement,
}) => (
  <motion.div key="announcements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
    {announcements.map((ann) => (
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
                  <span className="flex items-center gap-1.5"><Globe size={11} /> {t('cms.target')}{ann.target}</span>
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
              {ann.status === 'active' ? t('cms.archive') : t('cms.enable')}
            </button>
            <button onClick={() => handleDeleteAnnouncement(ann.id)} className="p-3 text-zinc-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
          </div>
        </div>
      </div>
    ))}
  </motion.div>
);

// ─── Templates Tab ───────────────────────────────────────────

interface Template {
  id: string;
  name: string;
  channel: string;
  subject: string;
  variables: string[];
}

interface TemplatesTabProps {
  templates: Template[];
}

export const TemplatesTabPanel: React.FC<TemplatesTabProps> = ({ templates }) => (
  <motion.div key="templates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
    {templates.map((template) => (
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
          <button aria-label="Edit template" className="p-4 bg-zinc-100 dark:bg-zinc-800 rounded-2xl text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-all"><Edit2 size={18} /></button>
        </div>
      </div>
    ))}
  </motion.div>
);
