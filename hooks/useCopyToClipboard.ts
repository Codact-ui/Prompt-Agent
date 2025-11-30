import { useState, useCallback } from 'react';

interface UseCopyToClipboard {
  copy: (text: string) => Promise<boolean>;
  isCopied: boolean;
}

const useCopyToClipboard = (): UseCopyToClipboard => {
  const [isCopied, setIsCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    if (!navigator?.clipboard) {
      console.warn('Clipboard not supported');
      return false;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
      return true;
    } catch (error) {
      console.warn('Copy failed', error);
      setIsCopied(false);
      return false;
    }
  }, []);

  return { isCopied, copy };
};

export default useCopyToClipboard;
