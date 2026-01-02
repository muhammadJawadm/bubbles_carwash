import { useState, useEffect } from 'react';
import { getAccountCustomerNames, getAccountsByCustomerName, markAccountAsPaid, deleteAccount } from '../services';
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
            fetchCustomerAccounts(); // Refresh
        } catch (error) {
            console.error('Error marking as paid:', error);
            alert('Failed to mark as paid: ' + error.message);
        }
    };

    const handleDeleteAccount = async (accountId) => {
        if (!confirm('Delete this item?')) return;

        try {
            await deleteAccount(accountId);
            alert('Deleted ✅');

            // Refresh the accounts for current customer
            await fetchCustomerAccounts();

            // Refresh customer list to update dropdown
            await fetchCustomerNames();

            // If no accounts remain for this customer, clear the selection
            const result = await getAccountsByCustomerName(selectedCustomer);
            if (result.accounts.length === 0) {
                setSelectedCustomer('');
            }
        } catch (error) {
            console.error('Error deleting:', error);
            alert('Failed to delete: ' + error.message);
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

            {loading ? (
                <p>Loading...</p>
            ) : (
                <table>
                    <thead>
                        <tr>
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
                                <td colSpan="6" style={{ textAlign: 'center' }}>
                                    {selectedCustomer ? 'No account entries found' : 'Select a customer'}
                                </td>
                            </tr>
                        ) : (
                            accounts.map(account => (
                                <tr key={account.id}>
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
                                            onClick={() => handleDeleteAccount(account.id)}
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
