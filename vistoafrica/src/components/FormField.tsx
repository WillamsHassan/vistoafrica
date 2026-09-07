import type { InputHTMLAttributes, ReactNode } from 'react'

type FormFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  id: string
  error?: string
  icon?: ReactNode
}

const FormField = ({ label, id, error, icon, className = '', ...props }: FormFieldProps) => {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-slate-700">
        {label}
      </label>

      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            {icon}
          </div>
        )}

        <input
          id={id}
          className={[
            'input-field',
            icon ? 'pl-10' : '',
            error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : '',
            className,
          ].join(' ')}
          {...props}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}

export default FormField
