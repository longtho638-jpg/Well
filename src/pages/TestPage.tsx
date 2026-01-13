import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '@/hooks';

const TestPage: React.FC = () => {
    const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-gray-50 pt-20 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-[#00575A] mb-6"
        >
          {t('testpage.well_test_page')}</motion.h1>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">{t('testpage.connectivity_check')}</h2>
          <div className="grid grid-cols-1 gap-4">
             <div className="p-4 bg-green-50 border border-green-100 rounded-lg flex justify-between items-center">
               <span className="text-green-800 font-medium">{t('testpage.client_status')}</span>
               <span className="bg-green-200 text-green-800 px-3 py-1 rounded-full text-sm font-bold">{t('testpage.active')}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
