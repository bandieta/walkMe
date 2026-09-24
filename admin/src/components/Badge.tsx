import React from 'react';

type Tone = 'default' | 'success' | 'warning' | 'error' | 'accent';

const TONE_CLASS: Record<Tone, string> = {
  default: 'badge',
  success: 'badge badge-success',
  warning: 'badge badge-warning',
  error: 'badge badge-error',
  accent: 'badge badge-accent',
};

export const Badge: React.FC<{ children: React.ReactNode; tone?: Tone }> = ({ children, tone = 'default' }) => (
  <span className={TONE_CLASS[tone]}>{children}</span>
);

/** Consistent coloring for the statuses that repeat across walks/events/users. */
export function statusTone(status: string): Tone {
  switch (status) {
    case 'live':
    case 'active':
      return 'success';
    case 'upcoming':
      return 'accent';
    case 'ended':
      return 'default';
    case 'suspended':
      return 'warning';
    case 'banned':
      return 'error';
    default:
      return 'default';
  }
}
