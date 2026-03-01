import { useRef } from 'react';
import { Send } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (e?: { preventDefault: () => void }) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  placeholder = 'Type a message...',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!disabled && value.trim()) {
        onSubmit();
      }
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    onChange(e.target.value);
    // Auto-resize
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!disabled && value.trim()) {
      onSubmit(e);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-3">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder}
        rows={1}
        className={[
          'flex-1 resize-none bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl',
          'px-4 py-2 text-sm text-white placeholder-gray-500',
          'focus:outline-none focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/20',
          'transition-colors duration-200 leading-relaxed',
          'disabled:opacity-50 disabled:cursor-not-allowed',
        ].join(' ')}
      />
      <motion.button
        type="submit"
        disabled={disabled || !value.trim()}
        whileTap={{ scale: 0.92 }}
        className={[
          'flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-xl',
          'bg-emerald-500 hover:bg-emerald-400 transition-colors duration-200',
          'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-500',
          'text-white',
        ].join(' ')}
      >
        <Send className="w-4 h-4" />
      </motion.button>
    </form>
  );
}
