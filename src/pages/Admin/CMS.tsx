/**
 * Admin CMS - Content Management System
 * Phase 3: Admin Pages Enhancement
 * 
 * Full content management for VC/IPO readiness:
 * - Banner management (hero, promotions)
 * - Notification templates
 * - Announcement system
 * - Content scheduling
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Eye,
  FileText,
  Image,
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
  MessageSquare,
  Search,
  RefreshCw,
  X,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

// ============================================================
// TYPES
// ============================================================

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  imageUrl: string;
  location: 'hero' | 'promotion' | 'popup';
  status: 'active' | 'draft' | 'scheduled';
  scheduledAt?: string;
}

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'promo';
  target: 'all' | 'partners' | 'admins';
  status: 'active' | 'draft';
  createdAt: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  channel: 'email' | 'push' | 'sms';
  subject: string;
  body: string;
  variables: string[];
}

// ============================================================
// MOCK DATA
// ============================================================

const MOCK_BANNERS: Banner[] = [
  {
    id: 'B001',
    title: 'Vững Tin Vươn Tầm',
    subtitle: 'Hệ sinh thái kinh doanh sức khỏe 4.0',
    ctaText: 'Tham gia Founders Club',
    ctaLink: '/signup',
    imageUrl: '',
    location: 'hero',
    status: 'active',
  },
  {
    id: 'B002',
    title: 'Ưu đãi Tháng 1',
    subtitle: 'Giảm 20% cho đơn hàng đầu tiên',
    ctaText: 'Mua Ngay',
    ctaLink: '/marketplace',
    imageUrl: '',
    location: 'promotion',
    status: 'active',
  },
];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'A001',
    title: 'Bảo trì hệ thống',
    message: 'Hệ thống sẽ bảo trì từ 2:00 - 4:00 sáng ngày 15/01/2026',
    type: 'warning',
    target: 'all',
    status: 'active',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'A002',
    title: 'Chương trình thưởng mới',
    message: 'Nhận thưởng x2 điểm trong tuần lễ hội!',
    type: 'promo',
    target: 'partners',
    status: 'draft',
    createdAt: new Date().toISOString(),
  },
];

const MOCK_TEMPLATES: NotificationTemplate[] = [
  {
    id: 'T001',
    name: 'Welcome Email',
    channel: 'email',
    subject: 'Chào mừng {{name}} đến với WellNexus!',
    body: 'Kính chào {{name}},\n\nCảm ơn bạn đã gia nhập WellNexus...',
    variables: ['name', 'email', 'joinDate'],
  },
  {
    id: 'T002',
    name: 'Order Confirmed',
    channel: 'push',
    subject: 'Đơn hàng #{{orderId}} đã được xác nhận',
    body: 'Đơn hàng của bạn trị giá {{amount}} đã được xác nhận.',
    variables: ['orderId', 'amount', 'productName'],
  },
];

// ============================================================
// COMPONENTS
// ============================================================

const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}> = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${active
      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
      : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
      }`}
  >
    {icon}
    {label}
    {count !== undefined && (
      <span className={`px-2 py-0.5 text-xs rounded-full ${active ? 'bg-emerald-500/20' : 'bg-zinc-800'
        }`}>
        {count}
      </span>
    )}
  </button>
);

const StatusBadge: React.FC<{ status: Banner['status'] | Announcement['status'] }> = ({ status }) => {
  const config = {
    active: { className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', label: 'Active' },
    draft: { className: 'bg-zinc-800 text-zinc-400 border-zinc-700', label: 'Draft' },
    scheduled: { className: 'bg-blue-500/10 text-blue-400 border-blue-500/20', label: 'Scheduled' },
  };
  const { className, label } = config[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-full ${className}`}>
      {label}
    </span>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const CMS: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<'banners' | 'announcements' | 'templates'>('banners');
  const [banners, setBanners] = useState<Banner[]>(MOCK_BANNERS);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [templates, setTemplates] = useState<NotificationTemplate[]>(MOCK_TEMPLATES);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

  const handleSaveBanner = (banner: Banner) => {
    if (editingBanner) {
      setBanners(prev => prev.map(b => b.id === banner.id ? banner : b));
    } else {
      setBanners(prev => [...prev, { ...banner, id: `B${Date.now()}` }]);
    }
    setEditingBanner(null);
    showToast('Banner saved successfully!', 'success');
  };

  const handleDeleteBanner = (id: string) => {
    setBanners(prev => prev.filter(b => b.id !== id));
    showToast('Banner deleted', 'success');
  };

  const handleToggleAnnouncementStatus = (id: string) => {
    setAnnouncements(prev => prev.map(a => {
      if (a.id === id) {
        return { ...a, status: a.status === 'active' ? 'draft' : 'active' };
      }
      return a;
    }));
    showToast('Announcement status updated', 'success');
  };

  const handleAddAnnouncement = () => {
    setEditingAnnouncement({
      id: '',
      title: '',
      message: '',
      type: 'info',
      target: 'all',
      status: 'draft',
      createdAt: new Date().toISOString(),
    });
  };

  const handleSaveAnnouncement = (announcement: Announcement) => {
    if (editingAnnouncement?.id) {
      setAnnouncements(prev => prev.map(a => a.id === announcement.id ? announcement : a));
    } else {
      setAnnouncements(prev => [...prev, { ...announcement, id: `A${Date.now()}` }]);
    }
    setEditingAnnouncement(null);
    showToast('Announcement saved!', 'success');
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    setAnnouncements(prev => prev.filter(a => a.id !== id));
    showToast('Announcement deleted', 'info');
  };

  // Filter based on search
  const filteredBanners = banners.filter(b =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.subtitle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAnnouncements = announcements.filter(a =>
    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTemplates = templates.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Stats
  const activeBanners = banners.filter(b => b.status === 'active').length;
  const activeAnnouncements = announcements.filter(a => a.status === 'active').length;

  const handleRefresh = () => {
    // Reset to mock data (simulate refresh)
    setBanners(MOCK_BANNERS);
    setAnnouncements(MOCK_ANNOUNCEMENTS);
    setTemplates(MOCK_TEMPLATES);
    showToast('Content refreshed', 'success');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100">Content Management</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage banners, announcements, and notification templates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
            title="Refresh content"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              if (activeTab === 'banners') {
                setEditingBanner({
                  id: '',
                  title: '',
                  subtitle: '',
                  ctaText: '',
                  ctaLink: '',
                  imageUrl: '',
                  location: 'promotion',
                  status: 'draft',
                });
              } else if (activeTab === 'announcements') {
                handleAddAnnouncement();
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add {activeTab === 'banners' ? 'Banner' : activeTab === 'announcements' ? 'Announcement' : 'Template'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-3">
            <Image className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-xs text-zinc-500">Total Banners</p>
              <p className="text-xl font-bold text-zinc-100">{banners.length}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <div>
              <p className="text-xs text-zinc-500">Active Banners</p>
              <p className="text-xl font-bold text-emerald-400">{activeBanners}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-3">
            <Megaphone className="w-5 h-5 text-amber-400" />
            <div>
              <p className="text-xs text-zinc-500">Announcements</p>
              <p className="text-xl font-bold text-zinc-100">{announcements.length}</p>
            </div>
          </div>
        </div>
        <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-purple-400" />
            <div>
              <p className="text-xs text-zinc-500">Templates</p>
              <p className="text-xl font-bold text-zinc-100">{templates.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
        <input
          type="text"
          placeholder="Search content..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-4">
        <TabButton
          active={activeTab === 'banners'}
          onClick={() => setActiveTab('banners')}
          icon={<Image className="w-4 h-4" />}
          label="Banners"
          count={banners.length}
        />
        <TabButton
          active={activeTab === 'announcements'}
          onClick={() => setActiveTab('announcements')}
          icon={<Megaphone className="w-4 h-4" />}
          label="Announcements"
          count={announcements.length}
        />
        <TabButton
          active={activeTab === 'templates'}
          onClick={() => setActiveTab('templates')}
          icon={<Mail className="w-4 h-4" />}
          label="Templates"
          count={templates.length}
        />
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'banners' && (
          <motion.div
            key="banners"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {filteredBanners.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <Image className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No banners found</p>
              </div>
            ) : filteredBanners.map((banner) => (
              <div
                key={banner.id}
                className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-zinc-100">{banner.title}</h3>
                      <StatusBadge status={banner.status} />
                      <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded">
                        {banner.location}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">{banner.subtitle}</p>
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      <span>CTA: {banner.ctaText}</span>
                      <span>→ {banner.ctaLink}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingBanner(banner)}
                      className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteBanner(banner.id)}
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'announcements' && (
          <motion.div
            key="announcements"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {filteredAnnouncements.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <Megaphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No announcements found</p>
              </div>
            ) : filteredAnnouncements.map((announcement) => (
              <div
                key={announcement.id}
                className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Bell className={`w-5 h-5 ${announcement.type === 'warning' ? 'text-amber-400' :
                        announcement.type === 'promo' ? 'text-emerald-400' :
                          announcement.type === 'success' ? 'text-blue-400' : 'text-zinc-400'
                        }`} />
                      <h3 className="text-lg font-bold text-zinc-100">{announcement.title}</h3>
                      <StatusBadge status={announcement.status} />
                    </div>
                    <p className="text-sm text-zinc-400 mb-2">{announcement.message}</p>
                    <div className="flex items-center gap-4 text-sm text-zinc-500">
                      <span className="flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        Target: {announcement.target}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(announcement.createdAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingAnnouncement(announcement)}
                      className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleToggleAnnouncementStatus(announcement.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${announcement.status === 'active'
                        ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                        }`}
                    >
                      {announcement.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteAnnouncement(announcement.id)}
                      className="p-2 text-zinc-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {activeTab === 'templates' && (
          <motion.div
            key="templates"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {filteredTemplates.length === 0 ? (
              <div className="p-8 text-center text-zinc-500">
                <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No templates found</p>
              </div>
            ) : filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {template.channel === 'email' ? (
                        <Mail className="w-5 h-5 text-blue-400" />
                      ) : template.channel === 'push' ? (
                        <Smartphone className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <MessageSquare className="w-5 h-5 text-amber-400" />
                      )}
                      <h3 className="text-lg font-bold text-zinc-100">{template.name}</h3>
                      <span className="px-2 py-0.5 text-xs bg-zinc-800 text-zinc-400 rounded uppercase">
                        {template.channel}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-300 font-mono mb-2">{template.subject}</p>
                    <div className="flex items-center gap-2">
                      {template.variables.map((v) => (
                        <span key={v} className="px-2 py-0.5 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded">
                          {`{{${v}}}`}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Banner Modal */}
      <AnimatePresence>
        {editingBanner && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setEditingBanner(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-lg w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold text-zinc-100 mb-4">
                {editingBanner.id ? 'Edit Banner' : 'New Banner'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Title</label>
                  <input
                    type="text"
                    value={editingBanner.title}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Banner title..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Subtitle</label>
                  <input
                    type="text"
                    value={editingBanner.subtitle}
                    onChange={(e) => setEditingBanner({ ...editingBanner, subtitle: e.target.value })}
                    className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Banner subtitle..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">CTA Text</label>
                    <input
                      type="text"
                      value={editingBanner.ctaText}
                      onChange={(e) => setEditingBanner({ ...editingBanner, ctaText: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="Button text..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">CTA Link</label>
                    <input
                      type="text"
                      value={editingBanner.ctaLink}
                      onChange={(e) => setEditingBanner({ ...editingBanner, ctaLink: e.target.value })}
                      className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                      placeholder="/path..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Location</label>
                    <select
                      value={editingBanner.location}
                      onChange={(e) => setEditingBanner({ ...editingBanner, location: e.target.value as Banner['location'] })}
                      className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="hero">Hero Section</option>
                      <option value="promotion">Promotion Bar</option>
                      <option value="popup">Popup Modal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Status</label>
                    <select
                      value={editingBanner.status}
                      onChange={(e) => setEditingBanner({ ...editingBanner, status: e.target.value as Banner['status'] })}
                      className="w-full bg-zinc-800 border border-zinc-700 text-zinc-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="scheduled">Scheduled</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setEditingBanner(null)}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSaveBanner(editingBanner)}
                  className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Save Banner
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default CMS;
