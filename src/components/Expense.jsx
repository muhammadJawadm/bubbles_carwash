import { useState, useEffect } from 'react';
import { addExpense, getExpensesByMonth, getExpensesByDateRange, deleteExpense, getSalesByDateRange } from '../services';
import { formatAmount, todayStr } from '../utils/formatters';
import SummaryBox from './ui/SummaryBox';
import { FiTrash } from 'react-icons/fi';

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
    const [selected, setSelected] = useState(new Set());

    // Profit section — independent date range
    const firstOfMonth = `${currentYear}-${currentMonth}-01`;
    const [profitStart, setProfitStart] = useState(firstOfMonth);
    const [profitEnd, setProfitEnd] = useState(today);
    const [profitRevenue, setProfitRevenue] = useState(null);
    const [profitExpenses, setProfitExpenses] = useState(null);
    const [loadingProfit, setLoadingProfit] = useState(false);

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
            setSelected(new Set());
        } catch (err) {
            console.error('Error fetching expenses:', err);
            alert('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    const fetchProfitData = async () => {
        if (!profitStart || !profitEnd || profitStart > profitEnd) {
            alert('Please select a valid date range.');
            return;
        }
        try {
            setLoadingProfit(true);
            const [salesData, expenseData] = await Promise.all([
                getSalesByDateRange(profitStart, profitEnd),
                getExpensesByDateRange(profitStart, profitEnd),
            ]);
            setProfitRevenue(salesData.reduce((acc, s) => acc + Number(s.final_amount || 0), 0));
            setProfitExpenses(expenseData.reduce((acc, e) => acc + Number(e.amount || 0), 0));
        } catch (err) {
            console.error('Error fetching profit data:', err);
            alert('Failed to calculate profit');
        } finally {
            setLoadingProfit(false);
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

    const handleDeleteOne = async (id) => {
        if (!window.confirm('Delete this expense? This cannot be undone.')) return;
        try {
            await deleteExpense(id);
            await fetchExpenses();
        } catch (err) {
            console.error('Error deleting expense:', err);
            alert('Failed to delete expense');
        }
    };

    const handleDeleteSelected = async () => {
        if (selected.size === 0) return;
        const label = `${selected.size} expense${selected.size > 1 ? 's' : ''}`;
        if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;
        try {
            await Promise.all([...selected].map(id => deleteExpense(id)));
            await fetchExpenses();
        } catch (err) {
            console.error('Error deleting expenses:', err);
            alert('Failed to delete selected expenses');
        }
    };

    const toggleSelect = (id) => {
        setSelected(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const allSelected = expenses.length > 0 && selected.size === expenses.length;
    const toggleSelectAll = () => {
        setSelected(allSelected ? new Set() : new Set(expenses.map(e => e.id)));
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

            {/* ── Bulk delete toolbar ───────────────────────────────────── */}
            {selected.size > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    <span className="small">{selected.size} selected</span>
                    <button
                        className="secondary"
                        onClick={handleDeleteSelected}
                        style={{ color: '#c0392b', borderColor: '#c0392b', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                    >
                        <FiTrash /> Delete Selected ({selected.size})
                    </button>
                </div>
            )}

            {/* ── Expenses Table ────────────────────────────────────────── */}
            {loading ? (
                <p>Loading…</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th style={{ width: '36px' }}>
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleSelectAll}
                                    disabled={expenses.length === 0}
                                    title="Select all"
                                />
                            </th>
                            <th>Date</th>
                            <th>Expense Type</th>
                            <th>Amount</th>
                            <th>Notes</th>
                            <th style={{ width: '48px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {expenses.length === 0 ? (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center' }}>
                                    No expenses recorded for {monthLabel} {year}
                                </td>
                            </tr>
                        ) : (
                            expenses.map(e => (
                                <tr key={e.id} style={selected.has(e.id) ? { background: '#fef3f2' } : {}}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selected.has(e.id)}
                                            onChange={() => toggleSelect(e.id)}
                                        />
                                    </td>
                                    <td>{e.expense_date}</td>
                                    <td>{e.expense_type}</td>
                                    <td>{formatAmount(e.amount)}</td>
                                    <td>{e.notes || '–'}</td>
                                    <td>
                                        <button
                                            className="secondary"
                                            onClick={() => handleDeleteOne(e.id)}
                                            title="Delete"
                                            style={{ color: '#c0392b', borderColor: 'transparent', padding: '4px 6px' }}
                                        >
                                            <FiTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}

            {/* ── Profit Summary ────────────────────────────────────────── */}
            <h3 style={{ marginTop: '2rem', marginBottom: '0.75rem' }}>Profit Summary</h3>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem' }}>Start Date</label>
                    <input
                        type="date"
                        value={profitStart}
                        max={profitEnd}
                        onChange={e => { setProfitStart(e.target.value); setProfitRevenue(null); setProfitExpenses(null); }}
                    />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem' }}>End Date</label>
                    <input
                        type="date"
                        value={profitEnd}
                        min={profitStart}
                        onChange={e => { setProfitEnd(e.target.value); setProfitRevenue(null); setProfitExpenses(null); }}
                    />
                </div>
                <button className="primary" onClick={fetchProfitData} disabled={loadingProfit}>
                    {loadingProfit ? 'Calculating…' : 'Calculate Profit'}
                </button>
            </div>

            {profitRevenue !== null && profitExpenses !== null && (
                <div style={{
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    padding: '1rem 1.25rem',
                    background: '#f9fafb',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    maxWidth: '360px'
                }}>
                    <div style={{ fontSize: '0.85rem', color: '#555', marginBottom: '0.25rem' }}>
                        Period: <strong>{profitStart} → {profitEnd}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Revenue</span>
                        <strong style={{ color: '#0b8f39' }}>{formatAmount(profitRevenue)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Total Expenses</span>
                        <strong style={{ color: '#c0392b' }}>{formatAmount(profitExpenses)}</strong>
                    </div>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        borderTop: '1px solid #ddd',
                        paddingTop: '0.5rem',
                        marginTop: '0.25rem',
                        fontSize: '1rem',
                        fontWeight: '700'
                    }}>
                        <span>Net Profit</span>
                        <span style={{ color: profitRevenue - profitExpenses >= 0 ? '#0b8f39' : '#c0392b' }}>
                            {formatAmount(profitRevenue - profitExpenses)}
                        </span>
                    </div>
                </div>
            )}
        </section>
    );
}
