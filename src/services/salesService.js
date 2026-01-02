import { supabase } from '../utils/supabase';

/**
 * Sales Service
 * Handles all sales-related database operations
 */

/**
 * Create a new sale
 */
export const createSale = async ({
    date,
    time = null,
    customerName,
    vehicleRegistration = null,
    vehicleDescription = null,
    serviceDescription,
    baseAmount,
    discount = 0,
    finalAmount,
    paymentType,
    isPaid = true,
    notes = null
}) => {
    const { data, error } = await supabase
        .from('web_sales')
        .insert({
            service_date: date,
            service_time: time,
            customer_name: customerName,
            vehicle_registration: vehicleRegistration,
            vehicle_description: vehicleDescription,
            service_description: serviceDescription,
            base_amount: baseAmount,
            discount,
            final_amount: finalAmount,
            payment_type: paymentType,
            is_paid: isPaid,
            notes
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Get all sales (with optional filters)
 */
export const getSales = async ({
    date,
    customer,
    paymentType,
    isPaid
} = {}) => {
    let query = supabase
        .from('web_sales')
        .select('*')
        .order('service_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (date) query = query.eq('service_date', date);
    if (customer) query = query.ilike('customer_name', `%${customer}%`);
    if (paymentType) query = query.eq('payment_type', paymentType);
    if (isPaid !== undefined) query = query.eq('is_paid', isPaid);

    const { data, error } = await query;
    if (error) throw error;

    return data;
};

/**
 * Get sales by date range
 */
export const getSalesByDateRange = async (startDate, endDate) => {
    const { data, error } = await supabase
        .from('web_sales')
        .select('*')
        .gte('service_date', startDate)
        .lte('service_date', endDate)
        .order('service_date', { ascending: false });

    if (error) throw error;
    return data;
};

/**
 * Get daily sales summary
 */
export const getDailySalesSummary = async (date) => {
    const { data, error } = await supabase
        .from('web_sales')
        .select('final_amount, payment_type')
        .eq('service_date', date);

    if (error) throw error;

    return data.reduce(
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
};

/**
 * Update sale
 */
export const updateSale = async (id, updates) => {
    const { data, error } = await supabase
        .from('web_sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Mark sale as paid
 */
export const markSaleAsPaid = async (id) => {
    return updateSale(id, { is_paid: true });
};

/**
 * Delete sale
 */
export const deleteSale = async (id) => {
    const { error } = await supabase
        .from('web_sales')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

//Delete all sales
export const deleteAllSales = async () => {
    const { data: rows, error: fetchError } = await supabase
        .from('web_sales')
        .select('id');
    if (fetchError) {
        console.error('Error fetching sales:', fetchError);
        throw fetchError;
    }
    if (rows.length === 0) {
        console.error('No sales found for delete');
        throw new Error('No sales found for delete');
    }
    const ids = rows.map(row => row.id);
    const { error } = await supabase
        .from('web_sales')
        .delete()
        .in('id', ids);

    if (error) throw error;
    return true;
};

/**
 * Get sales by customer name
 */
export const getSalesByCustomer = async (customerName) => {
    const { data, error } = await supabase
        .from('web_sales')
        .select('*')
        .eq('customer_name', customerName)
        .order('service_date', { ascending: false });

    if (error) throw error;
    return data;
};
