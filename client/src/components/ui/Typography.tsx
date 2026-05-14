import React from 'react';

interface TypographyProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  as?: React.ElementType;
}

export const Headline: React.FC<TypographyProps> = ({ className = '', as: Component = 'h1', children, ...props }) => {
  return (
    <Component className={`text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 ${className}`} {...props}>
      {children}
    </Component>
  );
};

export const Title: React.FC<TypographyProps> = ({ className = '', as: Component = 'h2', children, ...props }) => {
  return (
    <Component className={`text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 ${className}`} {...props}>
      {children}
    </Component>
  );
};

export const Body: React.FC<TypographyProps> = ({ className = '', as: Component = 'p', children, ...props }) => {
  return (
    <Component className={`text-base font-normal text-slate-600 leading-relaxed ${className}`} {...props}>
      {children}
    </Component>
  );
};

export const Label: React.FC<TypographyProps> = ({ className = '', as: Component = 'span', children, ...props }) => {
  return (
    <Component className={`text-sm font-medium text-slate-700 ${className}`} {...props}>
      {children}
    </Component>
  );
};
