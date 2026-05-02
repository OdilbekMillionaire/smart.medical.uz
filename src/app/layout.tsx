import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AppProviders } from '@/components/shared/AppProviders';

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
      <head>
        {/* Apply saved theme before React hydrates — prevents flash */}
        <script dangerouslySetInnerHTML={{ __html: `
(function(){
  try {
    var t = localStorage.getItem('sma_theme');
    if (t === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      if (!t) localStorage.setItem('sma_theme', 'light');
    }
  } catch(e){}
})();
        ` }} />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-slate-50 text-slate-900`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
