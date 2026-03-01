import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

interface StreamingMessageProps {
  content: string;
  role: 'user' | 'assistant';
  isStreaming?: boolean;
  timestamp?: string;
  agentId?: string;
}

/** Minimal markdown renderer: bold, italic, inline code, fenced code, unordered lists */
function renderMarkdown(text: string): React.ReactNode[] {
  const lines = text.split('\n');
  const nodes: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBuffer: string[] = [];
  let keyIdx = 0;

  function nextKey() {
    return `md-${keyIdx++}`;
  }

  function inlineFormat(raw: string): React.ReactNode {
    // Split by inline code first, then bold/italic
    const parts = raw.split(/(`[^`]+`)/g);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1 py-0.5 bg-white/10 rounded text-emerald-300 text-xs font-mono">
            {part.slice(1, -1)}
          </code>
        );
      }
      // Bold
      const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
      return boldParts.map((bp, j) => {
        if (bp.startsWith('**') && bp.endsWith('**')) {
          return <strong key={j} className="font-semibold text-white">{bp.slice(2, -2)}</strong>;
        }
        // Italic
        const italicParts = bp.split(/(\*[^*]+\*)/g);
        return italicParts.map((ip, k) => {
          if (ip.startsWith('*') && ip.endsWith('*')) {
            return <em key={k} className="italic text-gray-300">{ip.slice(1, -1)}</em>;
          }
          return ip;
        });
      });
    });
  }

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCodeBlock) {
        nodes.push(
          <pre key={nextKey()} className="my-2 p-3 bg-black/40 rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap">
            {codeBuffer.join('\n')}
          </pre>
        );
        codeBuffer = [];
        inCodeBlock = false;
      } else {
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    if (line.startsWith('- ') || line.startsWith('* ')) {
      nodes.push(
        <li key={nextKey()} className="ml-4 list-disc text-gray-300 text-sm">
          {inlineFormat(line.slice(2))}
        </li>
      );
    } else if (line.trim() === '') {
      nodes.push(<br key={nextKey()} />);
    } else {
      nodes.push(
        <p key={nextKey()} className="text-sm leading-relaxed">
          {inlineFormat(line)}
        </p>
      );
    }
  }

  return nodes;
}

function formatTimestamp(iso?: string): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function StreamingMessage({
  content,
  role,
  isStreaming = false,
  timestamp,
  agentId,
}: StreamingMessageProps) {
  const isUser = role === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={[
          'flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs',
          isUser
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
        ].join(' ')}
        title={agentId}
      >
        {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
      </div>

      {/* Bubble */}
      <div className={`flex flex-col max-w-[78%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={[
            'px-3 py-2 rounded-2xl text-sm',
            isUser
              ? 'bg-gradient-to-br from-emerald-600/70 to-emerald-500/50 text-white rounded-tr-sm border border-emerald-500/30'
              : 'bg-white/5 backdrop-blur-sm border border-white/10 text-gray-100 rounded-tl-sm',
          ].join(' ')}
        >
          {renderMarkdown(content)}
          {isStreaming && (
            <motion.span
              className="inline-block w-0.5 h-3.5 bg-emerald-400 ml-0.5 align-text-bottom"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
            />
          )}
        </div>
        {timestamp && (
          <span className="text-[10px] text-gray-600 mt-1 px-1">
            {formatTimestamp(timestamp)}
          </span>
        )}
      </div>
    </motion.div>
  );
}
