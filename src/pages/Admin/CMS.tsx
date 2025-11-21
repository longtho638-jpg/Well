import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Eye, FileText } from 'lucide-react';

// ============================================================
// CMS COMPONENT - Content Management System
// ============================================================

const CMS: React.FC = () => {
  const [headline, setHeadline] = useState('Vững Tin Vươn Tầm');
  const [subheadline, setSubheadline] = useState('Hệ sinh thái kinh doanh sức khỏe 4.0');
  const [ctaText, setCtaText] = useState('Tham gia Founders Club');

  const handleSave = () => {
    localStorage.setItem('cms_headline', headline);
    localStorage.setItem('cms_subheadline', subheadline);
    localStorage.setItem('cms_cta', ctaText);
    alert('Content saved successfully! Changes will appear on the landing page.');
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-display font-bold text-slate-900">Content Management</h2>
        <p className="text-slate-500 mt-1">Edit landing page content and hero section</p>
      </div>

      {/* Editor Form */}
      <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-6">
        {/* Headline */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Hero Headline
          </label>
          <input
            type="text"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A] focus:border-transparent transition-all"
            placeholder="Enter main headline..."
          />
        </div>

        {/* Subheadline */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Hero Subheadline
          </label>
          <input
            type="text"
            value={subheadline}
            onChange={(e) => setSubheadline(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A] focus:border-transparent transition-all"
            placeholder="Enter subheadline..."
          />
        </div>

        {/* CTA Text */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            CTA Button Text
          </label>
          <input
            type="text"
            value={ctaText}
            onChange={(e) => setCtaText(e.target.value)}
            className="w-full px-4 py-3 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00575A] focus:border-transparent transition-all"
            placeholder="Enter CTA text..."
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          className="w-full md:w-auto px-6 py-3 bg-[#00575A] text-white font-medium rounded-lg hover:bg-[#004447] transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-5 h-5" />
          Save Changes
        </button>
      </div>

      {/* Preview */}
      <div className="bg-white border border-slate-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <Eye className="w-5 h-5 text-[#00575A]" />
          <h3 className="text-lg font-display font-bold text-slate-900">Live Preview</h3>
        </div>
        <div className="border border-slate-200 rounded-lg p-8 bg-gradient-to-br from-[#00575A]/5 to-transparent">
          <h1 className="text-4xl font-display font-bold text-slate-900 mb-3">{headline}</h1>
          <p className="text-xl text-slate-600 mb-6">{subheadline}</p>
          <button className="px-6 py-3 bg-[#00575A] text-white font-medium rounded-lg">
            {ctaText}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default CMS;
