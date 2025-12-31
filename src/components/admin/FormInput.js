import Select from 'react-select';
import { useTheme } from '@/contexts/ThemeContext';

// FormInput Component
export default function FormInput({ 
  label, 
  name, 
  type = 'text', 
  value, 
  onChange, 
  required = false,
  disabled = false,
  placeholder = '',
  className = '',
  options = [], // for select
  ...props 
}) {
  const baseInputClass = disabled
    ? `w-full bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-700 px-3 py-2 rounded text-sm ${className}`
    : `w-full bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 px-3 py-2 rounded text-sm ${className}`;

  const labelClass = "block mb-1 text-gray-800 dark:text-gray-200 font-medium text-sm";
  const { theme } = useTheme();

  return (
    <div className="mb-4">
      <label className={labelClass}>
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {
      type === 'searchable-select' ? (
        <Select
          name={name}
          value={value}
          onChange={onChange}
          options={options}
          isDisabled={disabled}
          placeholder={placeholder || 'Ketik untuk mencari...'}
          classNamePrefix="react-select"
          styles={{
            control: (base, state) => ({
              ...base,
              minHeight: '38px',
              backgroundColor: theme === 'dark' ? '#374151' : '#ffffff',
              borderColor: state.isFocused
                ? theme === 'dark' ? '#6b7280' : '#2563eb'
                : theme === 'dark' ? '#4b5563' : '#d1d5db',
              boxShadow: 'none',
              '&:hover': {
                borderColor: theme === 'dark' ? '#9ca3af' : '#2563eb',
              },
              opacity: state.isDisabled ? 0.5 : 1,
            }),

            menu: (base) => ({
              ...base,
              backgroundColor: theme === 'dark' ? '#1f2937' : '#ffffff',
            }),

            option: (base, state) => ({
              ...base,
              backgroundColor: state.isSelected
                ? theme === 'dark' ? '#374151' : '#2563eb'
                : state.isFocused
                ? theme === 'dark' ? '#4b5563' : '#e5e7eb'
                : 'transparent',

              color: state.isSelected
                ? '#ffffff'
                : theme === 'dark' ? '#e5e7eb' : '#111827',

              cursor: 'pointer',

              // 🔥 INI KUNCINYA
              ':active': {
                backgroundColor: theme === 'dark'
                  ? '#374151'   // ⬅️ ganti biru total
                  : '#bfdbfe',
              },
            }),

            input: (base) => ({
              ...base,
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
            }),

            singleValue: (base) => ({
              ...base,
              color: theme === 'dark' ? '#e5e7eb' : '#111827',
            }),

            placeholder: (base) => ({
              ...base,
              color: theme === 'dark' ? '#9ca3af' : '#6b7280',
            }),
          }}

          theme={(theme) => ({
            ...theme,
            colors: {
              ...theme.colors,
              primary: theme === 'dark' ? '#374151' : '#2563eb',
              primary25: theme === 'dark' ? '#4b5563' : '#e5e7eb',
              primary50: theme === 'dark' ? '#374151' : '#bfdbfe',
              neutral80: theme === 'dark' ? '#e5e7eb' : '#111827',
              neutral40: theme === 'dark' ? '#9ca3af' : '#6b7280',
              neutral20: theme === 'dark' ? '#4b5563' : '#d1d5db',
            },
          })}
        />
      ) : type === 'select' ? (
        <select
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={baseInputClass}
          {...props}
        >
          {options.map((opt, idx) => (
            <option key={idx} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={baseInputClass}
          rows={4}
          {...props}
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={baseInputClass}
          required={required}
          {...props}
        />
      )}
    </div>
  );
}
