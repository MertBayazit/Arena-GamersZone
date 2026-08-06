const BASE_URL = '/api';

/**
 * Helper to perform API requests with authorization headers automatically injected.
 */
export async function apiCall(endpoint, method = 'GET', body = null, customHeaders = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    ...customHeaders
  };

  // Add JWT authorization token if available
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers
  };

  if (body) {
    if (body instanceof FormData) {
      // For file uploads, browser automatically sets boundary, don't set JSON Content-Type
      config.body = body;
    } else {
      headers['Content-Type'] = 'application/json';
      config.body = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || `HTTP Hata: ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    console.error(`API Call failed (${method} ${endpoint}):`, error.message);
    throw error;
  }
}

/**
 * Backend ping status helper.
 */
export async function pingServer() {
  try {
    return await apiCall('/ping');
  } catch (err) {
    return null;
  }
}
