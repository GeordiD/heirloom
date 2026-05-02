import { useContextOrThrow } from '@/utils/useContextOrThrow';
import { createContext, useEffect, useState, type ReactNode } from 'react';

interface FooterContextValue {
  isVisible: boolean;
  setIsVisible: (value: boolean) => void;
}

const FooterContext = createContext<FooterContextValue | null>(null);
FooterContext.displayName = 'FooterContext';

export function FooterProvider({ children }: { children: ReactNode }) {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <FooterContext.Provider value={{ isVisible, setIsVisible }}>{children}</FooterContext.Provider>
  );
}

export function useFooter() {
  return useContextOrThrow(FooterContext);
}

export function useShowFooter(value: boolean) {
  const { setIsVisible } = useFooter();

  useEffect(() => {
    setIsVisible(value);
  });
}
