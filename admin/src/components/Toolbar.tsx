import React from 'react';

export const Toolbar: React.FC<{ children: React.ReactNode }> = ({ children }) => <div className="table-toolbar">{children}</div>;

export const SearchInput: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder }) => {
  const [local, setLocal] = React.useState(value);
  React.useEffect(() => setLocal(value), [value]);
  React.useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);
  return <input className="input" placeholder={placeholder ?? 'Search…'} value={local} onChange={(e) => setLocal(e.target.value)} />;
};

export const FilterSelect: React.FC<{ value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; placeholder: string }> = ({
  value,
  onChange,
  options,
  placeholder,
}) => (
  <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
    <option value="">{placeholder}</option>
    {options.map((o) => (
      <option key={o.value} value={o.value}>
        {o.label}
      </option>
    ))}
  </select>
);
