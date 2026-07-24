import { Hero } from '@/components/hero';
import { Pipeline } from '@/components/pipeline';
import { RunForm } from '@/components/run-form';
import { ToolsSection } from '@/components/tools-section';

export default function Home() {
  const apiKeyConfigured = !!process.env.ANTHROPIC_API_KEY;

  return (
    <main>
      <Hero />
      <div className="mx-auto max-w-6xl space-y-24 px-6 pb-8 md:space-y-32">
        <Pipeline />
        <RunForm apiKeyConfigured={apiKeyConfigured} />
        <ToolsSection />
      </div>
    </main>
  );
}
