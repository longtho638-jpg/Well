import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Copy,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '@/hooks';

// Content Template Interface
export interface ContentTemplate {
  id: string;
  title: string;
  content: string;
  imageUrl: string;
  category: 'product' | 'testimonial' | 'tips' | 'promotion';
}

interface ContentLibrarySectionProps {
  templates: ContentTemplate[];
  onDownloadImage: (imageUrl: string, filename: string) => void;
}

/**
 * Content library section with pre-made marketing templates
 * Provides ready-to-use content for social media marketing
 */
export default function ContentLibrarySection({ templates, onDownloadImage }: ContentLibrarySectionProps) {
  const { t } = useTranslation();
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden"
    >
      <div className="bg-gradient-to-r from-blue-50 dark:from-slate-700 to-cyan-50 dark:to-slate-700 border-b border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-xl shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{t('marketing.contentLibrary.title')}</h2>
            <p className="text-sm text-gray-600 dark:text-slate-400">{t('marketing.contentLibrary.subtitle')}</p>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {templates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-xl border-2 border-gray-200 dark:border-slate-700 overflow-hidden hover:shadow-xl transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden">
                <img
                  src={template.imageUrl}
                  alt={template.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 right-3">
                  <span className="bg-white dark:bg-slate-800 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-primary dark:text-cyan-400 border border-primary/20 dark:border-cyan-400/20">
                    {template.category === 'product' && t('marketing.contentLibrary.categories.product')}
                    {template.category === 'testimonial' && t('marketing.contentLibrary.categories.testimonial')}
                    {template.category === 'tips' && t('marketing.contentLibrary.categories.tips')}
                    {template.category === 'promotion' && t('marketing.contentLibrary.categories.promotion')}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-2">
                  {template.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 mb-4 line-clamp-3 whitespace-pre-line">
                  {template.content}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopyText(template.content, `content-${template.id}`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-4 py-2 rounded-lg font-semibold hover:shadow-lg active:scale-95 transition-all duration-300"
                  >
                    {copiedText === `content-${template.id}` ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        {t('marketing.contentLibrary.copied')}
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        {t('marketing.contentLibrary.copyText')}
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => onDownloadImage(template.imageUrl, `${template.title}.jpg`)}
                    className="flex items-center justify-center gap-2 bg-white dark:bg-slate-700 border-2 border-blue-500 dark:border-blue-400 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-slate-600 active:bg-blue-100 dark:active:bg-slate-500 active:scale-95 transition-all duration-200"
                  >
                    <Download className="w-4 h-4" />
                    {t('marketing.contentLibrary.downloadImage')}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
