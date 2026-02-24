import { useState } from 'react';
import { FiAlertCircle, FiX, FiDollarSign, FiCreditCard } from 'react-icons/fi';
import './ConfirmModal.css';

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    showPaymentOptions = false
}) {
    const [selectedPayment, setSelectedPayment] = useState('cash');

    if (!isOpen) return null;

    const handleConfirm = () => {
        onConfirm(showPaymentOptions ? selectedPayment : null);
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

                {showPaymentOptions && (
                    <div className="modal-payment">
                        <p className="modal-payment-label">Select Payment Method</p>
                        <div className="modal-payment-options">
                            <button
                                className={`payment-btn ${selectedPayment === 'cash' ? 'active' : ''}`}
                                onClick={() => setSelectedPayment('cash')}
                            >
                                <FiDollarSign />
                                Cash
                            </button>
                            <button
                                className={`payment-btn ${selectedPayment === 'card' ? 'active' : ''}`}
                                onClick={() => setSelectedPayment('card')}
                            >
                                <FiCreditCard />
                                Card
                            </button>
                        </div>
                    </div>
                )}

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
