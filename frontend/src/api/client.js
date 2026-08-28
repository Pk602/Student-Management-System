import axios from "axios";

export const API_URL =
    import.meta.env.VITE_API_URL || "http://127.0.0.1:5000";

const apiClient = axios.create({
    baseURL: API_URL,
    timeout: 30000,
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access_token");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Centralized 401 & 403 handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status, data } = error.response;

            if (status === 401) {
                // Token invalid, expired, or missing
                localStorage.removeItem("access_token");
                localStorage.removeItem("user_info");
                window.dispatchEvent(
                    new CustomEvent("auth:unauthorized", {
                        detail: { message: data?.error || "Session expired. Please log in again." },
                    })
                );
            } else if (status === 403) {
                window.dispatchEvent(
                    new CustomEvent("auth:forbidden", {
                        detail: { message: data?.error || "You do not have permission to perform this action." },
                    })
                );
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;
