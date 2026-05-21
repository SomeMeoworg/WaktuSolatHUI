import { useState, useEffect } from 'react';

export type VisualStyle = 'default' | 'retro' | 'glass' | 'soft';

export function useVisualStyle(): VisualStyle {
  const [style, setStyle] = useState<VisualStyle>('default');

  useEffect(() => {
    const stored = localStorage.getItem('theme_visual_style') as VisualStyle | null;
    if (stored) setStyle(stored);

    const observer = new MutationObserver(() => {
      const current = document.documentElement.getAttribute('data-style') as VisualStyle | null;
      if (current && current !== style) setStyle(current);
    });

    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-style'] });
    return () => observer.disconnect();
  }, []);

  return style;
}

/**
 * Returns the appropriate icon strokeWidth based on the current visual style.
 * Retro = thicker (3), Default = standard (2), Glass/Soft = lighter (1.5)
 */
export function useIconStroke(style?: VisualStyle): number {
  const currentStyle = style;
  if (currentStyle === 'retro') return 3;
  if (currentStyle === 'glass' || currentStyle === 'soft') return 1.5;
  return 2;
}

/**
 * Returns Tailwind class overrides for the current visual style.
 */
export function getStyleClasses(style: VisualStyle, baseClasses: string = ''): string {
  switch (style) {
    case 'retro':
      return `${baseClasses} border-2 border-[var(--md-sys-color-on-surface)] shadow-[4px_4px_0px_0px_var(--md-sys-color-on-surface)]`;
    case 'glass':
      return `${baseClasses} bg-[var(--glass-bg)] backdrop-blur-[var(--glass-blur)] border border-[var(--glass-border)]`;
    case 'soft':
      return `${baseClasses} shadow-[var(--soft-shadow-light)]`;
    default:
      return baseClasses;
  }
}
