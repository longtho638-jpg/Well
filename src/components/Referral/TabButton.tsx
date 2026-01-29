import { motion } from 'framer-motion';

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}

/**
 * Tab Button Component
 * Animated tab button with icon and label
 */
export default function TabButton({ active, onClick, icon: Icon, label }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-8 py-5 font-black text-[10px] uppercase tracking-[0.3em] transition-all relative flex items-center gap-4 italic
            ${active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
    >
      <Icon size={16} className={active ? 'text-teal-400' : 'text-zinc-500'} />
      {label}
      {active && (
        <motion.div
          layoutId="activeTabRef"
          className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]"
        />
      )}
    </button>
  );
}
