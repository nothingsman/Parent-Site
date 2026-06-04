import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = ({
  children,
  className = "",
  ...props
}: CardProps) => (
  <div
    className={`bg-white rounded-xl border border-slate-100 shadow-sm p-3.5 sm:p-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);
