'use client';

import React from 'react';
import { AuthProvider } from './AuthProvider';

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthProvider>{children}</AuthProvider>;
};

export { AuthProvider };
