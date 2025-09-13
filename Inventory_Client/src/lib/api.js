// API configuration
const API_BASE_URL = "http://localhost:4000/api";
// const API_BASE_URL = "http://192.168.1.4:4000/api";

// API helper functions
export const api = {
	// Products endpoints
	products: {
		getAll: (params = {}) => {
			const queryString = new URLSearchParams(params).toString();
			return fetch(
				`${API_BASE_URL}/products${queryString ? `?${queryString}` : ""}`
			);
		},
		getById: (id) => fetch(`${API_BASE_URL}/product/${id}`),
		create: (data) =>
			fetch(`${API_BASE_URL}/products`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		update: (id, data) =>
			fetch(`${API_BASE_URL}/product/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		delete: (id) =>
			fetch(`${API_BASE_URL}/product/${id}`, {
				method: "DELETE",
			}),
		deleteAll: () =>
			fetch(`${API_BASE_URL}/products`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ confirmDeleteAll: true }),
			}),
	},

	// Distributors endpoints
	distributors: {
		getAll: (params = {}) => {
			const queryString = new URLSearchParams(params).toString();
			return fetch(
				`${API_BASE_URL}/distributors${queryString ? `?${queryString}` : ""}`
			);
		},
		create: (data) =>
			fetch(`${API_BASE_URL}/distributors`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		update: (id, data) =>
			fetch(`${API_BASE_URL}/distributor/${id}`, {
				method: "PUT",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(data),
			}),
		delete: (id) =>
			fetch(`${API_BASE_URL}/distributor/${id}`, {
				method: "DELETE",
			}),
		deleteAll: () =>
			fetch(`${API_BASE_URL}/distributors`, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ confirmDeleteAll: true }),
			}),
	},

	// Stats endpoint
	stats: {
		get: () => fetch(`${API_BASE_URL}/products/stats`),
	},
};

export default api;
