import { FiAlertCircle, FiX } from 'react-icons/fi';
import './ConfirmModal.css';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel' }) {
    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm();
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <FiX />
                </button>

                <div className="modal-icon">
                    <FiAlertCircle />
                </div>

                <h3 className="modal-title">{title}</h3>
                <p className="modal-message">{message}</p>

                <div className="modal-actions">
                    <button className="modal-btn modal-btn-cancel" onClick={onClose}>
                        {cancelText}
                    </button>
                    <button className="modal-btn modal-btn-confirm" onClick={handleConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
