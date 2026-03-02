/**
 * Admin Products Management (Refactored)
 * Global product catalog and financial parameter (DTTT) control.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Package, Plus, Search, RefreshCw, AlertTriangle, TrendingUp, ShieldCheck } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { Product } from '@/services/productService';
import { useTranslation } from '@/hooks';
import { StatCard, ProductListItem } from './products-stat-card-and-stock-badge';

// ============================================================
// MAIN PAGE
// ============================================================

const AdminProducts: React.FC = () => {
    const { t } = useTranslation();
    const {
        loading,
        searchQuery,
        setSearchQuery,
        filteredProducts,
        stats,
        refresh,
        handleUpdate,
        handleDelete
    } = useProducts();

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Product>>({});

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
                    <button onClick={refresh} aria-label="Refresh products" className="p-4 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 rounded-2xl shadow-sm text-zinc-500">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
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
                    {filteredProducts.map((p) => (
                        <ProductListItem
                            key={p.id}
                            p={p}
                            isEditing={editingId === p.id}
                            editForm={editForm}
                            setEditForm={setEditForm}
                            onSave={onSave}
                            onEdit={onEdit}
                            onCancel={() => setEditingId(null)}
                            onDelete={handleDelete}
                        />
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

export default AdminProducts;
