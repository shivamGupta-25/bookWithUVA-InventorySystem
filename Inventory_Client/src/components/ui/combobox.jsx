"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Input } from './input';
import { Button } from './button';
import { ChevronDown, X } from 'lucide-react';

const Combobox = ({ 
  value, 
  onValueChange, 
  options = [], 
  placeholder = "Select an option...", 
  className = "",
  disabled = false,
  allowCustom = true,
  getLabel = (opt) => (typeof opt === 'string' ? opt : opt?.label ?? opt?.name ?? ''),
  getValue = (opt) => (typeof opt === 'string' ? opt : opt?.value ?? opt?.id ?? ''),
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Filter options based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = options.filter(option =>
        getLabel(option).toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchTerm, options]);

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    setIsOpen(true);
    
    // If allowCustom is true, update the value immediately
    if (allowCustom) {
      onValueChange(newValue);
    }
  };

  const handleOptionSelect = (option) => {
    const val = typeof option === 'string' ? option : getValue(option);
    onValueChange(val, option);
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleClear = () => {
    onValueChange('');
    setSearchTerm('');
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    if (!searchTerm) {
      const currentLabel = (() => {
        if (!value) return '';
        const found = options.find(opt => getValue(opt) === value);
        return found ? getLabel(found) : String(value);
      })();
      setSearchTerm(currentLabel);
    }
  };

  const displayValue = isOpen ? searchTerm : (() => {
    if (!value) return '';
    const found = options.find(opt => getValue(opt) === value);
    return found ? getLabel(found) : String(value);
  })();

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-20"
        />
        <div className="absolute right-1 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 w-6 p-0 hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(!isOpen)}
            className="h-6 w-6 p-0 hover:bg-accent hover:text-accent-foreground"
          >
            <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
                onClick={() => handleOptionSelect(option)}
              >
                {getLabel(option)}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-muted-foreground text-sm">
              {allowCustom ? 'Type to add new option' : 'No options found'}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Combobox;
