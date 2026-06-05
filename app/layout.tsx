import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { ChatProvider } from '@/components/chat/chat-provider';

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
    >
      <body className="flex min-h-full flex-col">
        <ChatProvider>
          <header className="border-b">
            <nav className="mx-auto flex h-14 max-w-4xl items-center justify-between px-6">
              <Link href="/" className="font-semibold">
                AI Document Assistant
              </Link>

              <div className="flex items-center gap-4 text-sm">
                <Link
                  href="/"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Upload
                </Link>
                <Link
                  href="/eval"
                  className="text-muted-foreground hover:text-foreground"
                >
                  Eval
                </Link>
              </div>
            </nav>
          </header>
          {children}
        </ChatProvider>
      </body>
    </html>
  );
}
