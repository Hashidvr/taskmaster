
import {
    useEffect,
    useState,
} from "react";

import { AuthContext } from "./authContextDefinition";
import api, { ensureCsrfToken } from "../api/axios";

export function AuthProvider({ children }) {
    const [username, setUsername] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const restoreSession = async () => {
            try {
                // Fetch and retain the CSRF token before API requests.
                await ensureCsrfToken();

                const response = await api.get("auth/me/");

                if (active) {
                    setUsername(response.data.username);
                    setIsAuthenticated(true);
                }
            } catch {
                if (active) {
                    setUsername(null);
                    setIsAuthenticated(false);
                }
            } finally {
                if (active) {
                    setAuthLoading(false);
                }
            }
        };

        restoreSession();

        return () => {
            active = false;
        };
    }, []);

    const login = async (usernameInput, password) => {
        // Obtain the CSRF token before submitting credentials.
        await ensureCsrfToken();

        await api.post("token/", {
            username: usernameInput,
            password,
        });

        // Verify that the backend accepted the session cookies.
        const response = await api.get("auth/me/");

        setUsername(response.data.username || usernameInput);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            await ensureCsrfToken();
            await api.post("logout/", {});
        } finally {
            setUsername(null);
            setIsAuthenticated(false);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                username,
                isAuthenticated,
                authLoading,

                // Compatibility flag, not an actual JWT.
                accessToken: isAuthenticated ? true : null,

                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}
