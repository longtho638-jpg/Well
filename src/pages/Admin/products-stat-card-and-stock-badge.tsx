/**
 * Products Stat Card, Stock Badge, and Product List Item — sub-components for admin product catalog page
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Trash2 } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { Product } from '@/services/productService';
import { formatVND } from '@/utils/format';

interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon: Icon, color }) => (
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

export const StockBadge: React.FC<{ stock: number }> = ({ stock }) => {
  const { t } = useTranslation();

  if (stock === 0) return (
    <span className="px-3 py-1 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
      {t('products.out_of_stock')}
    </span>
  );

  if (stock < 10) return (
    <span className="px-3 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
      {t('products.low_stock')}{stock})
    </span>
  );

  return (
    <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase tracking-widest">
      {t('products.in_stock')}{stock})
    </span>
  );
};

interface ProductListItemProps {
  p: Product;
  isEditing: boolean;
  editForm: Partial<Product>;
  setEditForm: (form: Partial<Product>) => void;
  onSave: () => void;
  onEdit: (p: Product) => void;
  onCancel: () => void;
  onDelete: (id: string, name: string) => void;
}

export const ProductListItem: React.FC<ProductListItemProps> = ({
  p, isEditing, editForm, setEditForm, onSave, onEdit, onCancel, onDelete,
}) => {
  const { t } = useTranslation();
  const data = isEditing ? editForm as Product : p;
  const memberComm = (data.bonus_revenue || 0) * 0.21;
  const partnerComm = (data.bonus_revenue || 0) * 0.25;

  return (
    <motion.div
      key={p.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-white dark:bg-zinc-900/50 border rounded-[2.5rem] p-8 transition-all hover:shadow-2xl hover:shadow-zinc-500/5 ${isEditing ? 'border-[#00575A] ring-4 ring-[#00575A]/5' : 'border-zinc-100 dark:border-white/5'}`}
    >
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-10">
        <div className="flex gap-6 col-span-1 xl:col-span-2">
          <div className="w-32 h-32 bg-zinc-100 dark:bg-zinc-800 rounded-3xl overflow-hidden border border-zinc-200 dark:border-white/5 shrink-0 shadow-inner">
            {p.image_url ? <img src={p.image_url} alt={p.name} loading="lazy" className="w-full h-full object-cover" /> : <ImageIcon size={32} className="text-zinc-400 m-12" />}
          </div>
          <div className="space-y-4">
            <div>
              {isEditing ? (
                <input type="text" value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-xl text-xl font-black w-full outline-none border border-[#00575A]/20" />
              ) : (
                <h3 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{p.name}</h3>
              )}
              <div className="flex items-center gap-3 mt-2">
                <StockBadge stock={p.stock} />
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{t('products.sku')}{p.id.slice(0, 8)}</span>
              </div>
            </div>
            {isEditing ? (
              <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-xl text-sm w-full outline-none border border-white/5" rows={2} />
            ) : (
              <p className="text-sm text-zinc-500 font-medium line-clamp-2 italic">"{p.description}"</p>
            )}
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{t('products.retail_msrp')}</label>
            {isEditing ? (
              <input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: Number(e.target.value) })} className="bg-zinc-50 dark:bg-zinc-800 px-4 py-2 rounded-xl text-lg font-black w-full outline-none" />
            ) : (
              <p className="text-2xl font-black text-zinc-900 dark:text-white tracking-widest">{formatVND(p.price)}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[#00575A] uppercase tracking-widest">{t('products.dttt_basis')}</label>
            {isEditing ? (
              <input type="number" value={editForm.bonus_revenue} onChange={(e) => setEditForm({ ...editForm, bonus_revenue: Number(e.target.value) })} className="bg-emerald-500/5 dark:bg-emerald-500/10 px-4 py-2 rounded-xl text-lg font-black w-full outline-none text-[#00575A] border border-[#00575A]/20" />
            ) : (
              <p className="text-2xl font-black text-[#00575A] tracking-widest">{formatVND(p.bonus_revenue)}</p>
            )}
          </div>
        </div>
        <div className="flex flex-col justify-between">
          <div className="bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-3xl border border-zinc-100 dark:border-white/5 space-y-2">
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-400">
              <span>{t('products.member_comm')}</span><span className="text-zinc-700 dark:text-zinc-200">{formatVND(memberComm)}</span>
            </div>
            <div className="flex justify-between items-center text-[10px] font-black uppercase text-[#00575A]">
              <span>{t('products.partner_comm')}</span><span className="font-black">{formatVND(partnerComm)}</span>
            </div>
          </div>
          <div className="flex gap-2 mt-6">
            {isEditing ? (
              <>
                <button onClick={onSave} className="flex-1 bg-[#00575A] text-white py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-teal-500/20">{t('products.commit')}</button>
                <button onClick={onCancel} className="px-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px]">{t('products.esc')}</button>
              </>
            ) : (
              <>
                <button onClick={() => onEdit(p)} className="flex-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] border border-zinc-200 dark:border-white/5 hover:bg-zinc-200 transition-all">{t('products.edit_config')}</button>
                <button onClick={() => onDelete(p.id, p.name)} aria-label={t('common.delete')} className="p-3 bg-rose-500/5 text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all border border-rose-500/10"><Trash2 size={16} /></button>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
