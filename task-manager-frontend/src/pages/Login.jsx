
import { useState } from "react";
import { useAuth } from "../context/authContextDefinition";
import { Eye, EyeOff, CheckSquare, ArrowRight, LoaderCircle } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

function Login() {
    const location = useLocation();
    const { login } = useAuth();
    const navigate = useNavigate();

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(username.trim(), password);
            navigate("/dashboard");
        } catch {
            setError("Invalid username or password. Please try again.");
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
                    <p className="auth-eyebrow">WELCOME BACK</p>
                    <h1>Sign in to your workspace</h1>
                    <p>Pick up where you left off. Your tasks are waiting.</p>
                </div>
                {location.state?.message && (
                    <div className="auth-success" role="status">
                        {location.state.message}
                    </div>
                )}

                <form className="auth-form" onSubmit={handleSubmit}>
                    <div className="auth-field">
                        <label htmlFor="login-username">Username</label>
                        <input
                            id="login-username"
                            type="text"
                            placeholder="Enter your username"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            autoComplete="username"
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label htmlFor="login-password">Password</label>
                        <div className="auth-password-wrap">
                            <input
                                id="login-password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                autoComplete="current-password"
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
                                Signing in...
                            </>
                        ) : (
                            <>
                                Sign in
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <p className="auth-switch">
                    Don't have an account? <Link to="/register">Create one</Link>
                </p>

                <p className="auth-footer">
                    Organize your work. Focus on what matters.
                </p>
            </section>
        </main>
    );
}

export default Login;
