import React from 'react';
import { useCopilot } from '@/hooks/useCopilot';
import { CopilotHeader } from './Copilot/CopilotHeader';
import { CopilotMessageList } from './Copilot/CopilotMessageList';
import { CopilotInput } from './Copilot/CopilotInput';
import { CopilotCoaching } from './Copilot/CopilotCoaching';

interface TheCopilotProps {
  productContext?: string;
  userName?: string;
}

/**
 * TheCopilot - Main container for the AI Sales Assistant
 * Refactored for better readability and performance.
 */
export default function TheCopilot({ productContext, userName = "Bạn" }: TheCopilotProps) {
  const {
    messages,
    input,
    setInput,
    isLoading,
    showCoaching,
    setShowCoaching,
    coaching,
    showSuggestions,
    handleSend,
    handleGenerateScript,
    handleGetCoaching
  } = useCopilot({ productContext, userName });

  return (
    <div className="flex flex-col h-[600px] bg-zinc-50 dark:bg-zinc-950 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 transition-colors duration-300">
      <CopilotHeader
        productContext={productContext}
        isLoading={isLoading}
        messageCount={messages.length}
        onGenerateScript={handleGenerateScript}
        onGetCoaching={handleGetCoaching}
      />

      <CopilotMessageList
        messages={messages}
        isLoading={isLoading}
        showSuggestions={showSuggestions}
        onSend={handleSend}
      />

      <CopilotCoaching
        showCoaching={showCoaching}
        coaching={coaching}
        onClose={() => setShowCoaching(false)}
      />

      <CopilotInput
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        onSend={handleSend}
      />
    </div>
  );
}
