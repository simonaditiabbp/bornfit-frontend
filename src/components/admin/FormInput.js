import Select from 'react-select';

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
          className="text-sm"
          styles={{
            control: (base) => ({
              ...base,
              minHeight: '38px',
              backgroundColor: disabled ? '#f3f4f6' : 'white',
              borderColor: '#d1d5db',
            }),
          }}
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
