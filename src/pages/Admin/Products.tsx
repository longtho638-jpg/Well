/**
 * Admin Products Management (Refactored)
 * Global product catalog and financial parameter (DTTT) control.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package,
    Edit2,
    Save,
    X,
    DollarSign,
    Plus,
    Trash2,
    Search,
    RefreshCw,
    AlertTriangle,
    Image as ImageIcon,
    Check,
    Loader2,
    TrendingUp,
    ShieldCheck,
    Info
} from 'lucide-react';

// Hooks & Services
import { useProducts } from '@/hooks/useProducts';
import { Product, NewProductDto } from '@/services/productService';
import { formatVND } from '@/utils/format';
import { useTranslation } from '@/hooks';

// ============================================================
// SUB-COMPONENTS
// ============================================================

const StatCard: React.FC<{ label: string; value: number; icon: React.ElementType; color: string }> = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 p-6 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-xl border ${color}`}>
                <Icon size={18} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{label}</p>
        </div>
        <p className="text-3xl font-black text-zinc-900 dark:text-white tracking-tighter">{value}</p>
    </div>
);

const StockBadge: React.FC<{ stock: number }> = ({ stock }) => {
    const { t } = useTranslation();
    if (stock === 0) return (
        <span className="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">{t('products.out_of_stock')}</span>
    );
    if (stock < 10) return (
        <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">{t('products.low_stock')}{stock})</span>
    );
    return (
        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">{t('products.in_stock')}{stock})</span>
    );
};

// ============================================================
// MAIN PAGE
// ============================================================

const AdminProducts: React.FC = () => {
    const { t } = useTranslation();
    const {
        loading,
        actionLoading,
        searchQuery,
        setSearchQuery,
        filteredProducts,
        stats,
        refresh,
        handleUpdate,
        handleCreate,
        handleDelete
    } = useProducts();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Product>>({});
    const [showAddModal, setShowAddModal] = useState(false);

    const onEdit = (p: Product) => {
        setEditingId(p.id);
        setEditForm(p);
    };

    const onSave = async () => {
        if (!editingId) return;
        const success = await handleUpdate(editingId, editForm);
        if (success) setEditingId(null);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10 max-w-7xl mx-auto pb-24"
        >
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <h2 className="text-4xl font-black text-zinc-900 dark:text-white tracking-tighter uppercase italic flex items-center gap-3">
                        <Package className="text-[#00575A] w-10 h-10" />
                        {t('products.global_catalog')}</h2>
                    <p className="text-zinc-500 font-medium text-lg">{t('products.inventory_management_dttt_st')}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={refresh} className="p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl shadow-sm text-zinc-500">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-3 bg-[#00575A] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest hover:bg-[#004447] transition-all shadow-xl shadow-teal-500/20"
                    >
                        <Plus size={20} />
                        {t('products.add_product')}</button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard label="Total Inventory" value={stats.total} icon={Package} color="bg-blue-500/10 text-blue-500 border-blue-500/20" />
                <StatCard label="Low Stock Alert" value={stats.lowStock} icon={AlertTriangle} color="bg-amber-500/10 text-amber-500 border-amber-500/20" />
                <StatCard label="Depleted Units" value={stats.outOfStock} icon={TrendingUp} color="bg-rose-500/10 text-rose-500 border-rose-500/20" />
            </div>

            {/* DTTT Info Card */}
            <div className="bg-[#00575A]/5 border border-[#00575A]/20 p-6 rounded-[2rem] flex items-start gap-4">
                <div className="p-2 bg-[#00575A] text-white rounded-xl shadow-lg">
                    <ShieldCheck size={20} />
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00575A] mb-1">{t('products.dttt_commission_logic')}</h4>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">
                        {t('products.bonus_revenue_dttt_represent')}<span className="text-[#00575A] font-black ml-2 uppercase tracking-tighter">{t('products.member_21_startup_25')}</span>
                    </p>
                </div>
            </div>

            {/* Filter bar */}
            <div className="relative group max-w-2xl">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 group-focus-within:text-[#00575A] transition-colors" />
                <input
                    type="text"
                    placeholder="Search catalog by name or SKU..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-14 pr-6 py-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-[2rem] text-zinc-900 dark:text-white placeholder:text-zinc-500 font-bold focus:ring-4 focus:ring-[#00575A]/10 outline-none transition-all shadow-sm"
                />
            </div>

            {/* Products List */}
            <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                    {filteredProducts.map((p) => {
                        const { t } = useTranslation();
                        const isEditing = editingId === p.id;
                        const data = isEditing ? editForm as Product : p;
                        const memberComm = (data.bonus_revenue || 0) * 0.21;
                        const partnerComm = (data.bonus_revenue || 0) * 0.25;

                        return (
                            <motion.div
                                key={p.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`bg-white dark:bg-zinc-900/50 border rounded-[2.5rem] p-8 transition-all hover:shadow-2xl hover:shadow-zinc-500/5 ${isEditing ? 'border-[#00575A] ring-4 ring-[#00575A]/5' : 'border-zinc-100 dark:border-white/5'
                                    }`}
                            >
                                <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
                                    {/* Info */}
                                    <div className="flex gap-6 col-span-1 xl:col-span-2">
                                        <div className="w-32 h-32 bg-zinc-100 dark:bg-zinc-800 rounded-3xl overflow-hidden border border-zinc-200 dark:border-white/5 shrink-0 shadow-inner">
                                            {p.image_url ? <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" /> : <ImageIcon size={32} className="text-zinc-400 m-12" />}
                                        </div>
                                        <div className="space-y-4">
                                            <div>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editForm.name}
                                                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                        className="bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-xl text-xl font-black w-full outline-none border border-[#00575A]/20"
                                                    />
                                                ) : (
                                                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{p.name}</h3>
                                                )}
                                                <div className="flex items-center gap-3 mt-2">
                                                    <StockBadge stock={p.stock} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('products.sku')}{p.id.slice(0, 8)}</span>
                                                </div>
                                            </div>
                                            {isEditing ? (
                                                <textarea
                                                    value={editForm.description}
                                                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                    className="bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-xl text-sm w-full outline-none border border-white/5"
                                                    rows={2}
                                                />
                                            ) : (
                                                <p className="text-sm text-zinc-500 font-medium line-clamp-2 italic">"{p.description}"</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Pricing & DTTT */}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t('products.retail_msrp')}</label>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={editForm.price}
                                                    onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })}
                                                    className="bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-xl text-lg font-black w-full outline-none"
                                                />
                                            ) : (
                                                <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-widest">{formatVND(p.price)}</p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-[#00575A] uppercase tracking-widest">{t('products.dttt_basis')}</label>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    value={editForm.bonus_revenue}
                                                    onChange={(e) => setEditForm({ ...editForm, bonus_revenue: Number(e.target.value) })}
                                                    className="bg-emerald-500/5 dark:bg-emerald-500/10 px-4 py-2 rounded-xl text-lg font-black w-full outline-none text-[#00575A] border border-[#00575A]/20"
                                                />
                                            ) : (
                                                <p className="text-2xl font-black text-[#00575A] tracking-widest">{formatVND(p.bonus_revenue)}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Commission Preview & Actions */}
                                    <div className="flex flex-col justify-between">
                                        <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-3xl border border-zinc-100 dark:border-white/5 space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-400">
                                                <span>{t('products.member_comm')}</span>
                                                <span className="text-zinc-700 dark:text-zinc-200">{formatVND(memberComm)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase text-[#00575A]">
                                                <span>{t('products.partner_comm')}</span>
                                                <span className="font-black">{formatVND(partnerComm)}</span>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-6">
                                            {isEditing ? (
                                                <>
                                                    <button onClick={onSave} className="flex-1 bg-[#00575A] text-white py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-teal-500/20">{t('products.commit')}</button>
                                                    <button onClick={() => setEditingId(null)} className="px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px]">{t('products.esc')}</button>
                                                </>
                                            ) : (
                                                <>
                                                    <button onClick={() => onEdit(p)} className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-zinc-200 dark:border-white/5 hover:bg-zinc-200 transition-all">{t('products.edit_config')}</button>
                                                    <button onClick={() => handleDelete(p.id, p.name)} className="p-3 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all border border-rose-500/10"><Trash2 size={16} /></button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default AdminProducts;
