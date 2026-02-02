import React from 'react';

// Helper for parsing FL inputs
const parseAltitude = (input: string): number => {
  const clean = input.toUpperCase().replace(/\s/g, '');
  if (clean.startsWith('FL')) {
    const fl = parseInt(clean.replace('FL', ''), 10);
    return isNaN(fl) ? 0 : fl * 100;
  }
  const num = parseInt(clean, 10);
  return isNaN(num) ? 0 : num;
};

export const AltitudeInput: React.FC<{ value: number, onChange: (val: number) => void, className?: string, placeholder?: string }> = ({ value, onChange, className, placeholder }) => {
  const [strVal, setStrVal] = React.useState(value === 0 ? '' : value.toString());

  React.useEffect(() => {
    // Sync with external updates if they differ significantly from current text
    // This handles map updates reflecting in the list
    const currentParsed = parseAltitude(strVal);
    if (value !== currentParsed) {
      setStrVal(value === 0 ? '' : value.toString());
    }
  }, [value]);

  const handleBlur = () => {
    const num = parseAltitude(strVal);
    onChange(num);
    setStrVal(num === 0 ? '' : num.toString());
  };

  return (
    <input
      type="text"
      className={className}
      placeholder={placeholder}
      value={strVal}
      onChange={(e) => setStrVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={e => e.key === 'Enter' && e.currentTarget.blur()}
    />
  )
}
