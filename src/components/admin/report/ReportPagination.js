/**
 * ReportPagination - Reusable pagination component with rows per page selector
 * @param {Object} props
 * @param {Object} props.pagination - Pagination data { page, total_pages, total }
 * @param {number} props.currentLimit - Current rows per page limit
 * @param {Array} props.limitOptions - Array of limit options (default: [20, 50, 100])
 * @param {boolean} props.loading - Loading state
 * @param {function} props.onPageChange - Callback (newPage) => void
 * @param {function} props.onLimitChange - Callback (newLimit) => void
 */
export default function ReportPagination({ 
  pagination = { page: 1, total_pages: 1, total: 0 },
  currentLimit = 20,
  limitOptions = [20, 50, 100],
  loading = false,
  onPageChange,
  onLimitChange
}) {
  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-4">
      <div className="flex items-center gap-4">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          Halaman {pagination.page} dari {pagination.total_pages} | Total Data: {pagination.total}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600 dark:text-gray-400">Rows per page:</label>
          <select
            value={currentLimit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded text-gray-800 dark:text-white text-sm"
          >
            {limitOptions.map((limit) => (
              <option key={limit} value={limit}>
                {limit}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 transition-colors"
          disabled={pagination.page <= 1 || loading}
          onClick={() => onPageChange(pagination.page - 1)}
        >
          Prev
        </button>
        <button
          className="px-3 py-1 rounded bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-50 transition-colors"
          disabled={pagination.page >= pagination.total_pages || loading}
          onClick={() => onPageChange(pagination.page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
