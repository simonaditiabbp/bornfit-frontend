// fetchClient.js

class FetchClient {
  constructor(config = {}) {
    this.baseURL = config.baseURL || "";
    this.timeout = config.timeout || 10000;
    this.maxRetries = config.maxRetries || 3;
    this.refreshURL = config.refreshURL || "/auth/refresh";

    this.requestInterceptors = [];
    this.responseInterceptors = [];

    this.isRefreshing = false;
    this.refreshPromise = null;
  }

  addRequestInterceptor(fn) {
    this.requestInterceptors.push(fn);
  }

  addResponseInterceptor(successFn, errorFn) {
    this.responseInterceptors.push({ successFn, errorFn });
  }

  async refreshToken() {
    if (this.isRefreshing) return this.refreshPromise;

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      try {
        const refreshToken = localStorage.getItem("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const res = await fetch(this.baseURL + this.refreshURL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!res.ok) throw new Error("Refresh failed");

        const data = await res.json();
        localStorage.setItem("token", data.data.access_token);
        localStorage.setItem("refresh_token", data.data.refresh_token ?? refreshToken);

        return data.access_token;
      } finally {
        this.isRefreshing = false;
      }
    })();

    return this.refreshPromise;
  }

  async request(method, url, body, extraConfig = {}, retryCount = 0) {
    let config = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...extraConfig.headers,
      },
      ...extraConfig,
    };

    if (body) config.body = JSON.stringify(body);

    for (const interceptor of this.requestInterceptors) {
      config = (await interceptor(config)) || config;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);
    config.signal = controller.signal;

    let response;

    try {
      response = await fetch(this.baseURL + url, config);
      clearTimeout(timeoutId);
    } catch (err) {
      if (retryCount < this.maxRetries) {
        return this.request(method, url, body, extraConfig, retryCount + 1);
      }
      throw new Error("Network error");
    }

    if (response.status === 401 && !extraConfig._retry) {
      try {
        const newToken = await this.refreshToken();

        return this.request(
          method,
          url,
          body,
          {
            ...extraConfig,
            _retry: true,
            headers: {
              ...extraConfig.headers,
              Authorization: `Bearer ${newToken}`,
            },
          },
          retryCount
        );
      } catch (refreshError) {
        localStorage.removeItem("token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        throw refreshError;
      }
    }

    if (!response.ok) {
      if (
        retryCount < this.maxRetries &&
        [500, 502, 503].includes(response.status)
      ) {
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

      for (const { errorFn } of this.responseInterceptors) {
        if (errorFn) errorFn(errorObj);
      }

      throw errorObj;
    }

    let data = await response.json();

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
//   INSTANCE + AUTO TOKEN HANDLING
// =====================================
export const api = new FetchClient({
  baseURL: "https://api.yourdomain.com",
  timeout: 10000,
  refreshURL: "/auth/refresh",
  maxRetries: 3,
});


// Request Interceptor: inject token
api.addRequestInterceptor((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});


// Response Interceptor: optional logging
api.addResponseInterceptor(
  (data) => data,
  (error) => {
    console.log("API Error:", error);
  }
);
