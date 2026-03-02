import React from 'react';
import { motion } from 'framer-motion';
import { Eye, TrendingUp, BarChart3, ExternalLink, Copy, CheckCircle2, Wand2 } from 'lucide-react';
import { useTranslation } from '@/hooks';
import { UserLandingPage, User } from '@/types';

interface Props {
  user: User;
  portraitUrl: string;
  generatedLandingPage: UserLandingPage | null;
  copiedText: string | null;
  onPublish: () => void;
  onCopyText: (text: string, id: string) => void;
}

export const AiLandingPagePreviewPanel: React.FC<Props> = ({
  user,
  portraitUrl,
  generatedLandingPage,
  copiedText,
  onPublish,
  onCopyText,
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-gray-900 dark:text-slate-100 flex items-center gap-2">
        <Eye className="w-5 h-5 text-purple-600" />
        {t('marketingtools.preview_landing_page')}
      </h3>

      {generatedLandingPage ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-purple-50 dark:from-slate-700 to-pink-50 dark:to-slate-700 rounded-xl p-6 border-2 border-purple-200 dark:border-slate-600"
        >
          <div className="flex items-center gap-4 mb-4">
            {portraitUrl && (
              <img src={portraitUrl} alt="Portrait" className="w-24 h-24 rounded-full object-cover ring-4 ring-white dark:ring-slate-800 shadow-lg" />
            )}
            <div>
              <h4 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{user.name}</h4>
              <p className="text-sm text-purple-600 dark:text-purple-400 font-semibold">{user.rank}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {generatedLandingPage.aiGeneratedBio}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between bg-white dark:bg-slate-800 rounded-lg p-3">
              <span className="text-sm text-gray-600 dark:text-slate-400">{t('marketingtools.link_landing_page')}</span>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                  {generatedLandingPage.publishedUrl}
                </code>
                <button onClick={() => onCopyText(generatedLandingPage.publishedUrl, 'landing-url')} className="p-1 hover:bg-purple-100 rounded">
                  {copiedText === 'landing-url' ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-purple-600" />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{generatedLandingPage.views}</p>
                <p className="text-xs text-gray-600 dark:text-slate-400">{t('marketingtools.l_t_xem')}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900 dark:text-slate-100">{generatedLandingPage.conversions}</p>
                <p className="text-xs text-gray-600 dark:text-slate-400">{t('marketingtools.chuy_n_i')}</p>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-3">
                <BarChart3 className="w-5 h-5 text-purple-600 dark:text-purple-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900 dark:text-slate-100">
                  {generatedLandingPage.views > 0
                    ? ((generatedLandingPage.conversions / generatedLandingPage.views) * 100).toFixed(1)
                    : '0.0'}%
                </p>
                <p className="text-xs text-gray-600 dark:text-slate-400">{t('marketingtools.t_l')}</p>
              </div>
            </div>

            {!generatedLandingPage.isPublished ? (
              <button
                onClick={onPublish}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg active:scale-95 transition-all duration-300"
              >
                <ExternalLink className="w-5 h-5" />
                {t('marketingtools.xu_t_b_n_ngay')}
              </button>
            ) : (
              <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-500 dark:border-green-600 rounded-xl p-4 text-center">
                <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                <p className="text-sm font-bold text-green-800 dark:text-green-300">{t('marketingtools.landing_page_xu_t_b_n')}</p>
                <p className="text-xs text-green-700 dark:text-green-400">{t('marketingtools.link_s_n_s_ng_chia_s')}</p>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <div className="bg-gray-50 dark:bg-slate-700 rounded-xl p-12 text-center border-2 border-dashed border-gray-300 dark:border-slate-600">
          <Wand2 className="w-16 h-16 text-gray-400 dark:text-slate-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-slate-300 font-medium">{t('marketingtools.ch_n_template_v_click_ai_vi')}</p>
          <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">{t('marketingtools.ai_s_t_o_landing_page_chuy_n')}</p>
        </div>
      )}
    </div>
  );
};
