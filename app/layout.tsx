import './globals.css';
import type { Metadata } from 'next';
import { Nav } from '@/components/nav';
import { Footer } from '@/components/footer';

export const metadata: Metadata = {
  title: 'MCPHub | Multi-agent research on the Model Context Protocol',
  description:
    'A researcher, analyst, writer and fact-checker pipeline built on custom MCP-style tools, Claude Sonnet 4.6 and streaming traces.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-ink-50">
      {/* The page wash lives on <html>; body stays transparent so the fixed
          gradient in globals.css is not painted over. */}
      <body className="font-sans text-ink-800 antialiased">
        <Nav />
        {children}
        <Footer />
      </body>
    </html>
  );
}
