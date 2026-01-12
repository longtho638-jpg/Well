import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Package, Edit2, Save, X, TrendingUp, DollarSign, Info,
    Plus, Trash2, Search, RefreshCw, AlertTriangle, Eye,
    Image as ImageIcon, Check, Loader2
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatVND, formatNumber } from '@/utils/format';
import { adminLogger } from '@/utils/logger';
import { useToast } from '@/components/ui/Toast';

// ============================================================
// TYPES
// ============================================================

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
    category?: string;
    is_active?: boolean;
}

interface NewProduct {
    name: string;
    description: string;
    price: number;
    bonus_revenue: number;
    stock: number;
    image_url: string;
    category: string;
}

const defaultNewProduct: NewProduct = {
    name: '',
    description: '',
    price: 0,
    bonus_revenue: 0,
    stock: 0,
    image_url: '',
    category: 'supplement'
};

// ============================================================
// ADD PRODUCT MODAL
// ============================================================

const AddProductModal: React.FC<{
    onClose: () => void;
    onAdd: (product: NewProduct) => void;
    loading: boolean;
}> = ({ onClose, onAdd, loading }) => {
    const [form, setForm] = useState<NewProduct>(defaultNewProduct);
    const [imagePreview, setImagePreview] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onAdd(form);
    };

    const handleImageUrlChange = (url: string) => {
        setForm({ ...form, image_url: url });
        setImagePreview(url);
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="p-6 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-display font-bold text-slate-900 flex items-center gap-2">
                            <Plus className="w-6 h-6 text-[#00575A]" />
                            Add New Product
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Create a new product in the catalog</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Image Preview */}
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            <ImageIcon className="w-4 h-4 inline mr-2" />
                            Product Image
                        </label>
                        <div className="flex gap-4">
                            <div className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-white">
                                {imagePreview ? (
                                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-slate-300" />
                                )}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="url"
                                    placeholder="https://example.com/image.jpg"
                                    value={form.image_url}
                                    onChange={(e) => handleImageUrlChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A]"
                                />
                                <p className="text-xs text-slate-500 mt-1">Enter image URL for preview</p>
                            </div>
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Product Name *</label>
                        <input
                            type="text"
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            placeholder="e.g., ANIMA Premium 119"
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A]"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                            placeholder="Product description..."
                            rows={3}
                            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A]"
                        />
                    </div>

                    {/* Price Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Retail Price (VND) *</label>
                            <input
                                type="number"
                                required
                                min={0}
                                value={form.price}
                                onChange={(e) => setForm({ ...form, price: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#00575A] mb-1">
                                💎 Bonus Revenue (DTTT) *
                            </label>
                            <input
                                type="number"
                                required
                                min={0}
                                value={form.bonus_revenue}
                                onChange={(e) => setForm({ ...form, bonus_revenue: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-3 border border-[#00575A] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A]"
                            />
                        </div>
                    </div>

                    {/* Stock & Category */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Initial Stock</label>
                            <input
                                type="number"
                                min={0}
                                value={form.stock}
                                onChange={(e) => setForm({ ...form, stock: parseInt(e.target.value) || 0 })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A]"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                            <select
                                value={form.category}
                                onChange={(e) => setForm({ ...form, category: e.target.value })}
                                className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A]"
                            >
                                <option value="supplement">Supplement</option>
                                <option value="skincare">Skincare</option>
                                <option value="kit">Starter Kit</option>
                                <option value="bundle">Bundle</option>
                            </select>
                        </div>
                    </div>

                    {/* Commission Preview */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-green-800 mb-2">Commission Preview</h4>
                        <div className="flex gap-6 text-sm">
                            <div>
                                <span className="text-green-600">Member (21%):</span>{' '}
                                <span className="font-bold text-green-800">{formatVND(form.bonus_revenue * 0.21)}</span>
                            </div>
                            <div>
                                <span className="text-green-600">Startup (25%):</span>{' '}
                                <span className="font-bold text-green-800">{formatVND(form.bonus_revenue * 0.25)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !form.name || form.price <= 0}
                            className="flex-1 px-4 py-3 bg-[#00575A] text-white font-medium rounded-lg hover:bg-[#004447] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    Create Product
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

// ============================================================
// STOCK BADGE COMPONENT
// ============================================================

const StockBadge: React.FC<{ stock: number }> = ({ stock }) => {
    if (stock === 0) {
        return (
            <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Out of Stock
            </span>
        );
    }
    if (stock < 10) {
        return (
            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Low Stock ({stock})
            </span>
        );
    }
    return (
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
            In Stock ({stock})
        </span>
    );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const AdminProducts: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Product>>({});
    const [loading, setLoading] = useState(true);
    const [addLoading, setAddLoading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { showToast } = useToast();

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
            showToast('Failed to load products', 'error');
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
            showToast('Failed to update product', 'error');
        } else {
            showToast('Product updated successfully', 'success');
            setEditingId(null);
            fetchProducts();
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleAddProduct = async (newProduct: NewProduct) => {
        setAddLoading(true);
        const { error } = await supabase
            .from('products')
            .insert({
                name: newProduct.name,
                description: newProduct.description,
                price: newProduct.price,
                bonus_revenue: newProduct.bonus_revenue,
                stock: newProduct.stock,
                image_url: newProduct.image_url || 'https://via.placeholder.com/150',
                sales_count: 0,
                commission_rate: 0.21,
                is_active: true
            });

        if (error) {
            adminLogger.error('Failed to add product', error);
            showToast('Failed to add product', 'error');
        } else {
            showToast('Product created successfully!', 'success');
            setShowAddModal(false);
            fetchProducts();
        }
        setAddLoading(false);
    };

    const handleDeleteProduct = async (id: string, name: string) => {
        if (!confirm(`Delete "${name}"? This action cannot be undone.`)) return;

        setDeletingId(id);
        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            adminLogger.error('Failed to delete product', error);
            showToast('Failed to delete product', 'error');
        } else {
            showToast('Product deleted', 'info');
            fetchProducts();
        }
        setDeletingId(null);
    };

    const calculateCommission = (bonusRevenue: number, rate: number = 0.21) => {
        return bonusRevenue * rate;
    };

    // Filter products by search
    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Stats
    const totalProducts = products.length;
    const lowStockCount = products.filter((p) => p.stock < 10).length;
    const outOfStockCount = products.filter((p) => p.stock === 0).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="w-12 h-12 text-[#00575A] animate-spin" />
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-display font-bold text-slate-900 flex items-center gap-3">
                        <Package className="w-8 h-8 text-[#00575A]" />
                        Product Management
                    </h2>
                    <p className="text-slate-500 mt-1">
                        Manage product pricing and bonus revenue (DTTT)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchProducts}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Refresh products"
                    >
                        <RefreshCw className="w-5 h-5 text-slate-600" />
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-[#00575A] text-white font-medium rounded-lg hover:bg-[#004447] transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Package className="w-5 h-5 text-[#00575A]" />
                        <div>
                            <p className="text-sm text-slate-500">Total Products</p>
                            <p className="text-2xl font-bold text-slate-900">{totalProducts}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <div>
                            <p className="text-sm text-slate-500">Low Stock</p>
                            <p className="text-2xl font-bold text-amber-600">{lowStockCount}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        <div>
                            <p className="text-sm text-slate-500">Out of Stock</p>
                            <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                    type="text"
                    placeholder="Search products by name or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A] focus:border-transparent"
                />
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
                {filteredProducts.length === 0 ? (
                    <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
                        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500">No products found</p>
                    </div>
                ) : (
                    filteredProducts.map((product) => {
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
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
                                    {/* Product Image & Info */}
                                    <div className="flex items-start gap-4">
                                        <img
                                            src={product.image_url || 'https://via.placeholder.com/150'}
                                            alt={product.name}
                                            className="w-24 h-24 rounded-lg object-cover shrink-0"
                                            onError={(e) => {
                                                const target = e.target as HTMLImageElement;
                                                target.src = 'https://via.placeholder.com/150';
                                            }}
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
                                            <p className="text-xs text-slate-500 mb-2">ID: {product.id}</p>
                                            <StockBadge stock={product.stock} />
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
                                        <div className="text-xs text-slate-500">
                                            Sales: {product.sales_count.toLocaleString()}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 justify-center">
                                        {isEditing ? (
                                            <>
                                                <button
                                                    onClick={handleSave}
                                                    className="px-4 py-2 bg-[#00575A] text-white rounded-lg hover:bg-[#004447] transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Save className="w-4 h-4" />
                                                    Save
                                                </button>
                                                <button
                                                    onClick={handleCancel}
                                                    className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <X className="w-4 h-4" />
                                                    Cancel
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => handleEdit(product)}
                                                    className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteProduct(product.id, product.name)}
                                                    disabled={deletingId === product.id}
                                                    className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {deletingId === product.id ? (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                    Delete
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Add Product Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <AddProductModal
                        onClose={() => setShowAddModal(false)}
                        onAdd={handleAddProduct}
                        loading={addLoading}
                    />
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AdminProducts;
