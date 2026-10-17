import { useState } from "react";
import LogoutConfirmation from "./LogoutConfirmation";
import {
    CheckSquare,
    FolderKanban,
    LayoutDashboard,
    LogOut,
    Settings,
} from "lucide-react";

import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/authContextDefinition";

function Sidebar() {
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    const isActive = (path) => {
        return location.pathname === path;
    };

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <aside className="sidebar">

            <div className="sidebar-logo">
                <div className="logo-icon">
                    <CheckSquare size={20} />
                </div>

                <span>TaskMaster</span>
            </div>

            <nav className="sidebar-nav">

                <button
                    className={`sidebar-link ${
                        isActive("/dashboard")
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        navigate("/dashboard")
                    }
                >
                    <LayoutDashboard size={18} />
                    <span>Overview</span>
                </button>

                <button
                    className={`sidebar-link ${
                        isActive("/tasks")
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        navigate("/tasks")
                    }
                >
                    <CheckSquare size={18} />
                    <span>Tasks</span>
                </button>

                <button
                    className={`sidebar-link ${
                        isActive("/projects")
                            ? "active"
                            : ""
                    }`}
                    onClick={() =>
                        navigate("/projects")
                    }
                >
                    <FolderKanban size={18} />
                    <span>Projects</span>
                </button>

            </nav>

            <div className="sidebar-bottom">

                <button
                    className="sidebar-link"
                    onClick={() => {}}
                >
                    <Settings size={18} />
                    <span>Settings</span>
                </button>

                <button
                    className="sidebar-link logout-link"
                    onClick={() => setShowLogoutConfirm(true)}
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>

            </div>
            <LogoutConfirmation
                isOpen={showLogoutConfirm}
                onCancel={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
            />

        </aside>
    );
}

export default Sidebar;