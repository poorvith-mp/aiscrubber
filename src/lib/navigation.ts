export type ToolView = 'home' | 'scrub' | 'prompt' | 'watermark' | 'metadata' | 'media' | 'docs' | 'legal' | 'about';

export interface NavItem {
  id: ToolView;
  label: string;
  description: string;
  shortcut: string;
}

export interface NavGroup {
  id: 'text' | 'files' | 'site';
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    id: 'text',
    label: 'Text',
    items: [
      { id: 'scrub', label: 'Text Scrubber', description: 'Replace sensitive text with stable tokens.', shortcut: '1' },
      { id: 'prompt', label: 'Prompt Masker', description: 'Mask secrets before asking an AI.', shortcut: '2' },
      { id: 'watermark', label: 'Watermark Cleaner', description: 'Remove invisible Unicode artifacts.', shortcut: '3' },
    ],
  },
  {
    id: 'files',
    label: 'Images & Files',
    items: [
      { id: 'metadata', label: 'Metadata Desk', description: 'Inspect and remove embedded metadata.', shortcut: '4' },
      { id: 'media', label: 'Media Redactor', description: 'Burn permanent redactions into images.', shortcut: '5' },
    ],
  },
  {
    id: 'site',
    label: 'Site',
    items: [
      { id: 'home', label: 'Home', description: 'Overview and quick start.', shortcut: 'H' },
      { id: 'docs', label: 'Documentation', description: 'Browser, CLI, and MCP reference.', shortcut: 'D' },
      { id: 'legal', label: 'Privacy & Terms', description: 'Data handling and usage terms.', shortcut: 'L' },
      { id: 'about', label: 'About', description: 'Project and founder.', shortcut: 'A' },
    ],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap(({ items }) => items);
const VIEW_IDS = new Set<ToolView>(NAV_ITEMS.map(({ id }) => id));

export function viewFromHash(hash: string): ToolView {
  const candidate = hash.replace(/^#/, '') as ToolView;
  return VIEW_IDS.has(candidate) ? candidate : 'home';
}

export function viewForShortcut(key: string, isEditable: boolean): ToolView | null {
  if (isEditable) return null;
  return NAV_ITEMS.find(({ shortcut }) => shortcut.toLowerCase() === key.toLowerCase())?.id ?? null;
}
