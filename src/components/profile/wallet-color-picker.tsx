import React from 'react';

const PRESET_COLORS = [
  { label: 'Black', value: '#000000' },
  { label: 'Charcoal', value: '#27272a' },
  { label: 'Slate', value: '#475569' },
  { label: 'Navy', value: '#0f172a' },
  { label: 'Forest', value: '#14532d' },
  { label: 'Maroon', value: '#7f1d1d' },
  { label: 'White', value: '#ffffff' },
];

export function WalletColorPicker({ 
  value, 
  onChange 
}: { 
  value: string; 
  onChange: (hex: string) => void 
}) {
  return (
    <div className="space-y-3">
      {/* Professional Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => onChange(c.value)}
            className={`w-8 h-8 rounded-full border-2 transition-all ${
              value === c.value
                ? 'border-blue-500 scale-110 shadow-sm'
                : 'border-border/50 hover:scale-105 hover:shadow'
            }`}
            style={{ backgroundColor: c.value }}
            title={c.label}
            aria-label={c.label}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
            title="Custom Color Wheel"
          />
        </div>
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000 (optional)"
          className="flex h-10 w-full max-w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono"
        />
        
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
}