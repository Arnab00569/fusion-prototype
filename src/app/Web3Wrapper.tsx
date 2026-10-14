'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const ProvidersDynamic = dynamic(
  () => import('./providers').then((mod) => mod.Providers),
  { ssr: false }
);

export function Web3Wrapper({ children }: { children: React.ReactNode }) {
  return <ProvidersDynamic>{children}</ProvidersDynamic>;
}