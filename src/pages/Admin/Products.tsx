import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Edit2, Save, X, TrendingUp, DollarSign, Info } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatVND, formatNumber } from '@/utils/format';
import { adminLogger } from '@/utils/logger';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    bonus_revenue: number;
    commission_rate: number;
    image_url: string;
    sales_count: number;
    stock: number;
}

const AdminProducts: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Product>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .order('sales_count', { ascending: false });

        if (error) {
            adminLogger.error('Failed to load products', error);
        } else {
            setProducts(data || []);
        }
        setLoading(false);
    };

    const handleEdit = (product: Product) => {
        setEditingId(product.id);
        setEditForm(product);
    };

    const handleSave = async () => {
        if (!editingId || !editForm) return;

        const { error } = await supabase
            .from('products')
            .update({
                name: editForm.name,
                description: editForm.description,
                price: editForm.price,
                bonus_revenue: editForm.bonus_revenue,
                stock: editForm.stock,
            })
            .eq('id', editingId);

        if (error) {
            adminLogger.error('Failed to update product', error);
        } else {
            setEditingId(null);
            fetchProducts();
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const calculateCommission = (bonusRevenue: number, rate: number = 0.21) => {
        return bonusRevenue * rate;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00575A]"></div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
        >
            {/* Page Header */}
            <div>
                <h2 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
                    <Package className="w-8 h-8 text-[#00575A]" />
                    Product Management
                </h2>
                <p className="text-slate-500 mt-1">
                    Manage product pricing and bonus revenue (DTTT)
                </p>
            </div>

            {/* Info Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                <div className="text-sm text-blue-900">
                    <strong>Bonus Revenue (DTTT)</strong> is the amount used to calculate commissions.
                    <br />
                    • Member: 21% of DTTT | Startup/Partner: 25% of DTTT
                </div>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 gap-6">
                {products.map((product) => {
                    const isEditing = editingId === product.id;
                    const displayProduct = isEditing ? editForm : product;
                    const bonusRevenue = displayProduct.bonus_revenue || 0;
                    const memberCommission = calculateCommission(bonusRevenue, 0.21);
                    const startupCommission = calculateCommission(bonusRevenue, 0.25);

                    return (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-slate-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
                                {/* Product Image & Info */}
                                <div className="flex items-start gap-4">
                                    <img
                                        src={product.image_url}
                                        alt={product.name}
                                        className="w-24 h-24 rounded-lg object-cover shrink-0"
                                    />
                                    <div className="flex-1">
                                        {isEditing ? (
                                            <input
                                                type="text"
                                                value={displayProduct.name || ''}
                                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg font-bold text-lg mb-2"
                                            />
                                        ) : (
                                            <h3 className="font-bold text-lg text-slate-900">{product.name}</h3>
                                        )}
                                        <p className="text-sm text-slate-500">ID: {product.id}</p>
                                        <div className="flex items-center gap-4 mt-2 text-sm">
                                            <span className="text-slate-600">Sales: {product.sales_count}</span>
                                            <span className="text-slate-600">Stock: {product.stock}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs text-slate-500 uppercase tracking-wide block mb-1">
                                            Retail Price
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={displayProduct.price || 0}
                                                onChange={(e) => setEditForm({ ...editForm, price: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                                            />
                                        ) : (
                                            <div className="text-xl font-bold text-slate-900">
                                                {formatVND(product.price)}
                                            </div>
                                        )}
                                    </div>

                                    <div>
                                        <label className="text-xs text-[#00575A] uppercase tracking-wide block mb-1 font-medium">
                                            💎 Bonus Revenue (DTTT)
                                        </label>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                value={displayProduct.bonus_revenue || 0}
                                                onChange={(e) => setEditForm({ ...editForm, bonus_revenue: parseInt(e.target.value) })}
                                                className="w-full px-3 py-2 border border-[#00575A] rounded-lg focus:ring-2 focus:ring-[#00575A]"
                                                placeholder="Enter DTTT amount"
                                            />
                                        ) : (
                                            <div className="text-xl font-bold text-[#00575A]">
                                                {formatVND(bonusRevenue)}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Commission Preview */}
                                <div className="space-y-3">
                                    <div className="bg-slate-50 rounded-lg p-4">
                                        <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">
                                            Commission Preview
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">Member (21%):</span>
                                                <span className="font-bold text-slate-900">
                                                    {formatVND(memberCommission)}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-slate-600">Startup (25%):</span>
                                                <span className="font-bold text-[#00575A]">
                                                    {formatVND(startupCommission)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={handleSave}
                                                    className="flex-1 px-4 py-2 bg-[#00575A] text-white rounded-lg hover:bg-[#004447] transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                                Edit
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {products.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                    No products found
                </div>
            )}
        </motion.div>
    );
};

export default AdminProducts;
