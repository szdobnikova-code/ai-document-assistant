'use client';

import { useState, useTransition } from 'react';
import { Search } from 'lucide-react';

import { searchChunks, type SearchState } from '@/app/actions/search';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ChunkSearch() {
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => setState(await searchChunks(formData)));
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <form action={onSubmit} className="flex w-full items-center gap-2">
        <Input
          name="query"
          placeholder="Search uploaded chunks…"
          aria-label="Search query"
        />
        <Button type="submit" disabled={pending}>
          <Search />
          {pending ? 'Searching…' : 'Search'}
        </Button>
      </form>

      {state.status === 'error' && (
        <Alert variant="destructive">
          <AlertTitle>Couldn’t search</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {state.status === 'success' && state.results.length === 0 && (
        <p className="text-muted-foreground text-sm">
          No relevant chunks found.
        </p>
      )}

      {state.status === 'success' && state.results.length > 0 && (
        <ul className="flex flex-col gap-3 text-left">
          {state.results.map((r) => (
            <li key={r.id}>
              <Card>
                <CardContent>
                  <div className="text-muted-foreground mb-2 flex justify-between text-xs">
                    <span>
                      {r.filename} · chunk {r.index}
                    </span>
                    <span>score {r.score.toFixed(3)}</span>
                  </div>
                  <p className="line-clamp-4 text-sm whitespace-pre-wrap">
                    {r.text}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
