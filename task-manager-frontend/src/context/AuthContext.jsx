
import {
    useEffect,
    useState,
} from "react";
import { AuthContext } from "./authContextDefinition";
import api from "../api/axios";

export function AuthProvider({ children }) {
    const [username, setUsername] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [authLoading, setAuthLoading] = useState(true);

    useEffect(() => {
        let active = true;

        const restoreSession = async () => {
            try {
                // Obtain a CSRF cookie before authenticated requests.
                await api.get("csrf/");

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
        await api.get("csrf/");

        await api.post("token/", {
            username: usernameInput,
            password,
        });

        const response = await api.get("auth/me/");

        setUsername(response.data.username || usernameInput);
        setIsAuthenticated(true);
    };

    const logout = async () => {
        try {
            await api.get("csrf/");
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
