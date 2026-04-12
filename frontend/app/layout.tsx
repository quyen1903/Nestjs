'use client';

import type { ReactNode } from 'react';
import { ReduxProvider } from '@/providers/ReduxProvider';
import { SocketProvider } from '@/providers/SocketProvider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import '@/app/globals.css';

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        <ReduxProvider>
          <SocketProvider>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </SocketProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}
