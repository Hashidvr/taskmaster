import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import LogoutConfirmation from "../components/LogoutConfirmation";
import {
    Check,
    Plus,
    Trash2,
    Upload,
    FileText,
    Sparkles,
    LoaderCircle,
    X,
} from "lucide-react";

import api from "../api/axios";
import { useAuth } from "../context/authContextDefinition";
import { fetchAllPages } from "../api/pagination";

function Dashboard() {
    const navigate = useNavigate();
    const { logout, username } = useAuth();

    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // AI document analysis state
    const [selectedFile, setSelectedFile] = useState(null);
    const [analyzingFile, setAnalyzingFile] = useState(false);
    const [analysisError, setAnalysisError] = useState("");
    const [analysisSuccess, setAnalysisSuccess] = useState("");
    const [suggestion, setSuggestion] = useState(null);
    const [savingSuggestion, setSavingSuggestion] = useState(false);

    // Project selection for suggested tasks
    const [projects, setProjects] = useState([]);
    const [selectedProjectId, setSelectedProjectId] = useState("");

    const fetchAllTasks = async () => {
        try {
            setLoading(true);
            setError("");

            const allTasks = await fetchAllPages("tasks/");
            setTasks(allTasks);
        } catch (error) {
            console.error(error);

            if (error.response?.data) {
                setError(JSON.stringify(error.response.data));
            } else {
                setError("Failed to load dashboard.");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let active = true;

        const loadDashboard = async () => {
            try {
                setLoading(true);
                setError("");

                const [allTasks, allProjects] = await Promise.all([
                    fetchAllPages("tasks/"),
                    fetchAllPages("projects/"),
                ]);

                if (active) {
                    setTasks(allTasks);
                    setProjects(allProjects);
                }
            } catch (error) {
                console.error(error);

                if (active) {
                    if (error.response?.data) {
                        setError(JSON.stringify(error.response.data));
                    } else {
                        setError("Failed to load dashboard.");
                    }
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadDashboard();

        return () => {
            active = false;
        };
    }, []);

    const deleteTask = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this task?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await api.delete(`tasks/${id}/`);
            await fetchAllTasks();
        } catch (error) {
            console.error(error);
            setError("Failed to delete task.");
        }
    };

    // Analyze a document and suggest task details.
    // This function does NOT create a task.
    const analyzeTaskFile = async () => {
        if (!selectedFile) {
            setAnalysisError("Please select a document first.");
            return;
        }

        const allowedExtensions = [".pdf", ".docx", ".txt"];
        const fileName = selectedFile.name.toLowerCase();

        if (!allowedExtensions.some((ext) => fileName.endsWith(ext))) {
            setAnalysisError(
                "Only PDF, DOCX, and TXT files are supported."
            );
            return;
        }

        if (selectedFile.size > 10 * 1024 * 1024) {
            setAnalysisError("File size must not exceed 10 MB.");
            return;
        }

        const formData = new FormData();
        formData.append("file", selectedFile);

        setAnalyzingFile(true);
        setAnalysisError("");
        setAnalysisSuccess("");
        setSuggestion(null);
        setSelectedProjectId("");

        try {
            const response = await api.post(
                "tasks/analyze-file/",
                formData
            );

            const result = response.data;

            setSuggestion({
                title: result.title || "",
                description: result.description || "",
                due_date: result.due_date
                    ? result.due_date.length === 10
                        ? `${result.due_date}T00:00`
                        : result.due_date.slice(0, 16)
                    : "",
            });
        } catch (error) {
            console.error("AI task analysis failed:", error);

            setAnalysisError(
                error.response?.data?.error ||
                    "Unable to analyze this document. Please try again."
            );
        } finally {
            setAnalyzingFile(false);
        }
    };

    // Create a task only after the user confirms the suggestion.
    const createSuggestedTask = async () => {
        if (!suggestion) {
            return;
        }

        if (suggestion.title.trim().length < 3) {
            setAnalysisError(
                "The task title must contain at least 3 characters."
            );
            return;
        }

        setSavingSuggestion(true);
        setAnalysisError("");
        setAnalysisSuccess("");

        try {
            await api.post("tasks/", {
                title: suggestion.title.trim(),
                description: suggestion.description,
                project_id: selectedProjectId
                    ? Number(selectedProjectId)
                    : null,
                due_date: suggestion.due_date || null,
            });


            setSuggestion(null);
            setSelectedFile(null);
            setSelectedProjectId("");
            setAnalysisSuccess("Task created successfully.");

            await fetchAllTasks();
        } catch (error) {
            console.error("Failed to create suggested task:", error);

            setAnalysisError(
                error.response?.data
                    ? JSON.stringify(error.response.data)
                    : "Failed to create the task. Please try again."
            );
        } finally {
            setSavingSuggestion(false);
        }
    };

    const getDeadlineStatus = (task) => {
        if (!task.due_date) {
            return {
                label: "No deadline",
                className: "status-none",
            };
        }

        if (task.completed) {
            return {
                label: "Completed",
                className: "status-upcoming",
            };
        }

        const now = new Date();
        const due = new Date(task.due_date);

        if (due < now) {
            return {
                label: "Overdue",
                className: "status-overdue",
            };
        }

        const today = new Date();

        const isToday =
            due.getFullYear() === today.getFullYear() &&
            due.getMonth() === today.getMonth() &&
            due.getDate() === today.getDate();

        if (isToday) {
            return {
                label: "Due today",
                className: "status-today",
            };
        }

        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        const isTomorrow =
            due.getFullYear() === tomorrow.getFullYear() &&
            due.getMonth() === tomorrow.getMonth() &&
            due.getDate() === tomorrow.getDate();

        if (isTomorrow) {
            return {
                label: "Due tomorrow",
                className: "status-today",
            };
        }

        const daysDifference =
            (due - now) / (1000 * 60 * 60 * 24);

        if (daysDifference <= 7) {
            return {
                label: "This week",
                className: "status-today",
            };
        }

        return {
            label: "Later",
            className: "status-upcoming",
        };
    };

    const totalTasks = tasks.length;

    const completedTasks = tasks.filter(
        (task) => task.completed
    ).length;

    const urgentTasks = tasks.filter((task) => {
        if (!task.due_date || task.completed) {
            return false;
        }

        const due = new Date(task.due_date);
        const now = new Date();

        return due <= now;
    }).length;

    const thisWeekTasks = tasks.filter((task) => {
        if (!task.due_date || task.completed) {
            return false;
        }

        const now = new Date();
        const due = new Date(task.due_date);

        const difference =
            (due - now) / (1000 * 60 * 60 * 24);

        return difference >= 0 && difference <= 7;
    }).length;

    const completionPercentage =
        totalTasks === 0
            ? 0
            : Math.round(
                  (completedTasks / totalTasks) * 100
              );

    const sortedTasks = [...tasks].sort((a, b) => {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;

        return new Date(a.due_date) - new Date(b.due_date);
    });

    return (
        <>
            <header className="app-header">
                <div className="logo">
                    <div className="logo-icon">
                        <Check size={22} />
                    </div>

                    <span>TaskMaster</span>
                </div>

                <div className="header-actions">
                    <button
                        className="primary-button"
                        onClick={() => navigate("/tasks")}
                    >
                        <Plus
                            size={17}
                            style={{
                                verticalAlign: "middle",
                                marginRight: "6px",
                            }}
                        />
                        Add task
                    </button>

                    
                    <button
                        className="secondary-button"
                        onClick={() => setShowLogoutConfirm(true)}
                    >
                        Logout
                    </button>

                </div>
            </header>

            <main className="dashboard">
                <div className="dashboard-top">
                    <div className="dashboard-title">
                        <h1>
                            Welcome back, {username || "there"}!
                        </h1>

                        <p>
                            Ready to make today productive? Let's get
                            things done.
                        </p>
                    </div>
                </div>

                {error && <p>{error}</p>}

                {/* Statistics */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-number">
                            {urgentTasks}
                        </div>

                        <div className="stat-label">urgent</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-number">
                            {thisWeekTasks}
                        </div>

                        <div className="stat-label">this week</div>
                    </div>

                    <div className="stat-card">
                        <div className="stat-number">
                            {completionPercentage}%
                        </div>

                        <div className="stat-label">completed</div>
                    </div>
                </div>

                {/* Existing Import section with AI integration */}
                <div className="empty-state ai-import-section">
                    <Upload
                        size={28}
                        style={{ marginBottom: "10px" }}
                    />

                    <h3>Import task list</h3>

                    <p>
                        Upload a PDF, DOCX, or TXT document to generate
                        an AI-powered task suggestion.
                    </p>

                    <label className="ai-file-input">
                        <FileText size={18} />

                        <span>
                            {selectedFile
                                ? selectedFile.name
                                : "Choose document"}
                        </span>

                        <input
                            type="file"
                            accept=".pdf,.docx,.txt"
                            disabled={
                                analyzingFile || savingSuggestion
                            }
                            onChange={(event) => {
                                setSelectedFile(
                                    event.target.files?.[0] || null
                                );
                                setAnalysisError("");
                                setAnalysisSuccess("");
                                setSuggestion(null);
                            }}
                        />
                    </label>

                    <p className="ai-file-hint">
                        PDF, DOCX, or TXT · Maximum 10 MB
                    </p>

                    <button
                        type="button"
                        className="primary-button"
                        onClick={analyzeTaskFile}
                        disabled={
                            !selectedFile ||
                            analyzingFile ||
                            savingSuggestion
                        }
                    >
                        {analyzingFile ? (
                            <>
                                <LoaderCircle
                                    size={17}
                                    className="ai-spin"
                                />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles size={17} />
                                Analyze document
                            </>
                        )}
                    </button>

                    {analysisError && (
                        <p className="ai-import-error">
                            {analysisError}
                        </p>
                    )}

                    {analysisSuccess && (
                        <p className="ai-import-success">
                            {analysisSuccess}
                        </p>
                    )}

                    {suggestion && (
                        <div className="ai-suggestion-form">
                            <h3>Review AI suggestion</h3>

                            <p>
                                Review and edit the details before
                                creating your task.
                            </p>

                            <label>
                                Task title

                                <input
                                    type="text"
                                    value={suggestion.title}
                                    maxLength={200}
                                    onChange={(event) =>
                                        setSuggestion({
                                            ...suggestion,
                                            title: event.target.value,
                                        })
                                    }
                                />
                            </label>

                            <label>
                                Description

                                <textarea
                                    rows={4}
                                    value={suggestion.description}
                                    onChange={(event) =>
                                        setSuggestion({
                                            ...suggestion,
                                            description:
                                                event.target.value,
                                        })
                                    }
                                />
                            </label>

                            <label>
                                Deadline

                                <input
                                    type="datetime-local"
                                    value={suggestion.due_date}
                                    onChange={(event) =>
                                        setSuggestion({
                                            ...suggestion,
                                            due_date: event.target.value,
                                        })
                                    }
                                />
                            </label>

                            <label>
                                Project

                                <select
                                    value={selectedProjectId}
                                    onChange={(event) =>
                                        setSelectedProjectId(
                                            event.target.value
                                        )
                                    }
                                >
                                    <option value="">
                                        No project — create standalone task
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
                            </label>

                            <div className="ai-suggestion-actions">
                                <button
                                    type="button"
                                    className="primary-button"
                                    onClick={createSuggestedTask}
                                    disabled={
                                        savingSuggestion ||
                                        analyzingFile
                                    }
                                >
                                    {savingSuggestion
                                        ? "Creating task..."
                                        : "Create task"}
                                </button>

                                <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => {
                                        setSuggestion(null);
                                        setAnalysisError("");
                                    }}
                                    disabled={savingSuggestion}
                                >
                                    <X size={16} />
                                    Discard
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Task section */}
                <div
                    className="section-header"
                    style={{ marginTop: "38px" }}
                >
                    <h2>Your Tasks</h2>

                    <span className="task-meta">
                        {totalTasks} tasks
                    </span>
                </div>

                {loading ? (
                    <div className="empty-state">
                        Loading tasks...
                    </div>
                ) : sortedTasks.length === 0 ? (
                    <div className="empty-state">
                        <h3>No tasks yet</h3>

                        <p>
                            Create your first task to get started.
                        </p>

                        <button
                            className="primary-button"
                            onClick={() => navigate("/tasks")}
                        >
                            <Plus
                                size={17}
                                style={{
                                    verticalAlign: "middle",
                                    marginRight: "6px",
                                }}
                            />
                            Create task
                        </button>
                    </div>
                ) : (
                    <div className="task-list">
                        {sortedTasks.map((task) => {
                            const status = getDeadlineStatus(task);

                            return (
                                <div
                                    className="task-card"
                                    key={task.id}
                                    role="link"
                                    tabIndex={0}
                                    onClick={() =>
                                        navigate(`/tasks/${task.id}`)
                                    }
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            navigate(
                                                `/tasks/${task.id}`
                                            );
                                        }
                                    }}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="task-content">
                                        <div
                                            className={`task-title ${
                                                task.completed
                                                    ? "completed"
                                                    : ""
                                            }`}
                                        >
                                            {task.title}
                                        </div>

                                        <div className="task-meta">
                                            {task.due_date
                                                ? `${status.label} · `
                                                : ""}
                                            {task.project?.name ||
                                                "No project"}
                                        </div>
                                    </div>

                                    <div className="task-actions">
                                        <span
                                            className={`status-badge ${status.className}`}
                                        >
                                            {status.label}
                                        </span>

                                        <button
                                            className="icon-button"
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                deleteTask(task.id);
                                            }}
                                            title="Delete task"
                                            aria-label={`Delete ${task.title}`}
                                        >
                                            <Trash2 size={17} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            
            </main>

            <LogoutConfirmation
                isOpen={showLogoutConfirm}
                onCancel={() => setShowLogoutConfirm(false)}
                onConfirm={() => {
                    logout();
                    navigate("/login");
                }}
            />

        </>
    );
}

export default Dashboard;