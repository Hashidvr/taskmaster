
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    FolderKanban,
    ListTodo,
} from "lucide-react";

import api from "../api/axios";

function ProjectDetails() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const fetchProject = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await api.get(`projects/${id}/`);

                if (!cancelled) {
                    setProject(response.data);
                }
            } catch (error) {
                console.error(error);

                if (!cancelled) {
                    setError(
                        error.response?.status === 404
                            ? "Project not found."
                            : "Failed to load project. Please try again."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        fetchProject();

        return () => {
            cancelled = true;
        };
    }, [id]);

    if (loading) {
        return (
            <main className="project-details-page">
                <div className="project-details-message">
                    Loading project...
                </div>
            </main>
        );
    }

    if (error || !project) {
        return (
            <main className="project-details-page">
                <button
                    className="secondary-button"
                    onClick={() => navigate("/projects")}
                >
                    <ArrowLeft size={16} />
                    Back to projects
                </button>

                <div className="project-details-message">
                    {error || "Project not found."}
                </div>
            </main>
        );
    }

    const tasks = project.tasks || [];
    const completedCount = tasks.filter(
        (task) => task.completed
    ).length;
    const pendingCount = tasks.length - completedCount;

    return (
        <main className="project-details-page">
            <button
                className="project-back-button"
                onClick={() => navigate("/projects")}
            >
                <ArrowLeft size={17} />
                All projects
            </button>

            <section className="project-details-header">
                <div className="project-details-icon">
                    <FolderKanban size={27} />
                </div>

                <p className="page-eyebrow">PROJECT WORKSPACE</p>

                <h1>{project.name}</h1>

                <p className="page-description">
                    All the tasks assigned to this project, in one place.
                </p>

                <div className="project-details-stats">
                    <div>
                        <ListTodo size={18} />
                        <strong>{tasks.length}</strong>
                        <span>Total tasks</span>
                    </div>

                    <div>
                        <CheckCircle2 size={18} />
                        <strong>{completedCount}</strong>
                        <span>Completed</span>
                    </div>

                    <div>
                        <Circle size={18} />
                        <strong>{pendingCount}</strong>
                        <span>Pending</span>
                    </div>
                </div>
            </section>

            <section className="project-task-section">
                <div className="project-task-heading">
                    <div>
                        <h2>Project tasks</h2>
                        <p>Track the work that belongs to this project.</p>
                    </div>

                    <button
                        className="primary-button"
                        onClick={() => navigate("/tasks")}
                    >
                        + Add task
                    </button>
                </div>

                {tasks.length === 0 ? (
                    <div className="project-details-empty">
                        <ListTodo size={30} />
                        <h3>No tasks in this project yet</h3>
                        <p>
                            Create a task and assign it to this project.
                        </p>
                        <button
                            className="primary-button"
                            onClick={() => navigate("/tasks")}
                        >
                            Create a task
                        </button>
                    </div>
                ) : (
                    <div className="project-detail-task-list">
                        {tasks.map((task) => (
                            <button
                                type="button"
                                className="project-detail-task"
                                key={task.id}
                                onClick={() =>
                                    navigate(`/tasks/${task.id}`)
                                }
                            >
                                <span
                                    className={`project-task-check ${
                                        task.completed ? "is-complete" : ""
                                    }`}
                                >
                                    {task.completed ? (
                                        <CheckCircle2 size={21} />
                                    ) : (
                                        <Circle size={21} />
                                    )}
                                </span>

                                
                                <span className="project-detail-task-title">
                                    <strong className={task.completed ? "is-complete" : ""}>
                                        {task.title}
                                    </strong>

                                    <span className="task-created-date">
                                        Created on{" "}
                                        {task.created_at
                                            ? new Date(task.created_at).toLocaleDateString("en-IN", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })
                                            : "Date unavailable"}
                                    </span>
                                </span>


                                <span
                                    className={`project-task-status ${
                                        task.completed
                                            ? "is-complete"
                                            : "is-pending"
                                    }`}
                                >
                                    {task.completed
                                        ? "Completed"
                                        : "Pending"}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </section>
        </main>
    );
}

export default ProjectDetails;
