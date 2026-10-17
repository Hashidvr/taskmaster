import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react"; 
import { 
    Check, 
    CirclePlus, 
    Clock3, 
    Pencil, 
    Search, 
    Trash2, 
    X, 
} from "lucide-react"; 
 
import api from "../api/axios"; 
import { fetchAllPages } from "../api/pagination"; 
 
function Tasks() { 
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const standaloneOnly =
        searchParams.get("standalone") === "true";
    const [tasks, setTasks] = useState([]); 
    const [projects, setProjects] = useState([]); 
 
    const [title, setTitle] = useState(""); 
    const [description, setDescription] = useState(""); 
    const [projectId, setProjectId] = useState(""); 
    const [dueDate, setDueDate] = useState(""); 
 
    const [editingId, setEditingId] = useState(null); 
 
    const [search, setSearch] = useState(""); 
    const [filter, setFilter] = useState("all"); 
 
    const [error, setError] = useState(""); 
    const [loading, setLoading] = useState(true); 
 
    const fetchTasks = async () => { 
        try { 
            setLoading(true); 
            setError(""); 
 
            const allTasks = await fetchAllPages("tasks/"); 
 
            setTasks(allTasks); 
        } catch (error) { 
            console.error("FETCH TASKS ERROR:",error); 
 
            setError( 
                error.response?.data 
                    ? JSON.stringify(error.response.data) 
                    : "Failed to load tasks." 
            ); 
        } finally { 
            setLoading(false); 
        } 
    }; 
    
    useEffect(() => {
        let active = true;

        const loadTasks = async () => {
            try {
                const allTasks = await fetchAllPages("tasks/");

                if (active) {
                    setTasks(allTasks);
                }
            } catch (error) {
                console.error("FETCH TASKS ERROR:", error);

                if (active) {
                    setError(
                        error.response?.data
                            ? JSON.stringify(error.response.data)
                            : "Failed to load tasks."
                    );
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
            } catch (error) {
                console.error("FETCH PROJECTS ERROR:", error);
            }
        };

        loadTasks();
        loadProjects();

        return () => {
            active = false;
        };
    }, []);

 
    const resetForm = () => { 
        setTitle(""); 
        setDescription(""); 
        setProjectId(""); 
        setDueDate(""); 
        setEditingId(null); 
        setError(""); 
    }; 
    const createTask = async (event) => { 
        event.preventDefault(); 
 
        if (!title.trim()) { 
            setError("Task title is required."); 
            return; 
        } 
 
        try { 
            await api.post("tasks/", { 
                title: title.trim(), 
                description: description.trim(), 
                project_id: projectId ? Number(projectId) : null,
                due_date: dueDate || null, 
            }); 
 
            resetForm(); 
            setError(""); 
 
            await fetchTasks(); 
        } catch (error) { 
            console.error(error); 
 
            setError( 
                error.response?.data 
                    ? JSON.stringify(error.response.data) 
                    : "Failed to create task." 
            ); 
        } 
    }; 
 
 
    const updateTask = async (event) => { 
        event.preventDefault(); 
 
        if (!title.trim()) { 
            setError("Task title is required."); 
            return; 
        } 
 
        try { 
            await api.patch(`tasks/${editingId}/`, { 
                title: title.trim(), 
                description: description.trim(), 
                project_id: projectId ? Number(projectId) : null, 
                due_date: dueDate || null, 
            }); 
 
            resetForm(); 
            setError(""); 
 
            await fetchTasks(); 
        } catch (error) { 
            console.error(error); 
 
            setError( 
                error.response?.data 
                    ? JSON.stringify(error.response.data) 
                    : "Failed to update task." 
            ); 
        } 
    }; 
 
    const deleteTask = async (id) => { 
        const confirmed = window.confirm( 
            "Are you sure you want to delete this task?" 
        ); 
 
        if (!confirmed) { 
            return; 
        } 
 
        try { 
            await api.delete(`tasks/${id}/`); 
 
            await fetchTasks(); 
        } catch (error) { 
            console.error(error); 
            setError("Failed to delete task."); 
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
 
        return { 
            label: "Upcoming", 
            className: "status-upcoming", 
        }; 
    }; 
 
    const visibleTasks = useMemo(() => {
        return standaloneOnly
            ? tasks.filter((task) => task.project == null)
            : tasks;
    }, [tasks, standaloneOnly]);

    const filteredTasks = useMemo(() => {
        return visibleTasks.filter((task) => {
            const query = search.toLowerCase();

            const matchesSearch =
                task.title.toLowerCase().includes(query) ||
                (task.description || "").toLowerCase().includes(query);

            const matchesFilter =
                filter === "all" ||
                (filter === "pending" && !task.completed) ||
                (filter === "completed" && task.completed);

            return matchesSearch && matchesFilter;
        });
    }, [visibleTasks, search, filter]);
 
    const completedCount = visibleTasks.filter(
        (task) => task.completed
    ).length;

    const pendingCount = visibleTasks.filter(
        (task) => !task.completed
    ).length;
 
    return ( 
        <div className="tasks-page"> 
 
            {/* Page header */} 
 
            <div className="tasks-page-header"> 
 
                <div> 
                    <p className="page-eyebrow"> 
                        WORKSPACE 
                    </p> 
 
                    <h1>{standaloneOnly ? "Standalone Tasks" : "Tasks"}</h1>

                    <p className="page-description">
                        {standaloneOnly
                            ? "Manage tasks that aren't assigned to a project."
                            : "Manage your work, deadlines and priorities."}
                    </p>

                </div> 
 
                <div className="task-summary"> 
 
                    <div> 
                        <strong>{visibleTasks.length}</strong>
                        <span>Total</span> 
                    </div> 
 
                    <div> 
                        <strong>{pendingCount}</strong> 
                        <span>Pending</span> 
                    </div> 
 
                    <div> 
                        <strong>{completedCount}</strong> 
                        <span>Done</span> 
                    </div> 
 
                </div> 
 
            </div> 
 
            {/* Task form */} 
 
            <div className="task-form-card"> 
 
                <div className="task-form-header"> 
 
                    <div className="form-icon"> 
                        {editingId !== null ? ( 
                            <Pencil size={18} /> 
                        ) : ( 
                            <CirclePlus size={18} /> 
                        )} 
                    </div> 
 
                    <div> 
                        <h2> 
                            {editingId !== null 
                                ? "Edit task" 
                                : "Create a task"} 
                        </h2> 
 
                        <p> 
                            {editingId !== null 
                                ? "Update the details of your task." 
                                : "Add something you want to accomplish."} 
                        </p> 
                    </div> 
 
                </div> 
 
                <form 
                    className="task-form" 
                    onSubmit={ 
                        editingId !== null 
                            ? updateTask 
                            : createTask 
                    } 
                > 
 
                    <div className="form-row"> 
 
                        <div className="form-field form-field-large"> 
 
                            <label>Task title</label> 
 
                            <input 
                                type="text" 
                                placeholder="e.g. Finish project documentation" 
                                value={title} 
                                onChange={(event) => 
                                    setTitle(event.target.value) 
                                } 
                            /> 
 
                        </div> 
 
                        <div className="form-field"> 
 
                            <label>Project</label> 
 
                            <select 
                                value={projectId} 
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
 
                    </div> 
 
                    <div className="form-row"> 
 
                        <div className="form-field form-field-large"> 
 
                            <label>Description</label> 
 
                            <textarea 
                                placeholder="Add some details..." 
                                value={description} 
                                onChange={(event) => 
                                    setDescription(event.target.value) 
                                } 
                            /> 
 
                        </div> 
 
                        <div className="form-field"> 
 
                            <label>Deadline</label> 
 
                            <div className="input-with-icon"> 
 
                                <Clock3 size={16} /> 
 
                                <input 
                                    type="datetime-local" 
                                    value={dueDate} 
                                    onChange={(event) => 
                                        setDueDate(event.target.value) 
                                    } 
                                /> 
 
                            </div> 
 
                        </div> 
 
                    </div> 
 
                    {error && ( 
                        <div className="task-error"> 
                            {error} 
                        </div> 
                    )} 
 
                    <div className="form-actions"> 
 
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
                                    Create task 
                                </> 
                            )} 
                        </button> 
 
                    </div> 
 
                </form> 
 
            </div> 
 
            {/* Toolbar */} 
 
            <div className="tasks-toolbar"> 
 
                <div className="task-search"> 
 
                    <Search size={17} /> 
 
                    <input 
                        type="text" 
                        placeholder="Search tasks..." 
                        value={search} 
                        onChange={(event) => 
                            setSearch(event.target.value) 
                        } 
                    /> 
 
                </div> 
 
                <div className="task-filters"> 
 
                    <button 
                        className={ 
                            filter === "all" 
                                ? "filter-button active" 
                                : "filter-button" 
                        } 
                        onClick={() => setFilter("all")} 
                    > 
                        All 
                    </button> 
 
                    <button 
                        className={ 
                            filter === "pending" 
                                ? "filter-button active" 
                                : "filter-button" 
                        } 
                        onClick={() => setFilter("pending")} 
                    > 
                        Pending 
                    </button> 
 
                    <button 
                        className={ 
                            filter === "completed" 
                                ? "filter-button active" 
                                : "filter-button" 
                        } 
                        onClick={() => setFilter("completed")} 
                    > 
                        Completed 
                    </button> 
 
                </div> 
 
            </div> 
 
            {/* Tasks */} 
 
            {loading ? ( 
                <div className="tasks-empty"> 
                    Loading your tasks... 
                </div> 
            ) : filteredTasks.length === 0 ? ( 
                <div className="tasks-empty"> 
 
                    <Check size={28} /> 
 
                    <h3>No tasks found</h3> 
 
                    <p> 
                        Try changing your search or create a new task. 
                    </p> 
 
                </div> 
            ) : ( 
                <div className="modern-task-list"> 
 
                    {filteredTasks.map((task) => { 
                        const status = 
                            getDeadlineStatus(task); 
 
                        return ( 
                            <div
                                className="modern-task-card"
                                key={task.id}
                                role="link"
                                tabIndex={0}
                                onClick={() => navigate(`/tasks/${task.id}`)}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                        navigate(`/tasks/${task.id}`);
                                    }
                                }}
                                style={{ cursor: "pointer" }}
                            >
                                <div className="modern-task-content">
                                    <h3 className={task.completed ? "task-completed" : ""}>
                                        {task.title}
                                    </h3>

                                    <p>{task.description || "No description"}</p>

                                    <div className="modern-task-info">
                                        <span>{task.project?.name || "No project"}</span>

                                        {task.due_date && (
                                            <span>
                                                {new Date(task.due_date).toLocaleString()}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="modern-task-actions">
                                    <span className={`status-badge ${status.className}`}>
                                        {status.label}
                                    </span>

                                    <button
                                        type="button"
                                        className="task-action-button delete"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            deleteTask(task.id);
                                        }}
                                        title="Delete task"
                                        aria-label={`Delete ${task.title}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                        ); 
                    })} 
 
                </div> 
            )} 
 
        </div> 
    ); 
} 
 
export default Tasks;