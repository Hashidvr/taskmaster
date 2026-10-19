
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
        try {
            await ensureCsrfToken();
        } catch {
            throw new Error(
                "Could not obtain the CSRF token. Please try again."
            );
        }

        try {
            await api.post("token/", {
                username: usernameInput,
                password,
            });
        } catch (error) {
            const status = error.response?.status;

            if (status === 401) {
                throw new Error(
                    "The backend rejected the login credentials (token endpoint returned 401)."
                );
            }

            throw new Error(
                `Login request failed (HTTP ${status ?? "network error"}).`
            );
        }

        try {
            const response = await api.get("auth/me/");

            setUsername(response.data.username || usernameInput);
            setIsAuthenticated(true);
        } catch (error) {
            const status = error.response?.status;

            if (status === 401) {
                throw new Error(
                    "Login was accepted, but session verification failed (auth/me returned 401)."
                );
            }

            throw new Error(
                `Session verification failed (HTTP ${status ?? "network error"}).`
            );
        }
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
