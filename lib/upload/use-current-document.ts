'use client';

import { useSyncExternalStore } from 'react';

import type { UploadState } from '@/app/actions/upload';

export const CURRENT_DOCUMENT_STORAGE_KEY =
  'ai-document-assistant:upload-state';

const initialState: UploadState = { status: 'idle' };

let cachedRaw: string | null = null;
let cachedValue: UploadState = initialState;

function getStoredSnapshot(): UploadState {
  if (typeof window === 'undefined') {
    return initialState;
  }

  const raw = window.sessionStorage.getItem(CURRENT_DOCUMENT_STORAGE_KEY);

  if (raw === cachedRaw) {
    return cachedValue;
  }

  cachedRaw = raw;

  if (!raw) {
    cachedValue = initialState;
    return cachedValue;
  }

  try {
    cachedValue = JSON.parse(raw) as UploadState;
  } catch {
    window.sessionStorage.removeItem(CURRENT_DOCUMENT_STORAGE_KEY);
    cachedRaw = null;
    cachedValue = initialState;
  }

  return cachedValue;
}

function getServerSnapshot(): UploadState {
  return initialState;
}

function subscribe(callback: () => void): () => void {
  window.addEventListener('storage', callback);
  window.addEventListener('current-document-changed', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('current-document-changed', callback);
  };
}

export function useCurrentDocument(): UploadState {
  return useSyncExternalStore(subscribe, getStoredSnapshot, getServerSnapshot);
}

export function writeCurrentDocument(state: UploadState): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(
    CURRENT_DOCUMENT_STORAGE_KEY,
    JSON.stringify(state),
  );
  window.dispatchEvent(new Event('current-document-changed'));
}
