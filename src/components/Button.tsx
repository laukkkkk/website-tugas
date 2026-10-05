import type { ButtonHTMLAttributes, ReactNode } from 'react'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline-cyan'
export type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  isLoading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  children?: ReactNode
}

/**
 * Komponen Button bersama untuk seluruh aplikasi.
 * - primary: latar cyan tua (#00838F, hover #006B76) dengan teks putih (#FFFFFF)
 *   menghasilkan rasio kontras WCAG AA >= 4.5:1.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-[#00838f] hover:bg-[#006b76] active:bg-[#005861] text-white font-bold shadow-xs border border-transparent',
    secondary:
      'border border-[var(--border-main)] bg-[var(--bg-input)] text-[var(--text-main)] hover:bg-[var(--bg-page)] active:bg-[var(--bg-muted)] font-semibold',
    danger:
      'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold shadow-xs border border-transparent',
    ghost:
      'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-input)] active:bg-[var(--bg-page)] font-medium border border-transparent',
    'outline-cyan':
      'border border-cyan-500 bg-cyan-500/10 text-cyan-800 dark:text-cyan-200 hover:bg-cyan-500/20 active:bg-cyan-500/30 font-semibold',
  }

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'px-3 py-1.5 text-xs rounded-xl',
    md: 'px-4.5 py-2.5 text-xs sm:text-sm rounded-xl',
    lg: 'px-6 py-3 text-sm sm:text-base rounded-2xl',
  }

  return (
    <button
      disabled={disabled || isLoading}
      className={`inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="w-4 h-4 animate-spin text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  )
}
