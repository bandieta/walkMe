import React from 'react';

export const Avatar: React.FC<{ name: string; photoUrl?: string; size?: number }> = ({ name, photoUrl, size = 40 }) => {
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.35 }}>
      {photoUrl ? <img src={photoUrl} alt="" /> : initials || '?'}
    </div>
  );
};
