import { useState, useEffect } from 'react';
import { getSales, deleteSaleUsingId, deleteAllSales } from '../services';
import { formatAmount } from '../utils/formatters';
import { exportCsv } from '../utils/exportCsv';
import Badge from './ui/Badge';
import { FiTrash } from 'react-icons/fi';

export default function AllRecords({ refreshTrigger }) {
    const [sales, setSales] = useState([]);
    const [searchText, setSearchText] = useState('');
    const [filterPayment, setFilterPayment] = useState('');
    const [filteredSales, setFilteredSales] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchAllSales();
    }, [refreshTrigger]);

    const fetchAllSales = async () => {
        try {
            setLoading(true);
            const data = await getSales();
            setSales(data);
        } catch (error) {
            console.error('Error fetching all sales:', error);
            alert('Failed to load sales data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let filtered = sales.slice().sort((a, b) => {
            const dateA = a.service_date + (a.service_time || '');
            const dateB = b.service_date + (b.service_time || '');
            return dateB.localeCompare(dateA); // Most recent first
        });

        if (filterPayment) {
            filtered = filtered.filter(s => s.payment_type === filterPayment);
        }

        if (searchText) {
            const q = searchText.trim().toLowerCase();
            filtered = filtered.filter(s => {
                const haystack = (
                    s.customer_name + ' ' +
                    (s.vehicle_registration || '') + ' ' +
                    (s.vehicle_description || '')
                ).toLowerCase();
                return haystack.includes(q);
            });
        }

        setFilteredSales(filtered);
    }, [sales, searchText, filterPayment]);

    const paymentBadge = (type) => {
        if (type === 'cash') return <Badge type="cash">Cash</Badge>;
        if (type === 'card') return <Badge type="card">Card</Badge>;
        return <Badge type="account">30-Day</Badge>;
    };
    const handleDelete = async (id) => {
        try {
            setLoading(true);
            await deleteSaleUsingId(id);
            fetchAllSales();
        } catch (error) {
            console.error('Error deleting sale:', error);
            alert('Failed to delete sale');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAllSales = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete ALL sales records? This action cannot be undone.'
        );

        if (!confirmed) {
            return;
        }

        try {
            setLoading(true);
            await deleteAllSales();
            fetchAllSales();
        } catch (error) {
            console.error('Error deleting all sales:', error);
            alert('Failed to delete all sales');
        } finally {
            setLoading(false);
        }
    };

    const handleExportCsv = () => {
        // Transform data for CSV export
        const exportData = filteredSales.map(s => ({
            date: s.service_date,
            time: s.service_time || '',
            customer: s.customer_name,
            vehicle: s.vehicle_registration || s.vehicle_description || '',
            service: s.service_description,
            paymentType: s.payment_type,
            amount: s.final_amount,
            discount: s.discount || 0,
            baseAmount: s.base_amount,
            notes: s.notes || ''
        }));

        exportCsv(exportData);
    };

    return (
        <section className="tab active">
            <h2>All Service Records</h2>
            <div className="row">
                <div>
                    <label htmlFor="searchText">Search (customer / vehicle)</label>
                    <input
                        type="text"
                        id="searchText"
                        placeholder="Type to filter..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="filterPayment">Filter by Payment</label>
                    <select
                        id="filterPayment"
                        value={filterPayment}
                        onChange={(e) => setFilterPayment(e.target.value)}
                    >
                        <option value="">All</option>
                        <option value="cash">Cash</option>
                        <option value="card">Card</option>
                        <option value="account">30-Day Account</option>
                    </select>
                </div>
            </div>

            <button
                className="secondary"
                style={{ marginTop: '10px' }}
                onClick={handleExportCsv}
                disabled={filteredSales.length === 0}
            >
                Export CSV ({filteredSales.length} records)
            </button>
            <button
                className="secondary gap-2"
                style={{ marginTop: '10px' }}
                onClick={handleDeleteAllSales}
                disabled={filteredSales.length === 0}
            >
                <FiTrash className="text-lg" />
                Delete All Sales
            </button>

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
                            <th>Payment</th>
                            <th>Amount</th>
                            <th>Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSales.length === 0 ? (
                            <tr>
                                <td colSpan="7" style={{ textAlign: 'center' }}>
                                    {sales.length === 0 ? 'No records found' : 'No matching records'}
                                </td>
                            </tr>
                        ) : (
                            filteredSales.map(s => (
                                <tr key={s.id}>
                                    <td>{s.service_date}</td>
                                    <td>{s.service_time || '-'}</td>
                                    <td>{s.customer_name}</td>
                                    <td>{s.vehicle_registration || s.vehicle_description || '-'}</td>
                                    <td>{s.service_description}</td>
                                    <td>{paymentBadge(s.payment_type)}</td>
                                    <td>
                                        {formatAmount(s.final_amount)}
                                        {s.discount && s.discount > 0 && (
                                            <div className="small">Disc: -{formatAmount(s.discount)}</div>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className="secondary text-red-500 hover:text-red-600 "
                                            onClick={() => handleDelete(s.id)}
                                        >
                                            <FiTrash className="text-lg" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}

            {!loading && filteredSales.length > 0 && (
                <p className="small" style={{ marginTop: '10px' }}>
                    Showing {filteredSales.length} of {sales.length} total records
                </p>
            )}
        </section>
    );
}
