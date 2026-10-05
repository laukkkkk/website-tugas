import type { InputHTMLAttributes, ReactNode } from 'react'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  helperText?: string
  containerClassName?: string
}

/**
 * Komponen Input bersama dengan fokus cincin cyan konsisten di seluruh halaman.
 */
export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  helperText,
  containerClassName = '',
  className = '',
  id,
  required,
  ...props
}: InputProps) {
  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold uppercase tracking-wider text-[var(--text-sub)]"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] flex items-center justify-center pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          id={id}
          required={required}
          className={`w-full py-2.5 rounded-xl border text-sm bg-[var(--bg-input)] text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:outline-hidden focus:ring-2 focus:ring-cyan-600 dark:focus:ring-cyan-500 transition-all ${
            leftIcon ? 'pl-10' : 'pl-3.5'
          } ${rightIcon ? 'pr-10' : 'pr-3.5'} ${
            error
              ? 'border-red-500 focus:ring-red-400'
              : 'border-[var(--border-main)]'
          } ${className}`}
          {...props}
        />

        {rightIcon && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] flex items-center justify-center">
            {rightIcon}
          </span>
        )}
      </div>

      {error ? (
        <p className="mt-1 text-xs text-red-500 font-medium">{error}</p>
      ) : helperText ? (
        <p className="mt-1 text-[11px] text-[var(--text-muted)]">{helperText}</p>
      ) : null}
    </div>
  )
}
