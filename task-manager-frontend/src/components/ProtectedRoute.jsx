
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authContextDefinition";

function ProtectedRoute({ children }) {
    const { isAuthenticated, authLoading } = useAuth();

    if (authLoading) {
        return (
            <div className="auth-loading">
                Checking your session...
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
