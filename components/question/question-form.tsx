'use client';

import { useState, useTransition } from 'react';
import { Sparkles } from 'lucide-react';

import { askQuestion, type AnswerState } from '@/app/actions/answer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function QuestionForm() {
  const [state, setState] = useState<AnswerState>({ status: 'idle' });
  const [pending, startTransition] = useTransition();
  const showSources =
    state.status === 'success' &&
    state.answer !== "I couldn't find that in the document.";

  function onSubmit(formData: FormData) {
    startTransition(async () => setState(await askQuestion(formData)));
  }

  return (
    <div className="flex w-full flex-col gap-4">
      <form action={onSubmit} className="flex w-full flex-col gap-2">
        <Textarea
          name="question"
          placeholder="Ask a question about the document…"
          aria-label="Question"
        />
        <Button type="submit" disabled={pending} className="self-end">
          <Sparkles />
          {pending ? 'Asking…' : 'Ask'}
        </Button>
      </form>

      {state.status === 'error' && (
        <Alert variant="destructive">
          <AlertTitle>Couldn’t answer</AlertTitle>
          <AlertDescription>{state.message}</AlertDescription>
        </Alert>
      )}

      {state.status === 'success' && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardContent>
              <p className="text-left text-sm whitespace-pre-wrap">
                {state.answer}
              </p>
            </CardContent>
          </Card>

          {showSources && state.sources.length > 0 && (
            <div className="flex flex-col gap-3 text-left">
              <h3 className="text-sm font-medium">Sources</h3>

              {state.sources.map((source, index) => (
                <Card key={source.id}>
                  <CardContent>
                    <div className="text-muted-foreground mb-2 flex justify-between text-xs">
                      <span>
                        [{index + 1}] {source.filename} · chunk {source.index}
                      </span>
                      <span>score {source.score.toFixed(3)}</span>
                    </div>

                    <p className="line-clamp-4 text-sm whitespace-pre-wrap">
                      {source.text}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
