import React, { useState, useRef, useEffect } from 'react';
import { CaretDown, MagnifyingGlass } from '@phosphor-icons/react';

interface Option {
  value: string;
  label: string;
}

interface CustomSelectProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  showSearch?: boolean;
}

export function CustomSelect({ options, value, onChange, placeholder, className, showSearch }: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen]);

  const filteredOptions = showSearch
    ? options.filter(opt => opt.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : options;

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }} className={className}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%',
          background: '#f9f9f9', color: '#111',
          border: '1px solid #ddd', borderRadius: '12px', padding: '0 16px',
          height: '48px', fontSize: '15px', fontWeight: 600,
          cursor: 'pointer', transition: 'border-color 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.borderColor = '#d9f95a'}
        onMouseOut={e => e.currentTarget.style.borderColor = isOpen ? '#d9f95a' : '#ddd'}
      >
        <span>{selectedOption ? selectedOption.label : placeholder || 'Select an option'}</span>
        <CaretDown size={16} weight="bold" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px',
          background: '#fff', borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)', zIndex: 100,
          border: '1px solid #eee', display: 'flex', flexDirection: 'column',
          maxHeight: '300px'
        }}>
          {showSearch && (
            <div style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <MagnifyingGlass size={16} color="#888" style={{ position: 'absolute', left: '12px' }} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Search regions..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 36px',
                    borderRadius: '8px',
                    border: '1px solid #eee',
                    background: '#f9f9f9',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = '#d9f95a'}
                  onBlur={e => e.currentTarget.style.borderColor = '#eee'}
                />
              </div>
            </div>
          )}
          
          <div style={{ overflowY: 'auto', flex: 1, maxHeight: '240px' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  style={{
                    display: 'flex', width: '100%', textAlign: 'left',
                    padding: '14px 16px', background: opt.value === value ? '#f0f8cb' : '#fff',
                    border: 'none', borderBottom: '1px solid #f4f4f4', fontSize: '15px', color: '#111', 
                    fontWeight: opt.value === value ? 700 : 500,
                    cursor: 'pointer', outline: 'none'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = opt.value === value ? '#f0f8cb' : '#f9f9f9'}
                  onMouseOut={e => e.currentTarget.style.background = opt.value === value ? '#f0f8cb' : '#fff'}
                >
                  {opt.label}
                </button>
              ))
            ) : (
              <div style={{ padding: '14px 16px', fontSize: '14px', color: '#888', textAlign: 'center' }}>
                No regions found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
