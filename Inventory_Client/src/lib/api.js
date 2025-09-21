// API configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

// Get auth token from cookies
const getAuthToken = () => {
  if (typeof window !== 'undefined') {
    return document.cookie
      .split('; ')
      .find(row => row.startsWith('accessToken='))
      ?.split('=')[1];
  }
  return null;
};

// Get headers with auth token
const getHeaders = (includeAuth = true) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// API helper functions
export const api = {
	// Products endpoints
	products: {
		getAll: (params = {}) => {
			const queryString = new URLSearchParams(params).toString();
			return fetch(
				`${API_BASE_URL}/products${queryString ? `?${queryString}` : ""}`,
				{ headers: getHeaders() }
			);
		},
		getById: (id) => fetch(`${API_BASE_URL}/product/${id}`, { headers: getHeaders() }),
		create: (data) =>
			fetch(`${API_BASE_URL}/products`, {
				method: "POST",
				headers: getHeaders(),
				body: JSON.stringify(data),
			}),
		update: (id, data) =>
			fetch(`${API_BASE_URL}/product/${id}`, {
				method: "PUT",
				headers: getHeaders(),
				body: JSON.stringify(data),
			}),
		delete: (id) =>
			fetch(`${API_BASE_URL}/product/${id}`, {
				method: "DELETE",
				headers: getHeaders(),
			}),
		deleteAll: () =>
			fetch(`${API_BASE_URL}/products`, {
				method: "DELETE",
				headers: getHeaders(),
				body: JSON.stringify({ confirmDeleteAll: true }),
			}),
	},

	// Distributors endpoints
	distributors: {
		getAll: (params = {}) => {
			const queryString = new URLSearchParams(params).toString();
			return fetch(
				`${API_BASE_URL}/distributors${queryString ? `?${queryString}` : ""}`,
				{ headers: getHeaders() }
			);
		},
		create: (data) =>
			fetch(`${API_BASE_URL}/distributors`, {
				method: "POST",
				headers: getHeaders(),
				body: JSON.stringify(data),
			}),
		update: (id, data) =>
			fetch(`${API_BASE_URL}/distributor/${id}`, {
				method: "PUT",
				headers: getHeaders(),
				body: JSON.stringify(data),
			}),
		delete: (id) =>
			fetch(`${API_BASE_URL}/distributor/${id}`, {
				method: "DELETE",
				headers: getHeaders(),
			}),
		deleteAll: () =>
			fetch(`${API_BASE_URL}/distributors`, {
				method: "DELETE",
				headers: getHeaders(),
				body: JSON.stringify({ confirmDeleteAll: true }),
			}),
	},

	// Stats endpoint
	stats: {
		get: () => fetch(`${API_BASE_URL}/products/stats`, { headers: getHeaders() }),
	},

	// Activity logs endpoints
	activityLogs: {
		getAll: (params = {}) => {
			const queryString = new URLSearchParams(params).toString();
			return fetch(
				`${API_BASE_URL}/activity-logs${queryString ? `?${queryString}` : ""}`,
				{ headers: getHeaders() }
			);
		},
		getById: (id) => fetch(`${API_BASE_URL}/activity-logs/${id}`, { headers: getHeaders() }),
		getStats: (params = {}) => {
			const queryString = new URLSearchParams(params).toString();
			return fetch(
				`${API_BASE_URL}/activity-logs/stats${queryString ? `?${queryString}` : ""}`,
				{ headers: getHeaders() }
			);
		},
		deleteAll: (days = 0) =>
			fetch(`${API_BASE_URL}/activity-logs/cleanup`, {
				method: "DELETE",
				headers: getHeaders(),
				body: JSON.stringify({ days })
			}),
	},

	// Orders endpoints
	orders: {
		getAll: (params = {}) => {
			const queryString = new URLSearchParams(params).toString();
			return fetch(
				`${API_BASE_URL}/orders${queryString ? `?${queryString}` : ""}`,
				{ headers: getHeaders() }
			);
		},
		getById: (id) => fetch(`${API_BASE_URL}/order/${id}`, { headers: getHeaders() }),
		create: (data) =>
			fetch(`${API_BASE_URL}/orders`, {
				method: "POST",
				headers: getHeaders(),
				body: JSON.stringify(data),
			}),
		update: (id, data) =>
			fetch(`${API_BASE_URL}/order/${id}`, {
				method: "PUT",
				headers: getHeaders(),
				body: JSON.stringify(data),
			}),
		delete: (id) =>
			fetch(`${API_BASE_URL}/order/${id}`, {
				method: "DELETE",
				headers: getHeaders(),
			}),
		getStats: (params = {}) => {
			const queryString = new URLSearchParams(params).toString();
			return fetch(
				`${API_BASE_URL}/orders/stats${queryString ? `?${queryString}` : ""}`,
				{ headers: getHeaders() }
			);
		},
		deleteAll: () =>
			fetch(`${API_BASE_URL}/orders`, {
				method: "DELETE",
				headers: getHeaders(),
				body: JSON.stringify({ confirmDeleteAll: true }),
			}),
	},

	// Settings endpoints
	settings: {
		get: () => fetch(`${API_BASE_URL}/settings`, { headers: getHeaders() }),
		update: (data) =>
			fetch(`${API_BASE_URL}/settings`, {
				method: "PUT",
				headers: getHeaders(),
				body: JSON.stringify(data),
			}),
	},

	// Stock alerts endpoints
	stockAlerts: {
		getAll: (params = {}) => {
			const queryString = new URLSearchParams(params).toString();
			return fetch(
				`${API_BASE_URL}/settings/alerts${queryString ? `?${queryString}` : ""}`,
				{ headers: getHeaders() }
			);
		},
		getStats: () => fetch(`${API_BASE_URL}/settings/alerts/stats`, { headers: getHeaders() }),
		acknowledge: (id) =>
			fetch(`${API_BASE_URL}/settings/alerts/${id}/acknowledge`, {
				method: "PUT",
				headers: getHeaders(),
			}),
		resolve: (id) =>
			fetch(`${API_BASE_URL}/settings/alerts/${id}/resolve`, {
				method: "PUT",
				headers: getHeaders(),
			}),
	},
};

export default api;
