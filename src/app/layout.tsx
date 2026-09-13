import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'IWS — Isko Working System',
  description: 'Shirinlik zavodi ishchi boshqaruv tizimi',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="uz" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
