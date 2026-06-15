import { useState, useEffect } from 'react';
import { getAllPriceListItems, createSale, getCompanies, addCompany, getVehiclesByCompany, addVehicle } from '../services';
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

    // Company dropdown state
    const [companies, setCompanies] = useState([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState(null);
    const [companyDropdownValue, setCompanyDropdownValue] = useState('');
    const [addingCompany, setAddingCompany] = useState(false);
    const [newCompanyName, setNewCompanyName] = useState('');
    const [savingCompany, setSavingCompany] = useState(false);

    // Vehicle dropdown state
    const [vehicles, setVehicles] = useState([]);
    const [vehicleDropdownValue, setVehicleDropdownValue] = useState('');
    const [addingVehicle, setAddingVehicle] = useState(false);
    const [newVehicleReg, setNewVehicleReg] = useState('');
    const [savingVehicle, setSavingVehicle] = useState(false);

    const baseAmount = getNumberVal(amount);
    const discountAmount = getNumberVal(discount);
    const finalAmount = Math.max(0, baseAmount - discountAmount);

    useEffect(() => {
        fetchPriceList();
        fetchCompanies();
    }, []);

    // Reload vehicles whenever the selected company changes
    useEffect(() => {
        if (selectedCompanyId) {
            fetchVehicles(selectedCompanyId);
        } else {
            setVehicles([]);
        }
    }, [selectedCompanyId]);

    useEffect(() => {
        if (presetService !== '') {
            const item = priceList[Number(presetService)];
            if (item) {
                setService(`${item.category} – ${item.vehicle}`);
                if (item.price && item.price > 0) setAmount(item.price.toFixed(2));
                setDiscount('0');
            }
        }
    }, [presetService, priceList]);

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

    const fetchCompanies = async () => {
        try {
            const data = await getCompanies();
            setCompanies(data);
        } catch (error) {
            console.error('Error fetching companies:', error);
        }
    };

    const fetchVehicles = async (companyId) => {
        try {
            const data = await getVehiclesByCompany(companyId);
            setVehicles(data);
        } catch (error) {
            console.error('Error fetching vehicles:', error);
        }
    };

    // ── Company handlers ─────────────────────────────────────────────────────

    const handleCompanyChange = (e) => {
        const val = e.target.value;
        if (val === '__add_new__') {
            setCompanyDropdownValue('__add_new__');
            setAddingCompany(true);
        } else {
            const found = companies.find(c => c.name === val);
            setCompanyDropdownValue(val);
            setCustomer(val);
            setAddingCompany(false);
            setNewCompanyName('');
            setSelectedCompanyId(found?.id || null);
            // Reset vehicle when company changes
            setVehicle('');
            setVehicleDropdownValue('');
            setAddingVehicle(false);
            setNewVehicleReg('');
        }
    };

    const handleAddCompany = async () => {
        const name = newCompanyName.trim();
        if (!name) return;
        try {
            setSavingCompany(true);
            const created = await addCompany(name);
            setCompanies(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name)));
            setCustomer(created.name);
            setCompanyDropdownValue(created.name);
            setSelectedCompanyId(created.id);
            setAddingCompany(false);
            setNewCompanyName('');
            // Reset vehicle for the new company
            setVehicle('');
            setVehicleDropdownValue('');
            setAddingVehicle(false);
            setNewVehicleReg('');
        } catch (error) {
            console.error('Error adding company:', error);
            alert('Failed to add company: ' + error.message);
        } finally {
            setSavingCompany(false);
        }
    };

    const handleCancelCompany = () => {
        setAddingCompany(false);
        setNewCompanyName('');
        setCompanyDropdownValue(customer);
    };

    // ── Vehicle handlers ─────────────────────────────────────────────────────

    const handleVehicleChange = (e) => {
        const val = e.target.value;
        if (val === '__add_vehicle__') {
            setVehicleDropdownValue('__add_vehicle__');
            setAddingVehicle(true);
        } else {
            setVehicleDropdownValue(val);
            setVehicle(val);
            setAddingVehicle(false);
            setNewVehicleReg('');
        }
    };

    const handleAddVehicle = async () => {
        const reg = newVehicleReg.trim().toUpperCase();
        if (!reg || !selectedCompanyId) return;
        try {
            setSavingVehicle(true);
            const created = await addVehicle(selectedCompanyId, reg);
            setVehicles(prev => [...prev, created].sort((a, b) => a.registration.localeCompare(b.registration)));
            setVehicle(created.registration);
            setVehicleDropdownValue(created.registration);
            setAddingVehicle(false);
            setNewVehicleReg('');
        } catch (error) {
            console.error('Error adding vehicle:', error);
            alert('Failed to add vehicle: ' + error.message);
        } finally {
            setSavingVehicle(false);
        }
    };

    const handleCancelVehicle = () => {
        setAddingVehicle(false);
        setNewVehicleReg('');
        setVehicleDropdownValue(vehicle);
    };

    // ── Form submit ──────────────────────────────────────────────────────────

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
            setCompanyDropdownValue('');
            setSelectedCompanyId(null);
            setAddingCompany(false);
            setNewCompanyName('');
            setVehicle('');
            setVehicleDropdownValue('');
            setAddingVehicle(false);
            setNewVehicleReg('');
            setPresetService('');
            setService('');
            setAmount('');
            setDiscount('0');
            setPaymentType('cash');
            setNotes('');

            alert('Service saved ✅');
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

                {/* ── Company dropdown ──────────────────────────────────── */}
                <label htmlFor="customer">Customer / Company</label>
                <select
                    id="customer"
                    value={companyDropdownValue}
                    onChange={handleCompanyChange}
                >
                    <option value="">-- Select company --</option>
                    {companies.map(c => (
                        <option key={c.id} value={c.name}>{c.name}</option>
                    ))}
                    <option value="__add_new__">+ Add new company…</option>
                </select>

                {addingCompany && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="New company name"
                            value={newCompanyName}
                            onChange={e => setNewCompanyName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCompany())}
                            style={{ flex: 1 }}
                            autoFocus
                        />
                        <button type="button" className="secondary" onClick={handleAddCompany}
                            disabled={savingCompany || !newCompanyName.trim()}>
                            {savingCompany ? 'Adding…' : 'Add'}
                        </button>
                        <button type="button" className="secondary" onClick={handleCancelCompany}>
                            Cancel
                        </button>
                    </div>
                )}

                {/* ── Vehicle dropdown ──────────────────────────────────── */}
                <label htmlFor="vehicle">Vehicle Registration</label>
                <select
                    id="vehicle"
                    value={vehicleDropdownValue}
                    onChange={handleVehicleChange}
                    disabled={!selectedCompanyId}
                >
                    <option value="">
                        {selectedCompanyId ? '-- Select vehicle --' : '-- Select a company first --'}
                    </option>
                    {vehicles.map(v => (
                        <option key={v.id} value={v.registration}>{v.registration}</option>
                    ))}
                    {selectedCompanyId && (
                        <option value="__add_vehicle__">+ Add new vehicle…</option>
                    )}
                </select>

                {addingVehicle && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <input
                            type="text"
                            placeholder="e.g. ND 123 456"
                            value={newVehicleReg}
                            onChange={e => setNewVehicleReg(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddVehicle())}
                            style={{ flex: 1 }}
                            autoFocus
                        />
                        <button type="button" className="secondary" onClick={handleAddVehicle}
                            disabled={savingVehicle || !newVehicleReg.trim()}>
                            {savingVehicle ? 'Adding…' : 'Add'}
                        </button>
                        <button type="button" className="secondary" onClick={handleCancelVehicle}>
                            Cancel
                        </button>
                    </div>
                )}

                {/* ── Price list & service ──────────────────────────────── */}
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
                    <Pill value="cash" active={paymentType === 'cash'} onClick={setPaymentType}>Cash</Pill>
                    <Pill value="card" active={paymentType === 'card'} onClick={setPaymentType}>Card</Pill>
                    <Pill value="account" active={paymentType === 'account'} onClick={setPaymentType}>30-Day Account</Pill>
                    <Pill value="paylater" active={paymentType === 'paylater'} onClick={setPaymentType}>Pay Later</Pill>
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
