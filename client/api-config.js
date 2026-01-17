// API Configuration
const API_CONFIG = {
  baseURL: 'https://phoolishlove.vercel.app/api',
  endpoints: {
    products: '/products',
    cart: '/cart',
    orders: '/orders',
    users: '/users',
    auth: {
      register: '/auth/register',
      login: '/auth/login'
    }
  }
};

// Helper function to get API URL
function getAPIUrl(endpoint) {
  return `${API_CONFIG.baseURL}${endpoint}`;
}

// Helper function for API requests
async function apiRequest(url, options = {}) {
  const defaultOptions = {
    headers: {},
  };

  // Add auth token if available
  const token = localStorage.getItem('authToken');
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }

  let body = options.body;
  const headers = { ...defaultOptions.headers, ...options.headers };

  if (body instanceof FormData) {
    // When using FormData, the browser automatically sets the Content-Type with the correct boundary.
    // Manually setting it will cause issues.
    delete headers['Content-Type'];
  } else if (body && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const config = {
    ...options,
    body: body,
    headers: headers,
  };

  try {
    const response = await fetch(url, config);

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // It might be a text response, like a URL from the upload
      try {
        data = await response.json();
      } catch (e) {
        data = await response.text();
      }
    }

    if (!response.ok) {
      const errorMessage = (data && data.message) ? data.message : (typeof data === 'string' ? data : 'API request failed');
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
