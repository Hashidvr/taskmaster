import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Check,
    CirclePlus,
    FolderKanban,
    Inbox,
    Pencil,
    Trash2,
    X,
} from "lucide-react";

import api from "../api/axios";
import { fetchAllPages } from "../api/pagination";

function Projects() {
    const navigate = useNavigate();

    const [projects, setProjects] = useState([]);
    const [allTasks, setAllTasks] = useState([]);

    const [name, setName] = useState("");
    const [editingId, setEditingId] = useState(null);

    const [search, setSearch] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(true);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            setError("");

            const [allProjects, fetchedTasks] = await Promise.all([
                fetchAllPages("projects/"),
                fetchAllPages("tasks/"),
            ]);

            setProjects(allProjects);
            setAllTasks(fetchedTasks);
        } catch (error) {
            console.error(error);

            setError(
                error.response?.data
                    ? JSON.stringify(error.response.data)
                    : "Failed to load projects and tasks."
            );
        } finally {
            setLoading(false);
        }
    };

    
    useEffect(() => {
        let active = true;

        const loadProjects = async () => {
            try {
                setError("");

                const [allProjects, fetchedTasks] = await Promise.all([
                    fetchAllPages("projects/"),
                    fetchAllPages("tasks/"),
                ]);

                if (active) {
                    setProjects(allProjects);
                    setAllTasks(fetchedTasks);
                }
            } catch (error) {
                console.error(error);

                if (active) {
                    setError(
                        error.response?.data
                            ? JSON.stringify(error.response.data)
                            : "Failed to load projects and tasks."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        };

        loadProjects();

        return () => {
            active = false;
        };
    }, []);


    const resetForm = () => {
        setName("");
        setEditingId(null);
        setError("");
    };

    const createProject = async (event) => {
        event.preventDefault();

        if (!name.trim()) {
            setError("Project name is required.");
            return;
        }

        try {
            await api.post("projects/", {
                name: name.trim(),
            });

            resetForm();
            await fetchProjects();
        } catch (error) {
            console.error(error);

            setError(
                error.response?.data
                    ? JSON.stringify(error.response.data)
                    : "Failed to create project."
            );
        }
    };

    const startEdit = (project) => {
        setEditingId(project.id);
        setName(project.name);
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const updateProject = async (event) => {
        event.preventDefault();

        if (!name.trim()) {
            setError("Project name is required.");
            return;
        }

        try {
            await api.patch(`projects/${editingId}/`, {
                name: name.trim(),
            });

            resetForm();
            await fetchProjects();
        } catch (error) {
            console.error(error);

            setError(
                error.response?.data
                    ? JSON.stringify(error.response.data)
                    : "Failed to update project."
            );
        }
    };

    const deleteProject = async (id) => {
        const confirmed = window.confirm(
            "Are you sure you want to delete this project?"
        );

        if (!confirmed) {
            return;
        }

        try {
            await api.delete(`projects/${id}/`);
            await fetchProjects();
        } catch (error) {
            console.error(error);
            setError("Failed to delete project.");
        }
    };

    const filteredProjects = useMemo(() => {
        return projects.filter((project) =>
            project.name
                .toLowerCase()
                .includes(search.toLowerCase())
        );
    }, [projects, search]);

    // Standalone tasks have no associated project.
    const standaloneTasks = useMemo(() => {
        return allTasks.filter(
            (task) => task.project == null
        );
    }, [allTasks]);

    const standaloneCompletedCount = standaloneTasks.filter(
        (task) => task.completed
    ).length;

    const standaloneTaskCount = standaloneTasks.length;

    const standalonePendingCount =
        standaloneTaskCount - standaloneCompletedCount;

    const standaloneProgress =
        standaloneTaskCount === 0
            ? 0
            : Math.round(
                  (standaloneCompletedCount /
                      standaloneTaskCount) *
                      100
              );

    // Count all tasks, including standalone tasks, exactly once.
    const totalTasks = allTasks.length;

    const completedTasks = allTasks.filter(
        (task) => task.completed
    ).length;

    const openStandaloneTasks = () => {
        navigate("/tasks?standalone=true");
    };

    return (
        <div className="projects-page">
            <div className="projects-page-header">
                <div>
                    <p className="page-eyebrow">
                        WORKSPACE
                    </p>

                    <h1>Projects</h1>

                    <p className="page-description">
                        Organize your tasks into focused workspaces.
                    </p>
                </div>

                <div className="project-summary">
                    <div>
                        <strong>{projects.length}</strong>
                        <span>Projects</span>
                    </div>

                    <div>
                        <strong>{totalTasks}</strong>
                        <span>Tasks</span>
                    </div>

                    <div>
                        <strong>{completedTasks}</strong>
                        <span>Completed</span>
                    </div>
                </div>
            </div>

            <div className="project-form-card">
                <div className="project-form-header">
                    <div className="project-form-icon">
                        {editingId !== null ? (
                            <Pencil size={18} />
                        ) : (
                            <CirclePlus size={18} />
                        )}
                    </div>

                    <div>
                        <h2>
                            {editingId !== null
                                ? "Edit project"
                                : "Create a project"}
                        </h2>

                        <p>
                            {editingId !== null
                                ? "Update your project name."
                                : "Create a workspace for your tasks."}
                        </p>
                    </div>
                </div>

                <form
                    className="project-form"
                    onSubmit={
                        editingId !== null
                            ? updateProject
                            : createProject
                    }
                >
                    <div className="project-input-wrapper">
                        <FolderKanban size={17} />

                        <input
                            type="text"
                            placeholder="e.g. Portfolio Website"
                            value={name}
                            onChange={(event) =>
                                setName(event.target.value)
                            }
                        />
                    </div>

                    <div className="project-form-actions">
                        {editingId !== null && (
                            <button
                                type="button"
                                className="secondary-button"
                                onClick={resetForm}
                            >
                                <X size={16} />
                                Cancel
                            </button>
                        )}

                        <button
                            type="submit"
                            className="primary-button"
                        >
                            {editingId !== null ? (
                                <>
                                    <Check size={16} />
                                    Save changes
                                </>
                            ) : (
                                <>
                                    <CirclePlus size={16} />
                                    Create project
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {error && (
                    <div className="project-error">
                        {error}
                    </div>
                )}
            </div>

            <div className="projects-toolbar">
                <div className="projects-search">
                    <FolderKanban size={17} />

                    <input
                        type="text"
                        placeholder="Search projects..."
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                    />
                </div>

                <span className="projects-count">
                    {filteredProjects.length + 1}{" "}
                    {filteredProjects.length + 1 === 1
                        ? "workspace"
                        : "workspaces"}
                </span>
            </div>

            {loading ? (
                <div className="projects-empty">
                    <FolderKanban size={28} />

                    <h3>Loading projects...</h3>

                    <p>
                        Getting your workspaces ready.
                    </p>
                </div>
            ) : (
                <>
    

                    <div className="projects-grid">
                        {/* Permanent Standalone Tasks card */}
                        <div
                            className="project-card standalone-project-card"
                            role="link"
                            tabIndex={0}
                            onClick={openStandaloneTasks}
                            onKeyDown={(event) => {
                                if (
                                    event.target === event.currentTarget &&
                                    (
                                        event.key === "Enter" ||
                                        event.key === " "
                                    )
                                ) {
                                    event.preventDefault();
                                    openStandaloneTasks();
                                }
                            }}
                            style={{ cursor: "pointer" }}
                        >
                            <div className="project-card-top">
                                <div className="project-icon">
                                    <Inbox size={20} />
                                </div>

                                <span>Built-in workspace</span>
                            </div>

                            <div className="project-card-content">
                                <h3>Standalone Tasks</h3>

                                <p>
                                    {standaloneTaskCount === 0
                                        ? "Tasks without an assigned project will appear here."
                                        : `${standaloneTaskCount} ${
                                              standaloneTaskCount === 1
                                                  ? "task"
                                                  : "tasks"
                                          } without a project.`}
                                </p>
                            </div>

                            <div className="project-progress">
                                <div className="project-progress-label">
                                    <span>Progress</span>

                                    <strong>
                                        {standaloneProgress}%
                                    </strong>
                                </div>

                                <div className="project-progress-track">
                                    <div
                                        className="project-progress-bar"
                                        style={{
                                            width: `${standaloneProgress}%`,
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="project-card-footer">
                                <span>
                                    {standaloneCompletedCount} completed
                                </span>

                                <span>
                                    {standalonePendingCount} pending
                                </span>
                            </div>
                        </div>

                        {/* Existing regular project cards */}
                        {filteredProjects.map((project) => {
                            const taskCount =
                                project.tasks?.length || 0;

                            const completedCount =
                                project.tasks?.filter(
                                    (task) => task.completed
                                ).length || 0;

                            const completionPercentage =
                                taskCount === 0
                                    ? 0
                                    : Math.round(
                                          (completedCount /
                                              taskCount) *
                                              100
                                      );

                            return (
                                <div
                                    className="project-card"
                                    key={project.id}
                                    role="link"
                                    tabIndex={0}
                                    onClick={() =>
                                        navigate(`/projects/${project.id}`)
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.target === event.currentTarget &&
                                            (
                                                event.key === "Enter" ||
                                                event.key === " "
                                            )
                                        ) {
                                            event.preventDefault();

                                            navigate(
                                                `/projects/${project.id}`
                                            );
                                        }
                                    }}
                                    style={{ cursor: "pointer" }}
                                >
                                    <div className="project-card-top">
                                        <div className="project-icon">
                                            <FolderKanban size={20} />
                                        </div>

                                        <div className="project-card-actions">
                                            <button
                                                type="button"
                                                className="project-action-button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    startEdit(project);
                                                }}
                                                title="Edit project"
                                                aria-label={`Edit ${project.name}`}
                                            >
                                                <Pencil size={16} />
                                            </button>

                                            <button
                                                type="button"
                                                className="project-action-button delete"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    deleteProject(project.id);
                                                }}
                                                title="Delete project"
                                                aria-label={`Delete ${project.name}`}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="project-card-content">
                                        <h3>{project.name}</h3>

                                        <p>
                                            {taskCount === 0
                                                ? "No tasks assigned yet."
                                                : `${taskCount} ${
                                                      taskCount === 1
                                                          ? "task"
                                                          : "tasks"
                                                  } in this project.`}
                                        </p>
                                    </div>

                                    <div className="project-progress">
                                        <div className="project-progress-label">
                                            <span>Progress</span>

                                            <strong>
                                                {completionPercentage}%
                                            </strong>
                                        </div>

                                        <div className="project-progress-track">
                                            <div
                                                className="project-progress-bar"
                                                style={{
                                                    width: `${completionPercentage}%`,
                                                }}
                                            />
                                        </div>
                                    </div>

                                    <div className="project-card-footer">
                                        <span>
                                            {completedCount} completed
                                        </span>

                                        <span>
                                            {taskCount - completedCount} pending
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
        </div>
    );
}

export default Projects;
