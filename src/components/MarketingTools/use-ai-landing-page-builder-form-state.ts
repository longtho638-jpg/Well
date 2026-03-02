import { useState } from 'react';
import { LandingPageTemplate, UserLandingPage } from '@/types';

interface UseAiLandingPageBuilderFormStateProps {
  landingPageTemplates: LandingPageTemplate[];
  onCreateLandingPage: (templateType: string, portraitUrl?: string) => Promise<UserLandingPage>;
  onPublishLandingPage: (pageId: string) => void;
}

export function useAiLandingPageBuilderFormState({
  landingPageTemplates,
  onCreateLandingPage,
  onPublishLandingPage,
}: UseAiLandingPageBuilderFormStateProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>(landingPageTemplates[0]?.type || 'expert');
  const [portraitUrl, setPortraitUrl] = useState<string>('');
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [generatedLandingPage, setGeneratedLandingPage] = useState<UserLandingPage | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setPortraitUrl(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateBio = async () => {
    setIsGeneratingBio(true);
    try {
      const newPage = await onCreateLandingPage(selectedTemplate, portraitUrl || undefined);
      setGeneratedLandingPage(newPage);
    } catch {
      // generation failed, handled by finally
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handlePublish = () => {
    if (generatedLandingPage) {
      onPublishLandingPage(generatedLandingPage.id);
      setGeneratedLandingPage({ ...generatedLandingPage, isPublished: true });
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return {
    selectedTemplate,
    setSelectedTemplate,
    portraitUrl,
    isGeneratingBio,
    generatedLandingPage,
    copiedText,
    handleFileUpload,
    handleGenerateBio,
    handlePublish,
    handleCopyText,
  };
}
