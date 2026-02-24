import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks';
import { Button } from '@/components/ui/Button';

const NotFoundPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 text-center">
      <div className="max-w-md w-full space-y-8 animate-in fade-in zoom-in duration-500">
        {/* Decorative 404 */}
        <div className="relative">
          <h1 className="text-9xl font-black text-zinc-900 leading-none select-none">
            404
          </h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-4xl md:text-5xl font-bold text-emerald-500 drop-shadow-sm">
              {t('notfound.title')}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-zinc-400 text-lg">
            {t('notfound.description')}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            onClick={() => navigate('/')}
            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            {t('notfound.back_home')}
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 px-8 py-6 text-lg rounded-xl transition-all active:scale-95"
          >
            {t('common.back')}
          </Button>
        </div>

        {/* Binh Phap decorative elements */}
        <div className="pt-12 flex justify-center gap-2">
          <div className="w-1 h-1 rounded-full bg-emerald-500/20" />
          <div className="w-1 h-1 rounded-full bg-emerald-500/40" />
          <div className="w-1 h-1 rounded-full bg-emerald-500/20" />
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
