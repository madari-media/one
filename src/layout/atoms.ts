import { atom } from 'jotai';

export const sidebarOpenAtom = atom(false);
export const selectedContentTypeAtom = atom<'movie' | 'tv' | null>(null);
