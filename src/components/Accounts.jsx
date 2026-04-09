import { useState, useEffect } from 'react';
import { getAccountCustomerNames, getAccountsByCustomerName, markAccountAsPaid, deleteAccount, deleteSale } from '../services';
import { formatAmount } from '../utils/formatters';
import Badge from './ui/Badge';
import SummaryBox from './ui/SummaryBox';
import { FiTrash } from 'react-icons/fi';

export default function Accounts({ refreshTrigger }) {
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [accounts, setAccounts] = useState([]);
    const [summary, setSummary] = useState({ outstanding: 0, unpaidCount: 0 });
    const [loading, setLoading] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkLoading, setBulkLoading] = useState(false);

    useEffect(() => {
        fetchCustomerNames();
    }, [refreshTrigger]);

    useEffect(() => {
        if (selectedCustomer) {
            fetchCustomerAccounts();
        } else {
            setAccounts([]);
            setSummary({ outstanding: 0, unpaidCount: 0 });
        }
        setSelectedIds([]);
    }, [selectedCustomer, refreshTrigger]);

    const fetchCustomerNames = async () => {
        try {
            const names = await getAccountCustomerNames();
            setCustomers(names);
        } catch (error) {
            console.error('Error fetching customer names:', error);
            alert('Failed to load customers');
        }
    };

    const fetchCustomerAccounts = async () => {
        try {
            setLoading(true);
            const result = await getAccountsByCustomerName(selectedCustomer);
            setAccounts(result.accounts);
            setSummary(result.summary);
        } catch (error) {
            console.error('Error fetching customer accounts:', error);
            alert('Failed to load account data');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async (accountId) => {
        if (!confirm('Mark this item as paid?')) return;

        try {
            await markAccountAsPaid(accountId);
            alert('Marked as paid ✅');
            fetchCustomerAccounts();
        } catch (error) {
            console.error('Error marking as paid:', error);
            alert('Failed to mark as paid: ' + error.message);
        }
    };

    const handleDeleteAccount = async (accountId) => {
        if (!confirm('Delete this item?')) return;

        try {
            await deleteAccount(accountId);
            await deleteSale(accountId);
            alert('Deleted ✅');

            await fetchCustomerAccounts();
            await fetchCustomerNames();

            const result = await getAccountsByCustomerName(selectedCustomer);
            if (result.accounts.length === 0) {
                setSelectedCustomer('');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Failed to delete: ' + error.message);
        }
    };

    // ── Bulk selection helpers ──────────────────────────────────────────────
    const unpaidAccounts = accounts.filter(a => !a.is_paid);
    const allUnpaidSelected =
        unpaidAccounts.length > 0 &&
        unpaidAccounts.every(a => selectedIds.includes(a.id));

    const toggleSelectAll = () => {
        if (allUnpaidSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(unpaidAccounts.map(a => a.id));
        }
    };

    const toggleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        );
    };

    const handleMarkSelectedPaid = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Mark ${selectedIds.length} item(s) as paid?`)) return;

        setBulkLoading(true);
        try {
            await Promise.all(selectedIds.map(id => markAccountAsPaid(id)));
            alert(`${selectedIds.length} item(s) marked as paid ✅`);
            setSelectedIds([]);
            fetchCustomerAccounts();
        } catch (error) {
            console.error('Error bulk marking as paid:', error);
            alert('Failed to mark some items as paid: ' + error.message);
        } finally {
            setBulkLoading(false);
        }
    };

    return (
        <section className="tab active">
            <h2>30-Day Account Customers</h2>
            <label htmlFor="accountCustomerSelect">Select Customer</label>
            <select
                id="accountCustomerSelect"
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
            >
                <option value="">-- Select --</option>
                {customers.map(name => (
                    <option key={name} value={name}>
                        {name}
                    </option>
                ))}
            </select>

            <SummaryBox>
                {selectedCustomer ? (
                    <>
                        <div>
                            <strong>{selectedCustomer}</strong>
                        </div>
                        <div>
                            <strong>Outstanding:</strong> {formatAmount(summary.outstanding)}
                        </div>
                        <div className="small">Unpaid Invoices: {summary.unpaidCount}</div>
                        <div className="small">Mark items as paid once you receive payment.</div>
                    </>
                ) : (
                    <>
                        <div>
                            <strong>Outstanding:</strong> R0.00
                        </div>
                        <div className="small">Select a customer to view their 30-day account.</div>
                    </>
                )}
            </SummaryBox>

            {/* Bulk action toolbar — only visible when at least one row is checked */}
            {selectedIds.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <span className="small">{selectedIds.length} item(s) selected</span>
                    <button
                        className="secondary"
                        onClick={handleMarkSelectedPaid}
                        disabled={bulkLoading}
                    >
                        {bulkLoading ? 'Processing…' : `Mark ${selectedIds.length} as Paid ✅`}
                    </button>
                    <button
                        className="secondary"
                        onClick={() => setSelectedIds([])}
                        disabled={bulkLoading}
                    >
                        Clear Selection
                    </button>
                </div>
            )}

            {loading ? (
                <p>Loading...</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            {/* Select-all checkbox — only shown when there are unpaid rows */}
                            <th style={{ width: '2.5rem', textAlign: 'center' }}>
                                {unpaidAccounts.length > 0 && (
                                    <input
                                        type="checkbox"
                                        title="Select all unpaid"
                                        checked={allUnpaidSelected}
                                        onChange={toggleSelectAll}
                                    />
                                )}
                            </th>
                            <th>Date</th>
                            <th>Vehicle</th>
                            <th>Service</th>
                            <th>Amount</th>
                            <th>Status</th>
                            <th>Mark Paid</th>
                            <th>Delete</th>
                        </tr>
                    </thead>
                    <tbody>
                        {accounts.length === 0 ? (
                            <tr>
                                <td colSpan="8" style={{ textAlign: 'center' }}>
                                    {selectedCustomer ? 'No account entries found' : 'Select a customer'}
                                </td>
                            </tr>
                        ) : (
                            accounts.map(account => (
                                <tr
                                    key={account.id}
                                    style={
                                        selectedIds.includes(account.id)
                                            ? { background: 'rgba(var(--accent-rgb, 99,102,241), 0.08)' }
                                            : {}
                                    }
                                >
                                    {/* Per-row checkbox — only for unpaid rows */}
                                    <td style={{ textAlign: 'center' }}>
                                        {!account.is_paid && (
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.includes(account.id)}
                                                onChange={() => toggleSelectOne(account.id)}
                                            />
                                        )}
                                    </td>
                                    <td>{account.web_sales?.service_date || '-'}</td>
                                    <td>
                                        {account.web_sales?.vehicle_registration ||
                                            account.web_sales?.vehicle_description || '-'}
                                    </td>
                                    <td>{account.web_sales?.service_description || '-'}</td>
                                    <td>{formatAmount(account.amount_due)}</td>
                                    <td>
                                        {account.is_paid ? (
                                            <Badge type="paid">Paid</Badge>
                                        ) : (
                                            <Badge type="unpaid">Unpaid</Badge>
                                        )}
                                    </td>
                                    <td>
                                        {!account.is_paid && (
                                            <button
                                                className="secondary"
                                                onClick={() => handleMarkPaid(account.id)}
                                            >
                                                Paid
                                            </button>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className="secondary"
                                            onClick={() => handleDeleteAccount(account.customer_id)}
                                        >
                                            <FiTrash className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </section>
    );
}
