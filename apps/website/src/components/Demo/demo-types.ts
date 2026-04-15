import type { MosaicPath } from 'react-mosaic-component';

export interface ExampleWindowProps {
  panelId: string;
  path: MosaicPath;
  title: string;
}

export interface EditableTabTitleProps {
  title: string;
  onUpdateTitle: (newTitle: string) => void;
}

export const THEMES = {
  ['Blueprint']: 'mosaic-blueprint-theme',
  ['Blueprint Dark']: 'mosaic-blueprint-theme bp5-dark',
  ['Custom Dark']: 'mosaic-custom-dark-theme',
  ['Custom Light']: 'mosaic-custom-light-theme',
  ['None']: '',
} as const;

export type Theme = keyof typeof THEMES;
