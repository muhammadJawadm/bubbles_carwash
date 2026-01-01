import { useState, useEffect } from 'react';
import { getAllPriceListItems, createSale } from '../services';
import { formatAmount, getNumberVal, todayStr } from '../utils/formatters';
import Pill from './ui/Pill';

export default function NewService({ onSaleCreated }) {
    const [date, setDate] = useState(todayStr());
    const [time, setTime] = useState('');
    const [customer, setCustomer] = useState('');
    const [vehicle, setVehicle] = useState('');
    const [presetService, setPresetService] = useState('');
    const [service, setService] = useState('');
    const [amount, setAmount] = useState('');
    const [discount, setDiscount] = useState('0');
    const [paymentType, setPaymentType] = useState('cash');
    const [notes, setNotes] = useState('');
    const [priceList, setPriceList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const baseAmount = getNumberVal(amount);
    const discountAmount = getNumberVal(discount);
    const finalAmount = Math.max(0, baseAmount - discountAmount);

    // Fetch price list on mount
    useEffect(() => {
        fetchPriceList();
    }, []);

    const fetchPriceList = async () => {
        try {
            setLoading(true);
            const data = await getAllPriceListItems(true);
            setPriceList(data);
        } catch (error) {
            console.error('Error fetching price list:', error);
            alert('Failed to load price list');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (presetService !== '') {
            const item = priceList[Number(presetService)];
            if (item) {
                setService(`${item.category} – ${item.vehicle}`);
                if (item.price && item.price > 0) {
                    setAmount(item.price.toFixed(2));
                }
                setDiscount('0');
            }
        }
    }, [presetService, priceList]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!date || !customer || !service || isNaN(baseAmount) || baseAmount <= 0) {
            alert('Please fill in date, customer, service and a valid amount.');
            return;
        }
        if (discountAmount < 0) {
            alert('Discount cannot be negative.');
            return;
        }
        if (discountAmount > baseAmount) {
            alert('Discount cannot be more than the amount.');
            return;
        }

        try {
            setSaving(true);

            await createSale({
                date,
                time: time || null,
                customerName: customer,
                vehicleRegistration: vehicle || null,
                vehicleDescription: vehicle || null,
                serviceDescription: service,
                baseAmount,
                discount: discountAmount,
                finalAmount,
                paymentType,
                isPaid: paymentType !== 'account',
                notes: notes || null
            });

            // Reset form
            setDate(todayStr());
            setTime('');
            setCustomer('');
            setVehicle('');
            setPresetService('');
            setService('');
            setAmount('');
            setDiscount('0');
            setPaymentType('cash');
            setNotes('');

            alert('Service saved ✅');

            // Notify parent to refresh other tabs
            if (onSaleCreated) onSaleCreated();

        } catch (error) {
            console.error('Error saving sale:', error);
            alert('Failed to save service: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="tab active">
            <h2>Record New Service</h2>
            <form onSubmit={handleSubmit}>
                <div className="row">
                    <div>
                        <label htmlFor="date">Date</label>
                        <input
                            type="date"
                            id="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="time">Time</label>
                        <input
                            type="time"
                            id="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                        />
                    </div>
                </div>

                <label htmlFor="customer">Customer Name</label>
                <input
                    type="text"
                    id="customer"
                    placeholder="Walk-in / Company name"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    required
                />

                <label htmlFor="vehicle">Vehicle (Reg / Description)</label>
                <input
                    type="text"
                    id="vehicle"
                    placeholder="e.g. ND 123 456 / White Polo"
                    value={vehicle}
                    onChange={(e) => setVehicle(e.target.value)}
                />

                <label htmlFor="presetService">Price List (optional)</label>
                <select
                    id="presetService"
                    value={presetService}
                    onChange={(e) => setPresetService(e.target.value)}
                    disabled={loading}
                >
                    <option value="">
                        {loading ? 'Loading...' : '-- Select from Bubbles & Bugs price list --'}
                    </option>
                    {priceList.map((item, index) => (
                        <option key={item.id || index} value={String(index)}>
                            {item.price && item.price > 0
                                ? `${item.category} – ${item.vehicle} (R${item.price})`
                                : `${item.category} – ${item.vehicle}`}
                        </option>
                    ))}
                </select>

                <label htmlFor="service">Service Description</label>
                <input
                    type="text"
                    id="service"
                    placeholder="e.g. Full Wash – Car"
                    value={service}
                    onChange={(e) => setService(e.target.value)}
                    required
                />

                <div className="row">
                    <div>
                        <label htmlFor="amount">Amount (R, before discount)</label>
                        <input
                            type="number"
                            id="amount"
                            step="0.01"
                            min="0"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="discount">Discount (R)</label>
                        <input
                            type="number"
                            id="discount"
                            step="0.01"
                            min="0"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                        />
                    </div>
                </div>
                <div className="small">Final amount to charge: {formatAmount(finalAmount)}</div>

                <label>Payment Type</label>
                <div className="pill-row">
                    <Pill value="cash" active={paymentType === 'cash'} onClick={setPaymentType}>
                        Cash
                    </Pill>
                    <Pill value="card" active={paymentType === 'card'} onClick={setPaymentType}>
                        Card
                    </Pill>
                    <Pill value="account" active={paymentType === 'account'} onClick={setPaymentType}>
                        30-Day Account
                    </Pill>
                </div>

                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                    id="notes"
                    placeholder="Any extra info (inside only, combo, etc.)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                ></textarea>

                <button type="submit" className="primary" disabled={saving}>
                    {saving ? 'Saving...' : 'Save Service'}
                </button>
            </form>
            <p className="small">All data is now saved in Supabase cloud database.</p>
        </section>
    );
}
