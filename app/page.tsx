import { AuthProvider } from '@/components/AuthProvider';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ValenceWorkspace } from '@/components/ValenceWorkspace';

export default function HomePage() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ValenceWorkspace />
      </AuthProvider>
    </ErrorBoundary>
  );
}
