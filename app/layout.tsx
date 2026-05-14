import './globals.css';
import type { Metadata } from 'next';
import { Nav } from '@/components/nav';

export const metadata: Metadata = {
  title: 'MCPHub — Multi-agent research on the Model Context Protocol',
  description:
    'Researcher → Analyst → Writer → Fact-Checker pipeline. Custom MCP-style tools, Claude Sonnet 4.6, streaming traces.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="bg-ink-50">
      <body className="bg-ink-50 text-ink-800 antialiased font-sans">
        <Nav />
        {children}
      </body>
    </html>
  );
}
