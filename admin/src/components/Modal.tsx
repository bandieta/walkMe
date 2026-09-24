import React from 'react';

export const Modal: React.FC<{ open: boolean; onClose: () => void; title: string; sub?: string; children: React.ReactNode; width?: number }> = ({
  open,
  onClose,
  title,
  sub,
  children,
  width,
}) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={width ? { maxWidth: width } : undefined}>
        <h3 className="modal-title">{title}</h3>
        {sub && <p className="modal-sub">{sub}</p>}
        {children}
      </div>
    </div>
  );
};
