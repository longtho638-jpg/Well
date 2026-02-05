import React from 'react';
import { useTranslation } from '../../hooks';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface Bank {
  id: string;
  name: string;
  shortName: string;
  logo?: string;
  color: string;
}

const VN_BANKS: Bank[] = [
  { id: 'vcb', name: 'Vietcombank', shortName: 'VCB', color: 'bg-green-600' },
  { id: 'tcb', name: 'Techcombank', shortName: 'TCB', color: 'bg-red-600' },
  { id: 'mb', name: 'MB Bank', shortName: 'MB', color: 'bg-blue-600' },
  { id: 'acb', name: 'ACB', shortName: 'ACB', color: 'bg-blue-500' },
  { id: 'vpb', name: 'VPBank', shortName: 'VPB', color: 'bg-green-500' },
  { id: 'bidv', name: 'BIDV', shortName: 'BIDV', color: 'bg-blue-700' },
  { id: 'vib', name: 'VIB', shortName: 'VIB', color: 'bg-blue-400' },
  { id: 'tp', name: 'TPBank', shortName: 'TPB', color: 'bg-purple-600' },
];

interface BankSelectProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export const BankSelect: React.FC<BankSelectProps> = ({ value, onChange, error }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedBank = VN_BANKS.find(b => b.name === value);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-zinc-400 mb-1.5">
        {t('withdrawal.bankName') || 'Bank Name'}
      </label>

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
          error
            ? 'bg-red-500/5 border-red-500/50 text-red-200'
            : 'bg-zinc-900/50 border-white/10 text-white hover:bg-zinc-900 hover:border-white/20'
        }`}
      >
        <div className="flex items-center gap-3">
          {selectedBank ? (
            <>
              <div className={`w-8 h-8 rounded-lg ${selectedBank.color} flex items-center justify-center text-[10px] font-bold text-white shadow-sm`}>
                {selectedBank.shortName}
              </div>
              <span className="font-medium">{selectedBank.name}</span>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Building2 className="w-4 h-4 text-zinc-400" />
              </div>
              <span className="text-zinc-500">{t('withdrawal.selectBank') || 'Select a bank'}</span>
            </>
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {error && (
        <p className="mt-1 text-xs text-red-400 font-medium flex items-center gap-1">
          {error}
        </p>
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute z-50 w-full mt-2 bg-zinc-900 border border-white/10 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto"
          >
            {VN_BANKS.map((bank) => (
              <button
                key={bank.id}
                type="button"
                onClick={() => {
                  onChange(bank.name);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg ${bank.color} flex items-center justify-center text-[10px] font-bold text-white opacity-80 group-hover:opacity-100 transition-opacity`}>
                    {bank.shortName}
                  </div>
                  <span className={`text-sm font-medium ${value === bank.name ? 'text-emerald-400' : 'text-zinc-300'}`}>
                    {bank.name}
                  </span>
                </div>
                {value === bank.name && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Backdrop to close dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
};
