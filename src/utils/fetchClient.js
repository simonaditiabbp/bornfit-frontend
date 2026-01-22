/**
 * FetchClient - Axios-like HTTP client with interceptors
 * Features:
 * - Auto Bearer Token injection
 * - Auto 401 redirect to login
 * - Retry on network/server errors (3x)
 * - Request/Response interceptors
 * - Timeout handling
 */

class FetchClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || "";
    this.timeout = config.timeout || 30000; // 30s default
    this.maxRetries = config.maxRetries || 3;
    
    this.requestInterceptors = [];
    this.responseInterceptors = [];
  }

  addRequestInterceptor(fn) {
    this.requestInterceptors.push(fn);
  }

  addResponseInterceptor(successFn, errorFn) {
    this.responseInterceptors.push({ successFn, errorFn });
  }

  async request(method, url, body, extraConfig = {}, retryCount = 0) {
    // Check if body is FormData
    const isFormData = body instanceof FormData;
    
    let config = {
      method,
      headers: {
        // Don't set Content-Type for FormData (browser will auto-set with boundary)
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...extraConfig.headers,
      },
      ...extraConfig,
    };

    if (body && method !== "GET") {
      // Don't stringify FormData
      config.body = isFormData ? body : JSON.stringify(body);
    }

    // Run request interceptors
    for (const interceptor of this.requestInterceptors) {
      config = (await interceptor(config)) || config;
    }

    // Timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    config.signal = controller.signal;

    let response;

    try {
      response = await fetch(this.baseURL + url, config);
      clearTimeout(timeoutId);
    } catch (err) {
      clearTimeout(timeoutId);

      console.log("err:", err);
      
      // Retry on network error
      if (retryCount < this.maxRetries) {
        console.log(`🔄 Retry ${retryCount + 1}/${this.maxRetries} for ${url}`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1))); // exponential backoff
        return this.request(method, url, body, extraConfig, retryCount + 1);
      }
      
      const networkError = {
        status: 0,
        statusText: 'Network Error',
        data: { message: 'Failed to connect to server. Please check your connection.' },
        isNetworkError: true
      };
      
      // Run error interceptors
      for (const { errorFn } of this.responseInterceptors) {
        if (errorFn) errorFn(networkError);
      }
      
      throw networkError;
    }

    // Handle 401 Unauthorized - redirect to login
    if (response.status === 401) {
      console.log('🔒 401 Unauthorized - Redirecting to login...');
      
      if (typeof window !== 'undefined') {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
      
      const authError = {
        status: 401,
        statusText: 'Unauthorized',
        data: { message: 'Session expired. Please login again.' }
      };
      
      throw authError;
    }

    // Handle other errors
    if (!response.ok) {
      // Retry on server errors (500, 502, 503)
      if (
        retryCount < this.maxRetries &&
        [500, 502, 503, 504].includes(response.status)
      ) {
        console.log(`🔄 Retry ${retryCount + 1}/${this.maxRetries} for ${url} (${response.status})`);
        await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
        return this.request(method, url, body, extraConfig, retryCount + 1);
      }

      let errorBody;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = { message: response.statusText };
      }

      const errorObj = {
        status: response.status,
        statusText: response.statusText,
        data: errorBody,
      };

      // Run error interceptors
      for (const { errorFn } of this.responseInterceptors) {
        if (errorFn) errorFn(errorObj);
      }

      throw errorObj;
    }

    // Parse successful response
    let data;
    const responseType = extraConfig.responseType || 'json';
    try {
      if (responseType === 'blob') {
        data = await response.blob();
      } else if (responseType === 'text') {
        data = await response.text();
      } else {
        data = await response.json();
      }
    } catch (err) {
      data = null;
    }
    
    // Run success interceptors
    for (const { successFn } of this.responseInterceptors) {
      if (successFn) data = successFn(data) || data;
    }

    return data;
  }

  get(url, config) {
    return this.request("GET", url, null, config);
  }

  post(url, body, config) {
    return this.request("POST", url, body, config);
  }

  put(url, body, config) {
    return this.request("PUT", url, body, config);
  }

  patch(url, body, config) {
    return this.request("PATCH", url, body, config);
  }

  delete(url, config) {
    return this.request("DELETE", url, null, config);
  }
}

// =====================================
//   GLOBAL INSTANCE + AUTO CONFIGURATION
// =====================================

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export const api = new FetchClient({
  baseURL: API_URL,
  timeout: 20000, // 20 seconds
  maxRetries: 3,
});

// =====================================
//   REQUEST INTERCEPTOR: AUTO TOKEN
// =====================================
api.addRequestInterceptor((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return config;
});

// =====================================
//   RESPONSE INTERCEPTOR: LOGGING
// =====================================
api.addResponseInterceptor(
  (data) => {
    // Success response - bisa ditambahkan logging jika perlu
    return data;
  },
  (error) => {
    // Error response - logging untuk debugging
    if (process.env.NODE_ENV !== 'production') {
      console.error('❌ API Error:', {
        status: error.status,
        url: error.url,
        message: error.data?.message || error.statusText
      });
    }
  }
);

// Export default instance
export default api;
