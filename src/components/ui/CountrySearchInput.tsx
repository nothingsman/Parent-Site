'use client';

import { useDeferredValue, useId, useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import {
  getCountries,
  isSupportedCountry,
  type Country,
} from 'react-phone-number-input';
import en from 'react-phone-number-input/locale/en';

interface CountrySearchInputProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

const COUNTRIES = getCountries()
  .filter((country): country is Country => isSupportedCountry(country))
  .map((country) => ({
    code: country,
    name: en[country] ?? country,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

export function CountrySearchInput({
  name,
  value,
  onChange,
  placeholder = 'Search for a country',
  required = false,
  className = '',
}: CountrySearchInputProps) {
  const inputId = useId();
  const listboxId = useId();
  const deferredValue = useDeferredValue(value);
  const [isOpen, setIsOpen] = useState(false);

  const filteredCountries = useMemo(() => {
    const query = deferredValue.trim().toLowerCase();

    if (!query) {
      return COUNTRIES;
    }

    const startsWith = COUNTRIES.filter(({ name }) => name.toLowerCase().startsWith(query));
    const contains = COUNTRIES.filter(
      ({ name }) => !name.toLowerCase().startsWith(query) && name.toLowerCase().includes(query),
    );

    return [...startsWith, ...contains];
  }, [deferredValue]);

  return (
    <div className="relative">
      <input type="hidden" name={name} value={value} />
      <div className={`flex items-center gap-3 ${className}`.trim()}>
        <Search className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          id={inputId}
          type="text"
          value={value}
          required={required}
          autoComplete="off"
          placeholder={placeholder}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            window.setTimeout(() => setIsOpen(false), 120);
          }}
          onChange={(event) => {
            onChange(event.target.value);
            setIsOpen(true);
          }}
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>

      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 shadow-xl"
        >
          {filteredCountries.length > 0 ? (
            filteredCountries.map((country) => {
              const selected = country.name === value;

              return (
                <button
                  key={country.code}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    onChange(country.name);
                    setIsOpen(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm text-slate-900 transition-colors hover:bg-slate-50"
                >
                  <span>{country.name}</span>
                  {selected ? <Check className="h-4 w-4 text-slate-900" /> : null}
                </button>
              );
            })
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500">No matching countries found.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
