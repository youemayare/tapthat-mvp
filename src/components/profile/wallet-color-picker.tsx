'use client';

import React, { useState, useRef, useEffect } from 'react';
import { HexColorPicker } from 'react-colorful';

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
  const [showPicker, setShowPicker] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowPicker(false);
      }
    }
    if (showPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPicker]);

  const currentColor = value && /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000';

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
        <div className="relative" ref={popoverRef}>
          {/* Custom trigger replacing the native input */}
          <button
            type="button"
            onClick={() => setShowPicker(!showPicker)}
            className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 overflow-hidden shadow-sm flex items-center justify-center bg-white"
            title="Open Color Wheel"
          >
             <div className="w-full h-full rounded-md" style={{ backgroundColor: currentColor }} />
          </button>

          {showPicker && (
            <div className="absolute top-12 left-0 z-50 p-3 bg-card border border-border rounded-xl shadow-xl animate-in fade-in zoom-in-95">
              <HexColorPicker color={currentColor} onChange={onChange} />
              <div className="mt-3 text-xs text-center text-muted-foreground font-medium">
                Drag to select a custom color
              </div>
            </div>
          )}
        </div>
        
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000 (optional)"
          className="flex h-10 w-full max-w-[120px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-mono uppercase"
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