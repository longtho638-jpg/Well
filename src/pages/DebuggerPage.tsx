import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { useTranslation } from '@/hooks';

const DebuggerPage: React.FC = () => {
    const { t } = useTranslation();
  const store = useStore();
  const [windowInfo, setWindowInfo] = useState<any>({});

  useEffect(() => {
    setWindowInfo({
      width: window.innerWidth,
      height: window.innerHeight,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white pt-20 px-4 font-mono">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-400">{t('debuggerpage.system_debugger')}</h1>
          <div className="text-xs text-gray-400">{t('debuggerpage.v_debug_1_0')}</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Store State */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <h2 className="text-xl font-semibold mb-4 text-green-400">{t('debuggerpage.zustand_store_state')}</h2>
            <div className="bg-black rounded p-4 overflow-auto h-96 text-xs text-green-300">
              {JSON.stringify(store, (key, value) => {
                if (typeof value === 'function') return '[Function]';
                return value;
              }, 2)}
            </div>
          </div>

          {/* Environment Info */}
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
             <h2 className="text-xl font-semibold mb-4 text-purple-400">{t('debuggerpage.environment_window')}</h2>
             <div className="space-y-4">
               <div>
                 <h3 className="text-sm text-gray-400 mb-2">{t('debuggerpage.window_props')}</h3>
                 <div className="bg-black rounded p-3 text-xs text-purple-300">
                   {JSON.stringify(windowInfo, null, 2)}
                 </div>
               </div>
               
               <div>
                  <h3 className="text-sm text-gray-400 mb-2">{t('debuggerpage.local_storage_keys')}</h3>
                  <div className="bg-black rounded p-3 text-xs text-yellow-300">
                    {Object.keys(localStorage).map(key => (
                      <div key={key} className="mb-1">
                        <span className="text-white">{key}:</span> <span className="opacity-50 truncate">{localStorage.getItem(key)?.substring(0, 50)}...</span>
                      </div>
                    ))}
                    {Object.keys(localStorage).length === 0 && <span className="opacity-50">{t('debuggerpage.empty')}</span>}
                  </div>
               </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebuggerPage;
