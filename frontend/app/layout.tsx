import type { Metadata } from 'next';
import './globals.css';
import { AppProvider } from '@/lib/store';
import Navbar from '@/components/Navbar';

export const metadata: Metadata = {
  title: 'Conditional MolGAN — AI-Powered Molecular Generation',
  description:
    'Generate drug-like molecules conditioned on QED and logP targets using Conditional GANs and Reinforcement Learning.',
  keywords: ['molecular generation', 'drug discovery', 'MolGAN', 'deep learning', 'SMILES', 'QED', 'logP'],
  openGraph: {
    title: 'Conditional MolGAN',
    description: 'AI-Powered Molecular Generation using Conditional GANs and Reinforcement Learning',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
        <AppProvider>
          <Navbar />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
