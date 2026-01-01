import { useState, useEffect } from 'react';
import { getSales, getDailySalesSummary } from '../services';
import { formatAmount, todayStr } from '../utils/formatters';
import Badge from './ui/Badge';
import SummaryBox from './ui/SummaryBox';

export default function DailySales({ refreshTrigger }) {
    const [selectedDate, setSelectedDate] = useState(todayStr());
    const [sales, setSales] = useState([]);
    const [summary, setSummary] = useState({ total: 0, cash: 0, card: 0, account: 0, count: 0 });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchDailySales();
    }, [selectedDate, refreshTrigger]);

    const fetchDailySales = async () => {
        try {
            setLoading(true);

            // Fetch sales for the selected date
            const salesData = await getSales({ date: selectedDate });
            setSales(salesData);

            // Fetch summary
            const summaryData = await getDailySalesSummary(selectedDate);
            setSummary(summaryData);

        } catch (error) {
            console.error('Error fetching daily sales:', error);
            alert('Failed to load sales data');
        } finally {
            setLoading(false);
        }
    };

    const paymentBadge = (type) => {
        if (type === 'cash') return <Badge type="cash">Cash</Badge>;
        if (type === 'card') return <Badge type="card">Card</Badge>;
        return <Badge type="account">30-Day</Badge>;
    };

    return (
        <section className="tab active">
            <h2>Daily Sales</h2>
            <label htmlFor="dailyDate">Select Date</label>
            <input
                type="date"
                id="dailyDate"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
            />

            <SummaryBox>
                <div>
                    <strong>Total Sales:</strong> {formatAmount(summary.total)}
                </div>
                <div>Cash: {formatAmount(summary.cash)}</div>
                <div>Card: {formatAmount(summary.card)}</div>
                <div>30-Day Account (today's): {formatAmount(summary.account)}</div>
                <div className="small">Total Transactions: {summary.count}</div>
            </SummaryBox>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <table>
                    <thead>
                        <tr>
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
                                <td colSpan="6" style={{ textAlign: 'center' }}>
                                    No sales for this date
                                </td>
                            </tr>
                        ) : (
                            sales.map(s => (
                                <tr key={s.id}>
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
