// API Configuration
const API_CONFIG = {
  baseURL: 'https://phoolishlove.vercel.app/api',
  endpoints: {
    products: '/products',
    cart: '/cart',
    orders: '/orders',
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
  // Don't set Content-Type for FormData, browser does it
  if (body instanceof FormData) {
    //
  } else if (body && typeof body === 'object') {
    defaultOptions.headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const config = {
    ...defaultOptions,
    ...options,
    body: body,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    // Handle empty responses
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }
    
    if (!response.ok) {
      throw new Error(data.message || data || 'API request failed');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}
