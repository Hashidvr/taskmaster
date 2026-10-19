
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Projects from "./pages/Projects";
import Tasks from "./pages/Tasks";

import ProtectedRoute from "./components/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import TaskDetails from "./pages/TaskDetails";
import ProjectDetails from "./pages/ProjectDetails";

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route
                    path="/"
                    element={<Navigate to="/login" replace />}
                />

                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route
                    element={
                        <ProtectedRoute>
                            <AppLayout />
                        </ProtectedRoute>
                    }
                >
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/tasks" element={<Tasks />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/tasks/:taskId" element={<TaskDetails />} />
                    <Route path="projects/:id" element={<ProjectDetails />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
