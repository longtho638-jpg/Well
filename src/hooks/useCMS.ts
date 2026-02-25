import { useState, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/Toast';

export interface Banner {
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

export interface Announcement {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'promo';
    target: 'all' | 'partners' | 'admins';
    status: 'active' | 'draft';
    createdAt: string;
}

export interface NotificationTemplate {
    id: string;
    name: string;
    channel: 'email' | 'push' | 'sms';
    subject: string;
    body: string;
    variables: string[];
}

const MOCK_BANNERS: Banner[] = [
    { id: 'B001', title: 'Vững Tin Vươn Tầm', subtitle: 'Hệ sinh thái kinh doanh sức khỏe 4.0', ctaText: 'Tham gia Founders Club', ctaLink: '/signup', imageUrl: '', location: 'hero', status: 'active' },
    { id: 'B002', title: 'Ưu đãi Tháng 1', subtitle: 'Giảm 20% cho đơn hàng đầu tiên', ctaText: 'Mua Ngay', ctaLink: '/marketplace', imageUrl: '', location: 'promotion', status: 'active' },
];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
    { id: 'A001', title: 'Bảo trì hệ thống', message: 'Hệ thống sẽ bảo trì từ 2:00 - 4:00 sáng ngày 15/01/2026', type: 'warning', target: 'all', status: 'active', createdAt: new Date().toISOString() },
    { id: 'A002', title: 'Chương trình thưởng mới', message: 'Nhận thưởng x2 điểm trong tuần lễ hội!', type: 'promo', target: 'partners', status: 'draft', createdAt: new Date().toISOString() },
];

const MOCK_TEMPLATES: NotificationTemplate[] = [
    { id: 'T001', name: 'Welcome Email', channel: 'email', subject: 'Chào mừng {{name}} đến với WellNexus!', body: 'Kính chào {{name}},\n\nCảm ơn bạn đã gia nhập WellNexus...', variables: ['name', 'email', 'joinDate'] },
    { id: 'T002', name: 'Order Confirmed', channel: 'push', subject: 'Đơn hàng #{{orderId}} đã được xác nhận', body: 'Đơn hàng của bạn trị giá {{amount}} đã được xác nhận.', variables: ['orderId', 'amount', 'productName'] },
];

export function useCMS() {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'banners' | 'announcements' | 'templates'>('banners');
    const [banners, setBanners] = useState<Banner[]>(import.meta.env.DEV ? MOCK_BANNERS : []);
    const [announcements, setAnnouncements] = useState<Announcement[]>(import.meta.env.DEV ? MOCK_ANNOUNCEMENTS : []);
    const [templates, setTemplates] = useState<NotificationTemplate[]>(import.meta.env.DEV ? MOCK_TEMPLATES : []);
    const [searchQuery, setSearchQuery] = useState('');
    const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
    const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);

    const handleSaveBanner = useCallback((banner: Banner) => {
        if (banner.id) {
            setBanners(prev => prev.map(b => b.id === banner.id ? banner : b));
        } else {
            setBanners(prev => [...prev, { ...banner, id: `B${Date.now()}` }]);
        }
        setEditingBanner(null);
        showToast('Banner saved successfully!', 'success');
    }, [showToast]);

    const handleDeleteBanner = useCallback((id: string) => {
        setBanners(prev => prev.filter(b => b.id !== id));
        showToast('Banner deleted', 'success');
    }, [showToast]);

    const handleToggleAnnouncementStatus = useCallback((id: string) => {
        setAnnouncements(prev => prev.map(a => {
            if (a.id === id) {
                return { ...a, status: a.status === 'active' ? 'draft' : 'active' };
            }
            return a;
        }));
        showToast('Announcement status updated', 'success');
    }, [showToast]);

    const handleSaveAnnouncement = useCallback((announcement: Announcement) => {
        if (announcement.id) {
            setAnnouncements(prev => prev.map(a => a.id === announcement.id ? announcement : a));
        } else {
            setAnnouncements(prev => [...prev, { ...announcement, id: `A${Date.now()}` }]);
        }
        setEditingAnnouncement(null);
        showToast('Announcement saved!', 'success');
    }, [showToast]);

    const handleDeleteAnnouncement = useCallback((id: string) => {
        if (!confirm('Delete this announcement?')) return;
        setAnnouncements(prev => prev.filter(a => a.id !== id));
        showToast('Announcement deleted', 'info');
    }, [showToast]);

    const filteredData = useMemo(() => {
        const query = searchQuery.toLowerCase();
        return {
            banners: banners.filter(b => b.title.toLowerCase().includes(query) || b.subtitle.toLowerCase().includes(query)),
            announcements: announcements.filter(a => a.title.toLowerCase().includes(query) || a.message.toLowerCase().includes(query)),
            templates: templates.filter(t => t.name.toLowerCase().includes(query) || t.subject.toLowerCase().includes(query))
        };
    }, [banners, announcements, templates, searchQuery]);

    const stats = useMemo(() => ({
        activeBanners: banners.filter(b => b.status === 'active').length,
        activeAnnouncements: announcements.filter(a => a.status === 'active').length
    }), [banners, announcements]);

    const refresh = useCallback(() => {
        if (import.meta.env.DEV) {
            setBanners(MOCK_BANNERS);
            setAnnouncements(MOCK_ANNOUNCEMENTS);
            setTemplates(MOCK_TEMPLATES);
        }
        showToast('Content refreshed', 'success');
    }, [showToast]);

    return {
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
        banners, announcements, templates // raw access for counts
    };
}
