import React, { createContext, useContext, useState, useEffect } from 'react';
import { getGuestQuota, getQuota } from '../api/generator';
import { useAuth } from './AuthContext';
import { GenerationResult } from '../types';

interface GeneratorContextType {
  remainingTries: number | null;
  isLimitReached: boolean;
  lastGeneration: GenerationResult | null;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  setLastGeneration: (v: GenerationResult | null) => void;
  updateQuota: () => Promise<void>;
  isSubscribed: boolean;
}

const GeneratorContext = createContext<GeneratorContextType>({
  remainingTries: null,
  isLimitReached: false,
  lastGeneration: null,
  isGenerating: false,
  setIsGenerating: () => {},
  setLastGeneration: () => {},
  updateQuota: async () => {},
  isSubscribed: false,
});

export const GeneratorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, role, loading } = useAuth();
  const [remainingTries, setRemainingTries] = useState<number | null>(null);
  const [isLimitReached, setIsLimitReached] = useState(false);
  const [lastGeneration, setLastGeneration] = useState<GenerationResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const updateQuota = async () => {
    try {
      if (role === 'teacher') {
        const res = await getQuota();
        const d = res.data;
        setIsSubscribed(!!d.isSubscribed);
        if (d.isSubscribed) {
          setRemainingTries(null);
          setIsLimitReached(false);
        } else {
          setRemainingTries(d.remainingTries ?? 0);
          setIsLimitReached((d.remainingTries ?? 0) <= 0);
        }
      } else if (!role) {
        const res = await getGuestQuota();
        const d = res.data;
        setRemainingTries(d.remainingTries ?? 0);
        setIsLimitReached((d.remainingTries ?? 0) <= 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!loading) {
      updateQuota();
    }
  }, [user, role, loading]);

  return (
    <GeneratorContext.Provider
      value={{
        remainingTries,
        isLimitReached,
        lastGeneration,
        isGenerating,
        setIsGenerating,
        setLastGeneration,
        updateQuota,
        isSubscribed,
      }}
    >
      {children}
    </GeneratorContext.Provider>
  );
};

export const useGenerator = () => useContext(GeneratorContext);
