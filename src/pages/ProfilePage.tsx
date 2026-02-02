import React from 'react';
import { useStore } from '@/store';
import { User, Mail, Phone, MapPin, Shield, Calendar, Award } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfilePage() {
  const { user } = useStore();

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-600/20 to-teal-600/20" />
        <div className="relative p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="relative group">
            <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <img
              src={user.avatarUrl}
              alt={user.name}
              className="w-32 h-32 rounded-full border-4 border-white dark:border-zinc-800 shadow-2xl relative z-10"
            />
            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white dark:border-zinc-800 rounded-full z-20" />
          </div>

          <div className="text-center md:text-left flex-1">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">{user.name}</h1>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-full text-xs font-bold border border-emerald-200 dark:border-emerald-500/30">
                {user.rank}
              </span>
            </div>
            <p className="text-zinc-500 dark:text-zinc-400 mb-4">{user.email}</p>

            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Joined: {new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-lg">
                <Shield className="w-4 h-4 text-blue-500" />
                <span>KYC Verified</span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Personal Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" />
              Personal Information
            </h2>
            <button className="text-sm text-emerald-600 hover:text-emerald-500 font-medium">
              Edit
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1">
              <label className="text-xs text-zinc-500 uppercase font-semibold">Full Name</label>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-900 dark:text-zinc-100 font-medium border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                <User className="w-4 h-4 text-zinc-400" />
                {user.name}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-zinc-500 uppercase font-semibold">Email Address</label>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-900 dark:text-zinc-100 font-medium border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                <Mail className="w-4 h-4 text-zinc-400" />
                {user.email}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-zinc-500 uppercase font-semibold">Phone Number</label>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-900 dark:text-zinc-100 font-medium border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                <Phone className="w-4 h-4 text-zinc-400" />
                +84 90 123 4567
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-zinc-500 uppercase font-semibold">Date of Birth</label>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-900 dark:text-zinc-100 font-medium border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
                <Calendar className="w-4 h-4 text-zinc-400" />
                01/01/1990
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-1">
            <label className="text-xs text-zinc-500 uppercase font-semibold">Address</label>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl text-zinc-900 dark:text-zinc-100 font-medium border border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
              <MapPin className="w-4 h-4 text-zinc-400" />
              123 Nguyen Hue Street, District 1, Ho Chi Minh City, Vietnam
            </div>
          </div>
        </motion.div>

        {/* Account Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm h-fit"
        >
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5 text-blue-500" />
            Account Status
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-900/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Identity Verified</span>
              </div>
              <Shield className="w-4 h-4 text-green-600 dark:text-green-400" />
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Email Verified</span>
              </div>
              <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white mb-2">Security Strength</h3>
              <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 mb-2">
                <div className="bg-emerald-500 h-2 rounded-full w-[85%]" />
              </div>
              <p className="text-xs text-zinc-500 text-right">Strong (85%)</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
