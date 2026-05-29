'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center px-6 py-12">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-2 rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-950/30">
            <AlertTriangle className="h-6 w-6" />
          </div>

          <CardTitle>Something went wrong</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm">
            The app hit an unexpected error. Try again or reload the page.
          </p>

          <Button onClick={reset}>Try again</Button>
        </CardContent>
      </Card>
    </main>
  );
}
