import { supabase } from '../utils/supabase';
/**
 * Get all accounts (optional filters)
 */
export const getAccounts = async ({ isPaid, customerId } = {}) => {
    let query = supabase
        .from('web_accounts')
        .select(`
      *,
      web_customers(*),
      web_sales(*)
    `)
        .order('created_at', { ascending: false });

    if (isPaid !== undefined) {
        query = query.eq('is_paid', isPaid);
    }

    if (customerId) {
        query = query.eq('customer_id', customerId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data;
};

export const getAccountsByCustomerName = async (name) => {
    const { data, error } = await supabase
        .from('web_accounts')
        .select(`
      *,
      web_customers!inner(*),
      web_sales(*)
    `)
        .eq('web_customers.name', name)
        .order('created_at', { ascending: false });

    if (error) throw error;

    const summary = data.reduce(
        (acc, a) => {
            acc.totalDue += Number(a.amount_due || 0);
            acc.totalPaid += Number(a.amount_paid || 0);
            if (!a.is_paid) acc.unpaidCount++;
            return acc;
        },
        { totalDue: 0, totalPaid: 0, unpaidCount: 0 }
    );

    return {
        accounts: data,
        summary: {
            ...summary,
            outstanding: summary.totalDue - summary.totalPaid
        }
    };
};



export const getOutstandingAccounts = async () => {
    return getAccounts({ isPaid: false });
};

export const getOverdueAccounts = async () => {
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('web_accounts')
        .select(`
      *,
      web_customers(*),
      web_sales(*)
    `)
        .eq('is_paid', false)
        .lt('due_date', today)
        .order('due_date');

    if (error) throw error;
    return data;
};

export const markAccountAsPaid = async (accountId) => {
    const { data: account, error } = await supabase
        .from('web_accounts')
        .select('*')
        .eq('id', accountId)
        .single();

    if (error) throw error;

    // Update account
    await supabase
        .from('web_accounts')
        .update({
            amount_paid: account.amount_due,
            is_paid: true,
            paid_date: new Date().toISOString().split('T')[0]
        })
        .eq('id', accountId);

    // Update sale
    if (account.sale_id) {
        await supabase
            .from('web_sales')
            .update({ is_paid: true })
            .eq('id', account.sale_id);
    }

    return true;
};

export const getAccountBalances = async () => {
    const { data, error } = await supabase
        .from('web_customers')
        .select(`
      id,
      name,
      phone,
      email,
      web_accounts(*)
    `)
        .eq('is_account_customer', true);

    if (error) throw error;

    return data.map(c => {
        const totalDue = c.web_accounts.reduce((s, a) => s + Number(a.amount_due), 0);
        const totalPaid = c.web_accounts.reduce((s, a) => s + Number(a.amount_paid), 0);

        return {
            customer_id: c.id,
            customer_name: c.name,
            phone: c.phone,
            email: c.email,
            total_due: totalDue,
            total_paid: totalPaid,
            outstanding: totalDue - totalPaid,
            unpaid_count: c.web_accounts.filter(a => !a.is_paid).length
        };
    });
};

export const getAccountCustomerNames = async () => {
    // Only get customers who actually have account records
    const { data, error } = await supabase
        .from('web_accounts')
        .select('web_customers!inner(name)')
        .order('web_customers(name)');

    if (error) throw error;

    // Get unique customer names
    const uniqueNames = [...new Set(data.map(item => item.web_customers.name))];
    return uniqueNames.sort();
};

export const deleteAccount = async (accountId) => {
    const { error } = await supabase
        .from('web_accounts')
        .delete()
        .eq('customer_id', accountId);

    if (error) throw error;
    return true;
};

