import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { ChatProvider } from '@/components/chat/chat-provider';
import { AppShell } from '@/components/layout/app-shell';
import { ThemeProvider } from '@/components/theme/theme-provider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'AI Document Assistant',
  description:
    'Upload PDFs, ask questions, and get cited answers powered by RAG.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ChatProvider>
            <AppShell>{children}</AppShell>
          </ChatProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
