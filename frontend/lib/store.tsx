'use client';
import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { GenerateResponse } from './types';

interface AppContextType {
  result: GenerateResponse | null;
  setResult: (res: GenerateResponse | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [result, setResult] = useState<GenerateResponse | null>(null);

  return (
    <AppContext.Provider value={{ result, setResult }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider');
  }
  return context;
}
