import { useState, useEffect } from 'react';
import { getSales, updateSale } from '../services';
import { formatAmount } from '../utils/formatters';
import Badge from './ui/Badge';
import ConfirmModal from './ui/ConfirmModal';
import { FiEdit } from 'react-icons/fi';

export default function PayLater({ refreshTrigger }) {
    const [payLaterSales, setPayLaterSales] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState(null);

    useEffect(() => {
        fetchPayLaterSales();
    }, [refreshTrigger]);

    const fetchPayLaterSales = async () => {
        try {
            setLoading(true);
            const data = await getSales({ paymentType: 'paylater' });
            // Sort by date descending (most recent first)
            const sorted = data.sort((a, b) => {
                const dateA = a.service_date + (a.service_time || '');
                const dateB = b.service_date + (b.service_time || '');
                return dateB.localeCompare(dateA);
            });
            setPayLaterSales(sorted);
            console.log(sorted);
        } catch (error) {
            console.error('Error fetching PayLater sales:', error);
            alert('Failed to load PayLater records');
        } finally {
            setLoading(false);
        }
    };

    const paymentBadge = (type) => {
        if (type === 'paylater') return <Badge type="paylater">Pay Later</Badge>;
        return <Badge type="account">30-Day</Badge>;
    };

    const handleOpenModal = (sale) => {
        setSelectedSale(sale);
        setModalOpen(true);
    };

    const handleConfirmPayment = async () => {
        if (!selectedSale) return;

        try {
            setLoading(true);
            await updateSale(selectedSale.id, {
                payment_type: 'paid',
                is_paid: true
            });
            alert('Payment updated to paid ✅');
            fetchPayLaterSales(); // Refresh the list
            setSelectedSale(null);
        } catch (error) {
            console.error('Error updating payment:', error);
            alert('Failed to update payment: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="tab active">
            <h2>Pay Later Records</h2>
            <p className="small" style={{ marginTop: '8px', marginBottom: '12px' }}>
                All customers who selected "Pay Later" payment option. Use the edit button to mark as paid.
            </p>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Customer</th>
                            <th>Vehicle</th>
                            <th>Service</th>
                            <th>Amount</th>
                            <th>Payment Type</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payLaterSales.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center' }}>
                                    No PayLater records found
                                </td>
                            </tr>
                        ) : (
                            payLaterSales.map(sale => (
                                <tr key={sale.id}>
                                    <td>{sale.service_date}</td>
                                    <td>{sale.service_time || '-'}</td>
                                    <td>{sale.customer_name}</td>
                                    <td>{sale.vehicle_registration || sale.vehicle_description || '-'}</td>
                                    <td>{sale.service_description}</td>
                                    <td>
                                        {formatAmount(sale.final_amount)}
                                        {sale.discount && sale.discount > 0 && (
                                            <div className="small">Disc: -{formatAmount(sale.discount)}</div>
                                        )}
                                    </td>
                                    <td>
                                        {paymentBadge(sale.payment_type)}
                                    </td>
                                    <td>
                                        <button
                                            className="secondary"
                                            onClick={() => handleOpenModal(sale)}
                                            title="Mark as Paid"
                                        >
                                            Mark as Paid
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}

            {!loading && payLaterSales.length > 0 && (
                <p className="small" style={{ marginTop: '10px' }}>
                    Showing {payLaterSales.length} PayLater record{payLaterSales.length !== 1 ? 's' : ''}
                </p>
            )}

            <ConfirmModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onConfirm={handleConfirmPayment}
                title="Confirm Payment"
                message={selectedSale ? `Mark payment as paid for ${selectedSale.customer_name}?` : ''}
                confirmText="Mark as Paid"
                cancelText="Cancel"
            />
        </section>
    );
}
