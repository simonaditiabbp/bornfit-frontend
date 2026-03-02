import { FaFilter } from 'react-icons/fa';

/**
 * ReportFilterSection - Reusable component for report filters
 * @param {Object} props
 * @param {string} props.title - Section title (default: "Filter Data")
 * @param {Array} props.filterFields - Array of filter field objects
 * @param {Object} props.filters - Current filter values
 * @param {function} props.onFilterChange - Callback (newFilters) => void
 * @param {function} props.onReset - Callback to reset filters
 */
export default function ReportFilterSection({ 
  title = 'Filter Data',
  filterFields = [],
  filters = {},
  onFilterChange,
  onReset
}) {
  const handleInputChange = (key, value) => {
    onFilterChange({ ...filters, [key]: value, page: 1 });
  };

  const renderField = (field) => {
    switch (field.type) {
      case 'date':
        return (
          <input
            type="date"
            value={filters[field.key] || ''}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
          />
        );
      case 'select':
        return (
          <select
            value={filters[field.key] || ''}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
          >
            <option value="">{field.placeholder || 'All'}</option>
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      case 'text':
      default:
        return (
          <input
            type="text"
            placeholder={field.placeholder}
            value={filters[field.key] || ''}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white"
          />
        );
    }
  };

  return (
    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-3">
        <FaFilter className="text-amber-500 dark:text-amber-400" />
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{title}</h3>
      </div>
      <div className={`grid grid-cols-1 md:grid-cols-${Math.min(filterFields.length + 1, 5)} gap-4`}>
        {filterFields.map((field) => (
          <div key={field.key}>
            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
              {field.label}
            </label>
            {renderField(field)}
          </div>
        ))}
        <div className="flex items-end">
          <button
            onClick={onReset}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded transition w-full"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
