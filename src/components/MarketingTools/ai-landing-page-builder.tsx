import React from 'react';
import { motion } from 'framer-motion';
import {
  Wand2,
  Palette,
  Upload,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '@/hooks';
import { LandingPageTemplate, UserLandingPage, User } from '@/types';
import { useAiLandingPageBuilderFormState } from './use-ai-landing-page-builder-form-state';
import { AiLandingPagePreviewPanel } from './ai-landing-page-preview-panel';

interface Props {
  user: User;
  landingPageTemplates: LandingPageTemplate[];
  userLandingPages: UserLandingPage[];
  onCreateLandingPage: (templateType: string, portraitUrl?: string) => Promise<UserLandingPage>;
  onPublishLandingPage: (pageId: string) => void;
}

export default function AiLandingPageBuilder({
  user,
  landingPageTemplates,
  userLandingPages,
  onCreateLandingPage,
  onPublishLandingPage,
}: Props) {
  const { t } = useTranslation();
  const {
    selectedTemplate,
    setSelectedTemplate,
    portraitUrl,
    isGeneratingBio,
    generatedLandingPage,
    copiedText,
    handleFileUpload,
    handleGenerateBio,
    handlePublish,
    handleCopyText,
  } = useAiLandingPageBuilderFormState({ landingPageTemplates, onCreateLandingPage, onPublishLandingPage });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 border-b border-gray-200 p-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl shadow-lg">
            <Wand2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              {t('marketingtools.ai_landing_builder')}
              <span className="bg-accent text-primary text-xs px-3 py-1 rounded-full font-bold">
                {t('marketingtools.new')}
              </span>
            </h2>
            <p className="text-white/90 text-sm">{t('marketingtools.t_o_trang_tuy_n_d_ng_chuy_n_ng')}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Template Selection & Upload */}
          <div className="space-y-6">
            {/* Template Selection */}
            <div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-600" />
                {t('marketingtools.ch_n_template')}
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {landingPageTemplates.map((template) => (
                  <motion.button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template.type)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative overflow-hidden rounded-xl p-4 text-left transition-all duration-300 ${
                      selectedTemplate === template.type
                        ? 'ring-4 ring-purple-500 bg-gradient-to-r from-purple-50 dark:from-slate-700 to-pink-50 dark:to-slate-700'
                        : 'bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <img src={template.imageUrl} alt={template.name} className="w-20 h-20 rounded-lg object-cover" />
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 dark:text-slate-100">{template.name}</h4>
                        <p className="text-sm text-gray-600 dark:text-slate-400">{template.description}</p>
                      </div>
                      {selectedTemplate === template.type && <CheckCircle2 className="w-6 h-6 text-purple-600" />}
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Portrait Upload */}
            <div>
              <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                <Upload className="w-5 h-5 text-purple-600" />
                {t('marketingtools.upload_nh_ch_n_dung')}
              </h3>
              <div className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl p-6 hover:border-purple-500 dark:hover:border-purple-400 transition-colors">
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" id="portrait-upload" />
                <label htmlFor="portrait-upload" className="cursor-pointer">
                  {portraitUrl ? (
                    <div className="flex items-center gap-4">
                      <img src={portraitUrl} alt="Portrait" className="w-20 h-20 rounded-full object-cover" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{t('marketingtools.nh_t_i_l_n')}</p>
                        <p className="text-xs text-gray-600">{t('marketingtools.click_thay_i')}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <ImageIcon className="w-12 h-12 text-gray-400 dark:text-slate-500 mx-auto mb-2" />
                      <p className="text-sm font-medium text-gray-900 dark:text-slate-100">{t('marketingtools.click_t_i_nh_l_n')}</p>
                      <p className="text-xs text-gray-600 dark:text-slate-400">{t('marketingtools.jpg_png_t_i_a_5mb')}</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerateBio}
              disabled={isGeneratingBio}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white px-8 py-4 rounded-xl font-bold text-lg hover:shadow-2xl active:scale-95 transition-all duration-300 disabled:opacity-50 disabled:active:scale-100"
            >
              {isGeneratingBio ? (
                <><Sparkles className="w-6 h-6 animate-spin" />{t('marketingtools.ai_ang_vi_t_c_u_chuy_n')}</>
              ) : (
                <><Wand2 className="w-6 h-6" />{t('marketingtools.ai_vi_t_c_u_chuy_n_c_a_t_i')}</>
              )}
            </button>
          </div>

          {/* Right: Preview Panel */}
          <AiLandingPagePreviewPanel
            user={user}
            portraitUrl={portraitUrl}
            generatedLandingPage={generatedLandingPage}
            copiedText={copiedText}
            onPublish={handlePublish}
            onCopyText={handleCopyText}
          />
        </div>

        {/* Existing Landing Pages */}
        {userLandingPages.length > 0 && (
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-slate-700">
            <h3 className="font-bold text-gray-900 dark:text-slate-100 mb-4">
              {t('marketingtools.landing_pages_t_o')} ({userLandingPages.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userLandingPages.map((page) => (
                <div
                  key={page.id}
                  className="bg-gradient-to-br from-purple-50 dark:from-slate-700 to-pink-50 dark:to-slate-700 rounded-xl p-4 border border-purple-200 dark:border-slate-600"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-slate-100">{page.template}</span>
                    {page.isPublished && (
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">
                        {t('marketingtools.live')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600 dark:text-slate-400">
                    <span>👁️ {page.views} {t('marketingtools.views')}</span>
                    <span>✅ {page.conversions} {t('marketingtools.conversions')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
