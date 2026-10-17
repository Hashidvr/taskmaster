
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, Pencil, Save, X } from "lucide-react";

import api from "../api/axios";
import { fetchAllPages } from "../api/pagination";

function TaskDetails() {
    const { taskId } = useParams();
    const navigate = useNavigate();

    const [task, setTask] = useState(null);
    const [projects, setProjects] = useState([]);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [projectId, setProjectId] = useState("");
    const [dueDate, setDueDate] = useState("");
    const [completed, setCompleted] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const loadTask = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await api.get(`tasks/${taskId}/`);
            const currentTask = response.data;

            setTask(currentTask);
            setTitle(currentTask.title || "");
            setDescription(currentTask.description || "");

            setProjectId(
                currentTask.project?.id
                    ? String(currentTask.project.id)
                    : currentTask.project_id
                        ? String(currentTask.project_id)
                        : ""
            );

            setDueDate(
                currentTask.due_date
                    ? currentTask.due_date.slice(0, 16)
                    : ""
            );

            setCompleted(Boolean(currentTask.completed));
        } catch (err) {
            console.error("LOAD TASK ERROR:", err);
            setError("Failed to load task details.");
        } finally {
            setLoading(false);
        }
    };

    
    useEffect(() => {
        let active = true;

        const loadTaskDetails = async () => {
            try {
                setError("");

                const response = await api.get(`tasks/${taskId}/`);

                if (!active) return;

                const currentTask = response.data;

                setTask(currentTask);
                setTitle(currentTask.title || "");
                setDescription(currentTask.description || "");

                setProjectId(
                    currentTask.project?.id
                        ? String(currentTask.project.id)
                        : currentTask.project_id
                            ? String(currentTask.project_id)
                            : ""
                );

                setDueDate(
                    currentTask.due_date
                        ? currentTask.due_date.slice(0, 16)
                        : ""
                );

                setCompleted(Boolean(currentTask.completed));
            } catch (err) {
                console.error("LOAD TASK ERROR:", err);

                if (active) {
                    setError("Failed to load task details.");
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        const loadProjects = async () => {
            try {
                const allProjects = await fetchAllPages("projects/");

                if (active) {
                    setProjects(allProjects);
                }
            } catch (err) {
                console.error("LOAD PROJECTS ERROR:", err);
            }
        };

        loadTaskDetails();
        loadProjects();

        return () => {
            active = false;
        };
    }, [taskId]);


    const cancelEditing = () => {
        setTitle(task.title || "");
        setDescription(task.description || "");

        setProjectId(
            task.project?.id
                ? String(task.project.id)
                : task.project_id
                    ? String(task.project_id)
                    : ""
        );

        setDueDate(
            task.due_date
                ? task.due_date.slice(0, 16)
                : ""
        );

        setCompleted(Boolean(task.completed));
        setError("");
        setIsEditing(false);
    };

    const handleCompletionChange = (event) => {
        const nextCompleted = event.target.checked;

        // No confirmation is needed if the selection matches
        // the task's currently saved status.
        if (nextCompleted === Boolean(task.completed)) {
            setCompleted(nextCompleted);
            return;
        }

        const message = nextCompleted
            ? "Are you sure you want to mark this task as completed? You must still save your changes."
            : "Are you sure you want to mark this task as incomplete? You must still save your changes.";

        // Confirm immediately when the checkbox is toggled.
        if (window.confirm(message)) {
            setCompleted(nextCompleted);
        }
    };

    const saveChanges = async (event) => {
        event.preventDefault();

        if (!title.trim()) {
            setError("Task title is required.");
            return;
        }
        try {
            setSaving(true);
            setError("");

            // The backend is updated only after Save changes is clicked.
            await api.patch(`tasks/${taskId}/`, {
                title: title.trim(),
                description: description.trim(),
                project_id: projectId ? Number(projectId) : null,
                due_date: dueDate || null,
                completed: completed,
            });

            await loadTask();
            setIsEditing(false);
        } catch (err) {
            console.error("SAVE TASK ERROR:", err);

            setError(
                err.response?.data
                    ? JSON.stringify(err.response.data)
                    : "Failed to save task changes."
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="tasks-empty">
                Loading task details...
            </div>
        );
    }

    if (!task) {
        return (
            <div className="tasks-page">
                <button
                    className="secondary-button"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={16} />
                    Go back
                </button>

                <div className="task-error">
                    {error || "Task not found."}
                </div>
            </div>
        );
    }

    return (
        <div className="tasks-page">
            <div className="tasks-page-header">
                <div>
                    <p className="page-eyebrow">TASK DETAILS</p>
                    <h1>{task.title}</h1>
                    <p className="page-description">
                        View and manage your task.
                    </p>
                </div>
            </div>

            <div className="task-form-card">
                <div className="task-form-header">
                    <div className="form-icon">
                        <Check size={18} />
                    </div>

                    <div>
                        <h2>Task information</h2>
                        <p>
                            Review the details and update your progress.
                        </p>
                    </div>
                </div>

                {error && (
                    <div className="task-error">{error}</div>
                )}

                <form
                    className="task-form"
                    onSubmit={saveChanges}
                >
                    <div className="form-field">
                        <label>Task title</label>
                        <input
                            value={title}
                            readOnly={!isEditing}
                            onChange={(event) =>
                                setTitle(event.target.value)
                            }
                        />
                    </div>

                    <div className="form-field">
                        <label>Description</label>
                        <textarea
                            value={description}
                            readOnly={!isEditing}
                            onChange={(event) =>
                                setDescription(event.target.value)
                            }
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-field">
                            <label>Project</label>
                            <select
                                value={projectId}
                                disabled={!isEditing || saving}
                                onChange={(event) =>
                                    setProjectId(event.target.value)
                                }
                            >
                                <option value="">
                                    No project (standalone)
                                </option>

                                {projects.map((project) => (
                                    <option
                                        key={project.id}
                                        value={project.id}
                                    >
                                        {project.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-field">
                            <label>Deadline</label>
                            <input
                                type={
                                    isEditing
                                        ? "datetime-local"
                                        : "text"
                                }
                                readOnly={!isEditing}
                                value={
                                    isEditing
                                        ? dueDate
                                        : task.due_date
                                            ? new Date(
                                                task.due_date
                                            ).toLocaleString()
                                            : "No deadline"
                                }
                                onChange={(event) =>
                                    setDueDate(event.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="form-field">
                        <label>Created date</label>
                        <input
                            readOnly
                            value={
                                task.created_at
                                    ? new Date(
                                        task.created_at
                                    ).toLocaleString()
                                    : "Not available"
                            }
                        />
                    </div>

                    <div className="form-field">
                        <label className="task-completion-control">
                            <input
                                className="task-completion-checkbox"
                                type="checkbox"
                                checked={completed}
                                disabled={!isEditing || saving}
                                onChange={handleCompletionChange}
                            />

                            <span
                                className="task-completion-switch"
                                aria-hidden="true"
                            />

                            <span className="task-completion-label">
                                {completed
                                    ? "Completed"
                                    : "Mark as completed"}
                            </span>
                        </label>
                    </div>

                    <div className="form-actions">
                        {isEditing ? (
                            <>
                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={cancelEditing}
                                    disabled={saving}
                                >
                                    <X size={16} />
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="primary-button"
                                    disabled={saving}
                                >
                                    <Save size={16} />
                                    {saving
                                        ? "Saving..."
                                        : "Save changes"}
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className="primary-button"
                                onClick={() => setIsEditing(true)}
                            >
                                <Pencil size={16} />
                                Edit task
                            </button>
                        )}

                        <button
                            type="button"
                            className="secondary-button"
                            onClick={() => navigate(-1)}
                            disabled={saving}
                        >
                            <ArrowLeft size={16} />
                            Back
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default TaskDetails;
