import { useState, useEffect } from 'react';
import { getSales, getSalesByDateRange, getDailySalesSummary } from '../services';
import { formatAmount, todayStr } from '../utils/formatters';
import Badge from './ui/Badge';
import SummaryBox from './ui/SummaryBox';

/** Compute the same summary shape as getDailySalesSummary but from a list of records */
function computeSummary(salesData) {
    return salesData.reduce(
        (acc, sale) => {
            const amount = Number(sale.final_amount || 0);
            acc.total += amount;
            acc.count++;
            if (sale.payment_type === 'cash') acc.cash += amount;
            if (sale.payment_type === 'card') acc.card += amount;
            if (sale.payment_type === 'account') acc.account += amount;
            return acc;
        },
        { total: 0, cash: 0, card: 0, account: 0, count: 0 }
    );
}

export default function DailySales({ refreshTrigger }) {
    const today = todayStr();

    // Single-date mode (default)
    const [selectedDate, setSelectedDate] = useState(today);

    // Range mode
    const [rangeMode, setRangeMode] = useState(false);
    const [startDate, setStartDate] = useState(today);
    const [endDate, setEndDate] = useState(today);

    const [sales, setSales] = useState([]);
    const [summary, setSummary] = useState({ total: 0, cash: 0, card: 0, account: 0, count: 0 });
    const [loading, setLoading] = useState(false);

    // Re-fetch whenever the relevant date values or mode change
    useEffect(() => {
        fetchSalesData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, startDate, endDate, rangeMode, refreshTrigger]);

    const fetchSalesData = async () => {
        try {
            setLoading(true);

            if (rangeMode) {
                // Validate: start must be ≤ end
                if (startDate > endDate) {
                    setSales([]);
                    setSummary({ total: 0, cash: 0, card: 0, account: 0, count: 0 });
                    return;
                }
                const salesData = await getSalesByDateRange(startDate, endDate);
                setSales(salesData);
                setSummary(computeSummary(salesData));
            } else {
                const [salesData, summaryData] = await Promise.all([
                    getSales({ date: selectedDate }),
                    getDailySalesSummary(selectedDate),
                ]);
                setSales(salesData);
                setSummary(summaryData);
            }
        } catch (error) {
            console.error('Error fetching sales:', error);
            alert('Failed to load sales data');
        } finally {
            setLoading(false);
        }
    };

    const paymentBadge = (type) => {
        if (type === 'cash') return <Badge type="cash">Cash</Badge>;
        if (type === 'card') return <Badge type="card">Card</Badge>;
        if (type === 'paylater') return <Badge type="paylater">Pay Later</Badge>;
        if (type === 'paid') return <Badge type="paid">Paid</Badge>;
        return <Badge type="account">30-Day</Badge>;
    };

    /** Label shown in the summary box */
    const dateLabel = rangeMode
        ? startDate === endDate
            ? startDate
            : `${startDate} → ${endDate}`
        : selectedDate;

    return (
        <section className="tab active">
            <h2>Daily Sales</h2>

            {/* ── Date controls ─────────────────────────────────────────── */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>

                {rangeMode ? (
                    <>
                        <div>
                            <label htmlFor="startDate" style={{ display: 'block', marginBottom: '0.25rem' }}>
                                Start Date
                            </label>
                            <input
                                type="date"
                                id="startDate"
                                value={startDate}
                                max={endDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="endDate" style={{ display: 'block', marginBottom: '0.25rem' }}>
                                End Date
                            </label>
                            <input
                                type="date"
                                id="endDate"
                                value={endDate}
                                min={startDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </>
                ) : (
                    <div>
                        <label htmlFor="dailyDate" style={{ display: 'block', marginBottom: '0.25rem' }}>
                            Select Date
                        </label>
                        <input
                            type="date"
                            id="dailyDate"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                        />
                    </div>
                )}

                {/* Toggle between single-date and range mode */}
                <label
                    htmlFor="rangeModeToggle"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', paddingBottom: '0.15rem' }}
                >
                    <input
                        type="checkbox"
                        id="rangeModeToggle"
                        checked={rangeMode}
                        onChange={(e) => {
                            setRangeMode(e.target.checked);
                            // When switching to range mode seed dates from the single picker
                            if (e.target.checked) {
                                setStartDate(selectedDate);
                                setEndDate(today);
                            }
                        }}
                    />
                    Date Range
                </label>
            </div>

            {/* Validation hint */}
            {rangeMode && startDate > endDate && (
                <p style={{ color: 'var(--danger, #e53e3e)', marginBottom: '0.5rem', fontSize: '0.875rem' }}>
                    Start date must be on or before end date.
                </p>
            )}

            {/* ── Summary ───────────────────────────────────────────────── */}
            <SummaryBox>
                <div>
                    <strong>{rangeMode ? 'Period' : 'Date'}:</strong> {dateLabel}
                </div>
                <div>
                    <strong>Total Sales:</strong> {formatAmount(summary.total)}
                </div>
                <div>Cash: {formatAmount(summary.cash)}</div>
                <div>Card: {formatAmount(summary.card)}</div>
                <div>30-Day Account: {formatAmount(summary.account)}</div>
                <div className="small">Total Transactions: {summary.count}</div>
            </SummaryBox>

            {/* ── Table ─────────────────────────────────────────────────── */}
            {loading ? (
                <p>Loading...</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            {rangeMode && <th>Date</th>}
                            <th>Time</th>
                            <th>Customer</th>
                            <th>Vehicle</th>
                            <th>Service</th>
                            <th>Payment</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.length === 0 ? (
                            <tr>
                                <td colSpan={rangeMode ? 7 : 6} style={{ textAlign: 'center' }}>
                                    No sales for this {rangeMode ? 'period' : 'date'}
                                </td>
                            </tr>
                        ) : (
                            sales.map(s => (
                                <tr key={s.id}>
                                    {rangeMode && <td>{s.service_date || '-'}</td>}
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
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            )}
        </section>
    );
}
