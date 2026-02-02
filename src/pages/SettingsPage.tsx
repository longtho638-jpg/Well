import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Bell, Lock, Globe, Moon, Shield, CreditCard, LogOut } from 'lucide-react';
import { useStore } from '@/store';
import { useTheme } from '@/context/ThemeContext';
import { useNavigate } from 'react-router-dom';

export default function SettingsPage() {
  const { user, logout } = useStore();
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
      title: 'Preferences',
      icon: Settings,
      items: [
        {
          id: 'theme',
          label: 'Dark Mode',
          description: 'Switch between light and dark themes',
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
          label: 'Language',
          description: 'Select your preferred language',
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
      title: 'Notifications',
      icon: Bell,
      items: [
        {
          id: 'email_notif',
          label: 'Email Notifications',
          description: 'Receive updates via email',
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
          label: 'Push Notifications',
          description: 'Receive updates on your device',
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
      title: 'Security',
      icon: Shield,
      items: [
        {
          id: 'password',
          label: 'Change Password',
          description: 'Update your password securely',
          icon: Lock,
          action: (
            <button className="text-sm text-emerald-600 font-medium hover:text-emerald-500">
              Update
            </button>
          )
        },
        {
          id: '2fa',
          label: 'Two-Factor Authentication',
          description: 'Add an extra layer of security',
          icon: Shield,
          action: (
            <button className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium">
              Enable
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
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-white mb-2">Settings</h1>
        <p className="text-zinc-500 dark:text-zinc-400">Manage your account preferences and security.</p>
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
              <h3 className="text-lg font-bold text-red-700 dark:text-red-400">Sign Out</h3>
              <p className="text-sm text-red-600/70 dark:text-red-400/70">Sign out of your account on this device</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-600/20"
          >
            Sign Out
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function MailIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
        checked ? 'bg-emerald-600' : 'bg-zinc-200 dark:bg-zinc-700'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
