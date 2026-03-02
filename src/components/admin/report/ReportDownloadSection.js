import { FaFileCsv, FaFileExcel } from 'react-icons/fa';

/**
 * ReportDownloadSection - Reusable component for download report buttons
 * @param {Object} props
 * @param {string} props.title - Section title (e.g., "Download Reports")
 * @param {Array} props.downloadOptions - Array of download option objects
 * @param {string} props.downloadOptions[].label - Label for download option
 * @param {string} props.downloadOptions[].type - Type/endpoint for download
 * @param {function} props.onDownload - Callback function (type, format) => void
 * @param {string} props.downloading - Current downloading state (e.g., "membership-csv")
 */
export default function ReportDownloadSection({ 
  title = 'Download Reports', 
  downloadOptions = [], 
  onDownload,
  downloading = ''
}) {
  return (
    <div className="space-y-6">
      <div className='mb-5'>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-3">{title}</h2>
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(downloadOptions.length, 4)} gap-4`}>
          {downloadOptions.map((option, idx) => (
            <div key={idx} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{option.label}</h3>
              <div className="flex gap-2">
                <button 
                  onClick={() => onDownload(option.type, 'csv')} 
                  disabled={downloading !== ''} 
                  className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold disabled:bg-gray-600 transition-colors"
                >
                  <FaFileCsv className="inline mr-1" /> CSV
                </button>
                <button 
                  onClick={() => onDownload(option.type, 'excel')} 
                  disabled={downloading !== ''} 
                  className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-xs font-semibold disabled:bg-gray-600 transition-colors"
                >
                  <FaFileExcel className="inline mr-1" /> Excel
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
