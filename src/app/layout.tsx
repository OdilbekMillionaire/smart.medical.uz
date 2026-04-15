import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import dynamic from 'next/dynamic';
import { Toaster } from 'sonner';


// Load providers client-side only — Firebase must never run on the server
const AuthProvider = dynamic(
  () => import('@/contexts/AuthContext').then((m) => m.AuthProvider),
  { ssr: false }
);

const LanguageProvider = dynamic(
  () => import('@/contexts/LanguageContext').then((m) => m.LanguageProvider),
  { ssr: false }
);

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'Smart Medical Association',
  description: "O'zbekiston xususiy klinikalar assotsiatsiyasi platformasi",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
          <LanguageProvider>
            <AuthProvider>
              {children}
              <Toaster position="top-right" richColors />
            </AuthProvider>
          </LanguageProvider>
      </body>
    </html>
  );
}
