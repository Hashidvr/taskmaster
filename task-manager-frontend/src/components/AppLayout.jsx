import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";

function AppLayout() {
    return (
        <div className="app-with-sidebar">
            <Sidebar />

            <div className="app">
                <Outlet />
            </div>
        </div>
    );
}

export default AppLayout;