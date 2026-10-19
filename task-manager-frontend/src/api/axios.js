
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
});

let csrfToken = null;
let csrfRequest = null;

export async function ensureCsrfToken() {
    // Avoid duplicate simultaneous CSRF requests.
    if (!csrfRequest) {
        csrfRequest = api
            .get("csrf/")
            .then((response) => {
                csrfToken = response.data?.csrfToken || null;

                if (!csrfToken) {
                    throw new Error(
                        "The server did not return a CSRF token."
                    );
                }

                return csrfToken;
            })
            .finally(() => {
                csrfRequest = null;
            });
    }

    return csrfRequest;
}

api.interceptors.request.use((config) => {
    const method = (config.method || "get").toLowerCase();

    if (
        csrfToken &&
        ["post", "put", "patch", "delete"].includes(method)
    ) {
        config.headers = config.headers || {};
        config.headers["X-CSRFToken"] = csrfToken;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        const url = originalRequest?.url || "";

        const isAuthenticationEndpoint =
            url.includes("token/") ||
            url.includes("logout/") ||
            url.includes("register/") ||
            url.includes("csrf/") ||
            url.includes("auth/me/");

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !isAuthenticationEndpoint
        ) {
            originalRequest._retry = true;

            try {
                await ensureCsrfToken();
                await api.post("token/refresh/", {});

                return api(originalRequest);
            } catch (refreshError) {
                console.error(
                    "Session refresh failed:",
                    refreshError.response?.status ||
                        refreshError.message
                );

                // Do not make another logout request if refresh fails.
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }

                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export default api;
