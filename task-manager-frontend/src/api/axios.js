
import axios from "axios";

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    withCredentials: true,
});

function getCookie(name) {
    const cookies = document.cookie
        ? document.cookie.split(";")
        : [];

    for (const cookie of cookies) {
        const trimmedCookie = cookie.trim();

        if (trimmedCookie.startsWith(`${name}=`)) {
            return decodeURIComponent(
                trimmedCookie.substring(name.length + 1)
            );
        }
    }

    return null;
}

api.interceptors.request.use((config) => {
    const csrfToken = getCookie("csrftoken");

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

        if (
            error.response?.status === 401 &&
            originalRequest &&
            !originalRequest._retry &&
            !originalRequest.url?.includes("token/") &&
            !originalRequest.url?.includes("logout/") &&
            !originalRequest.url?.includes("register/") &&
            !originalRequest.url?.includes("csrf/")
        ) {
            originalRequest._retry = true;

            try {
                // Ensure a CSRF cookie exists before refreshing.
                if (!getCookie("csrftoken")) {
                    await api.get("csrf/");
                }

                await api.post("token/refresh/", {});

                // The browser receives the new access cookie
                // automatically from the server.
                return api(originalRequest);
            } catch (refreshError) {
                console.error(
                    "Session refresh failed:",
                    refreshError.response?.status ||
                        refreshError.message
                );

                // Best-effort cookie cleanup through Django.
                try {
                    if (!getCookie("csrftoken")) {
                        await api.get("csrf/");
                    }

                    await api.post("logout/", {});
                } catch {
                    // The session may already be expired.
                }

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
