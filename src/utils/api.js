/**
 * Centralized API utility for handling authenticated requests
 * Automatically handles 401 (expired token) and redirects to login
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Handle 401 response - clear auth data and redirect to login
 */
const handle401 = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};

/**
 * Fetch with automatic authentication and 401 handling
 * @param {string} url - API endpoint (relative or absolute)
 * @param {object} options - Fetch options
 * @returns {Promise<Response>}
 */
export const fetchWithAuth = async (url, options = {}) => {
  // Get token from localStorage
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Build full URL if relative
  const fullUrl = url.startsWith('http') ? url : `${API_URL}${url}`;

  // Merge headers with authorization
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Make request
  const response = await fetch(fullUrl, {
    ...options,
    headers,
  });

  // Handle 401 Unauthorized (expired token)
  if (response.status === 401) {
    handle401();
    throw new Error('Unauthorized - Token expired');
  }

  return response;
};

/**
 * Fetch with auth and auto JSON parsing
 * @param {string} url - API endpoint
 * @param {object} options - Fetch options
 * @returns {Promise<object>} Parsed JSON response
 */
export const fetchJsonWithAuth = async (url, options = {}) => {
  const response = await fetchWithAuth(url, options);
  return response.json();
};

/**
 * GET request with auth
 */
export const getWithAuth = (url, options = {}) => {
  return fetchWithAuth(url, { ...options, method: 'GET' });
};

/**
 * POST request with auth
 */
export const postWithAuth = (url, body, options = {}) => {
  return fetchWithAuth(url, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body),
  });
};

/**
 * PUT request with auth
 */
export const putWithAuth = (url, body, options = {}) => {
  return fetchWithAuth(url, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body),
  });
};

/**
 * DELETE request with auth
 */
export const deleteWithAuth = (url, options = {}) => {
  return fetchWithAuth(url, { ...options, method: 'DELETE' });
};

/**
 * Batch fetch multiple endpoints in parallel with automatic 401 handling
 * @param {string[]} urls - Array of API endpoints
 * @returns {Promise<object[]>} Array of parsed JSON responses
 */
export const batchFetchWithAuth = async (urls) => {
  const promises = urls.map(url => fetchJsonWithAuth(url));
  return Promise.all(promises);
};
