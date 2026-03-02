import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Lock, Globe, Moon, Shield, LogOut } from 'lucide-react';
import { useStore } from '@/store';
import { useTheme } from '@/context/ThemeContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks';
import { MailIcon, Toggle } from './settings-page-ui-primitives';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { logout } = useStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    marketing: false,
    security: true
  });

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sections = [
    {
      title: t('settings.sections.preferences'),
      icon: Settings,
      items: [
        {
          id: 'theme',
          label: t('settings.items.dark_mode'),
          description: t('settings.items.dark_mode_description'),
          icon: Moon,
          action: (
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
                theme === 'dark' ? 'bg-emerald-600' : 'bg-zinc-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          )
        },
        {
          id: 'language',
          label: t('settings.items.language'),
          description: t('settings.items.language_description'),
          icon: Globe,
          action: (
            <select className="bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="en">English</option>
              <option value="vi">Tiếng Việt</option>
            </select>
          )
        }
      ]
    },
    {
      title: t('settings.sections.notifications'),
      icon: Bell,
      items: [
        {
          id: 'email_notif',
          label: t('settings.items.email_notifications'),
          description: t('settings.items.email_notifications_description'),
          icon: MailIcon,
          action: (
            <Toggle
              checked={notifications.email}
              onChange={() => setNotifications(prev => ({ ...prev, email: !prev.email }))}
            />
          )
        },
        {
          id: 'push_notif',
          label: t('settings.items.push_notifications'),
          description: t('settings.items.push_notifications_description'),
          icon: Bell,
          action: (
            <Toggle
              checked={notifications.push}
              onChange={() => setNotifications(prev => ({ ...prev, push: !prev.push }))}
            />
          )
        }
      ]
    },
    {
      title: t('settings.sections.security'),
      icon: Shield,
      items: [
        {
          id: 'password',
          label: t('settings.items.change_password'),
          description: t('settings.items.change_password_description'),
          icon: Lock,
          action: (
            <button className="text-sm text-emerald-600 font-medium hover:text-emerald-500">
              {t('settings.actions.update')}
            </button>
          )
        },
        {
          id: '2fa',
          label: t('settings.items.two_factor'),
          description: t('settings.items.two_factor_description'),
          icon: Shield,
          action: (
            <button className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium">
              {t('settings.actions.enable')}
            </button>
          )
        }
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">{t('settings.title')}</h1>
        <p className="text-zinc-500 dark:text-zinc-400">{t('settings.subtitle')}</p>
      </motion.div>

      <div className="space-y-6">
        {sections.map((section, idx) => (
          <motion.div
            key={section.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm"
          >
            <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <section.icon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{section.title}</h2>
            </div>

            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {section.items.map((item) => (
                <div key={item.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 text-zinc-400">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-medium text-zinc-900 dark:text-white">{item.label}</h3>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">{item.description}</p>
                    </div>
                  </div>
                  <div>
                    {item.action}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-2xl p-6 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <LogOut className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-red-700 dark:text-red-400">{t('settings.sign_out')}</h3>
              <p className="text-sm text-red-600/70 dark:text-red-400/70">{t('settings.sign_out_description')}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-600/20"
          >
            {t('settings.sign_out')}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
