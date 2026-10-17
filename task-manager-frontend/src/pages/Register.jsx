
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    Eye,
    EyeOff,
    CheckSquare,
    ArrowRight,
    LoaderCircle,
} from "lucide-react";

import api from "../api/axios";

function Register() {
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            await api.post("auth/register/", {
                username: username.trim(),
                email: email.trim(),
                password,
            });

            navigate("/login", {
                state: { message: "Account created successfully! Please sign in." },
            });
        } catch (error) {
            const data = error.response?.data;

            if (data && typeof data === "object") {
                const messages = Object.entries(data)
                    .map(([field, value]) => {
                        const details = Array.isArray(value)
                            ? value.join(" ")
                            : typeof value === "string"
                                ? value
                                : JSON.stringify(value);

                        return `${field === "non_field_errors" ? "" : `${field}: `}${details}`;
                    })
                    .join(" ");

                setError(messages || "Registration failed. Please try again.");
            } else {
                setError("Unable to connect to the server. Please try again.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="auth-page">
            <section className="auth-card">
                <Link to="/login" className="auth-brand">
                    <span className="auth-logo">
                        <CheckSquare size={25} />
                    </span>
                    <span>TaskMaster</span>
                </Link>

                <div className="auth-heading">
                    <p className="auth-eyebrow">GET STARTED</p>
                    <h1>Create your account</h1>
                    <p>Build better habits and keep all your tasks organized.</p>
                </div>

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label htmlFor="register-username">Username</label>
                        <input
                            id="register-username"
                            type="text"
                            placeholder="Choose a username"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            autoComplete="username"
                            minLength={3}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="register-email">Email address</label>
                        <input
                            id="register-email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            autoComplete="email"
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="register-password">Password</label>
                        <div className="auth-password-wrap">
                            <input
                                id="register-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Create a strong password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="new-password"
                                minLength={8}
                                required
                            />

                            <button
                                type="button"
                                className="auth-password-toggle"
                                onClick={() => setShowPassword((previous) => !previous)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <p className="auth-field-hint">
                            Use at least 8 characters, subject to your server's password rules.
                        </p>
                    </div>

                    {error && (
                        <div className="auth-error" role="alert">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="auth-submit"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <LoaderCircle size={18} className="auth-spinner" />
                                Creating account...
                            </>
                        ) : (
                            <>
                                Create account
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <p className="auth-switch">
                    Already have an account? <Link to="/login">Sign in</Link>
                </p>

                <p className="auth-footer">
                    Your workspace starts here.
                </p>
            </section>
        </main>
    );
}

export default Register;
