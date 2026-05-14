import { RunForm } from '@/components/run-form';

export default function Home() {
  const apiKeyConfigured = !!process.env.ANTHROPIC_API_KEY;
  return <RunForm apiKeyConfigured={apiKeyConfigured} />;
}
