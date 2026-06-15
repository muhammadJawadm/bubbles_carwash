import { useState, useEffect } from 'react';
import { addExpense, getExpensesByMonth } from '../services';
import { formatAmount, todayStr } from '../utils/formatters';
import SummaryBox from './ui/SummaryBox';

const EXPENSE_TYPES = [
    'Rent',
    'Electricity',
    'Water',
    'Salaries',
    'Equipment',
    'Supplies',
    'Maintenance',
    'Chemicals / Products',
    'Other',
];

const MONTHS = [
    { value: '01', label: 'January' },
    { value: '02', label: 'February' },
    { value: '03', label: 'March' },
    { value: '04', label: 'April' },
    { value: '05', label: 'May' },
    { value: '06', label: 'June' },
    { value: '07', label: 'July' },
    { value: '08', label: 'August' },
    { value: '09', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
];

export default function Expense() {
    const today = todayStr();
    const currentYear = String(new Date().getFullYear());
    const currentMonth = today.slice(5, 7);

    const [year, setYear] = useState(currentYear);
    const [month, setMonth] = useState(currentMonth);
    const [expenses, setExpenses] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const [expenseType, setExpenseType] = useState(EXPENSE_TYPES[0]);
    const [amount, setAmount] = useState('');
    const [expenseDate, setExpenseDate] = useState(today);
    const [notes, setNotes] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, month]);

    const fetchExpenses = async () => {
        try {
            setLoading(true);
            const data = await getExpensesByMonth(year, month);
            setExpenses(data);
            setTotal(data.reduce((acc, e) => acc + Number(e.amount || 0), 0));
        } catch (err) {
            console.error('Error fetching expenses:', err);
            alert('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) {
            alert('Please enter a valid amount greater than 0');
            return;
        }
        try {
            setSaving(true);
            await addExpense({ expenseType, amount: amt, date: expenseDate, notes: notes.trim() || null });
            setAmount('');
            setNotes('');
            if (expenseDate.slice(0, 4) === year && expenseDate.slice(5, 7) === month) {
                await fetchExpenses();
            }
        } catch (err) {
            console.error('Error saving expense:', err);
            alert('Failed to save expense');
        } finally {
            setSaving(false);
        }
    };

    const years = [];
    const yr = parseInt(currentYear);
    for (let y = yr - 2; y <= yr + 1; y++) years.push(String(y));

    const monthLabel = MONTHS.find(m => m.value === month)?.label;

    return (
        <section className="tab active">
            <h2>Expenses</h2>

            {/* ── Add Expense Form ─────────────────────────────────────── */}
            <h3 style={{ marginBottom: '0.5rem' }}>Add New Expense</h3>
            <form onSubmit={handleAdd}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: '1.5rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Expense Type</label>
                        <select value={expenseType} onChange={e => setExpenseType(e.target.value)} required>
                            {EXPENSE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Amount (R)</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            placeholder="0.00"
                            value={amount}
                            onChange={e => setAmount(e.target.value)}
                            style={{ width: '130px' }}
                            required
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Date</label>
                        <input
                            type="date"
                            value={expenseDate}
                            onChange={e => setExpenseDate(e.target.value)}
                            required
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: '180px' }}>
                        <label style={{ display: 'block', marginBottom: '0.25rem' }}>Notes (optional)</label>
                        <input
                            type="text"
                            placeholder="Optional notes…"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="primary" disabled={saving}>
                        {saving ? 'Saving…' : 'Save Expense'}
                    </button>
                </div>
            </form>

            {/* ── Month / Year Filter ──────────────────────────────────── */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem' }}>Month</label>
                    <select value={month} onChange={e => setMonth(e.target.value)}>
                        {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem' }}>Year</label>
                    <select value={year} onChange={e => setYear(e.target.value)}>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* ── Monthly Summary ───────────────────────────────────────── */}
            <SummaryBox>
                <div><strong>Period:</strong> {monthLabel} {year}</div>
                <div><strong>Total Expenses:</strong> {formatAmount(total)}</div>
                <div className="small">Total Records: {expenses.length}</div>
            </SummaryBox>

            {/* ── Expenses Table ────────────────────────────────────────── */}
            {loading ? (
                <p>Loading…</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Expense Type</th>
                            <th>Amount</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center' }}>
                                    No expenses recorded for {monthLabel} {year}
                                </td>
                            </tr>
                        ) : (
                            expenses.map(e => (
                                <tr key={e.id}>
                                    <td>{e.expense_date}</td>
                                    <td>{e.expense_type}</td>
                                    <td>{formatAmount(e.amount)}</td>
                                    <td>{e.notes || '–'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </section>
    );
}
