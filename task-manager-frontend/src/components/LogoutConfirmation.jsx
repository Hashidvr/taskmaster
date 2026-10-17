
import { LogOut, X } from "lucide-react";

function LogoutConfirmation({ isOpen, onCancel, onConfirm }) {
    if (!isOpen) return null;

    return (
        <div
            className="logout-modal-overlay"
            onClick={onCancel}
        >
            <div
                className="logout-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="logout-modal-title"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="logout-modal-icon">
                    <LogOut size={24} />
                </div>

                <button
                    type="button"
                    className="logout-modal-close"
                    onClick={onCancel}
                    aria-label="Close confirmation"
                >
                    <X size={18} />
                </button>

                <h2 id="logout-modal-title">
                    Log out of TaskMaster?
                </h2>

                <p>
                    Are you sure you want to log out?
                    You'll need to sign in again to access your tasks.
                </p>

                <div className="logout-modal-actions">
                    <button
                        type="button"
                        className="secondary-button"
                        onClick={onCancel}
                    >
                        Cancel
                    </button>

                    <button
                        type="button"
                        className="logout-confirm-button"
                        onClick={onConfirm}
                    >
                        Yes, log out
                    </button>
                </div>
            </div>
        </div>
    );
}

export default LogoutConfirmation;
