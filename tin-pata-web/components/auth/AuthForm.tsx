import type { FormHTMLAttributes, ReactNode } from 'react';

interface AuthFormProps extends FormHTMLAttributes<HTMLFormElement> {
  children: ReactNode;
}

export function AuthForm({ children, className = '', ...props }: AuthFormProps) {
  return (
    <form className={`flex flex-col gap-4 ${className}`} noValidate {...props}>
      {children}
    </form>
  );
}
