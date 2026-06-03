'use client';

import PhoneInput, { getCountryCallingCode } from 'react-phone-number-input';
import type { Country } from 'react-phone-number-input';

interface PhoneNumberFieldProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  inputClassName?: string;
  defaultCountry?: Country;
  autoComplete?: string;
  id?: string;
  disabled?: boolean;
}

export function PhoneNumberField({
  name,
  value,
  onChange,
  placeholder = 'Enter phone number',
  required = false,
  className = '',
  inputClassName = '',
  defaultCountry,
  autoComplete = 'tel',
  id,
  disabled = false,
}: PhoneNumberFieldProps) {
  const handleCountryChange = (country?: Country) => {
    if (!country || value) return;
    const callingCode = getCountryCallingCode(country);
    onChange(`+${callingCode}`);
  };

  return (
    <>
      <input type="hidden" name={name} value={value} />
      <PhoneInput
        id={id}
        international
        defaultCountry={defaultCountry}
        placeholder={placeholder}
        value={value || undefined}
        onChange={(nextValue) => onChange(nextValue ?? '')}
        onCountryChange={handleCountryChange}
        disabled={disabled}
        className={`phone-input-base ${className}`.trim()}
        countrySelectProps={{
          'aria-label': 'Select phone country',
          disabled,
        }}
        numberInputProps={{
          required,
          type: 'tel',
          autoComplete,
          disabled,
          className: inputClassName,
        }}
      />
    </>
  );
}
