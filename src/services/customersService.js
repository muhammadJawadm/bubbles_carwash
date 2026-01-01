import { supabase } from '../utils/supabase';

/**
 * Create customer
 */
export const createCustomer = async ({
    name,
    phone = null,
    email = null,
    address = null,
    isAccountCustomer = false
}) => {
    const { data, error } = await supabase
        .from('web_customers')
        .insert({
            name,
            phone,
            email,
            address,
            is_account_customer: isAccountCustomer
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getCustomers = async ({ accountOnly = false, search } = {}) => {
    let query = supabase
        .from('web_customers')
        .select('*')
        .order('name');

    if (accountOnly) {
        query = query.eq('is_account_customer', true);
    }

    if (search) {
        query = query.ilike('name', `%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data;
};

export const getCustomerById = async (id) => {
    const { data, error } = await supabase
        .from('web_customers')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

export const findCustomersByName = async (name) => {
    const { data, error } = await supabase
        .from('web_customers')
        .select('*')
        .ilike('name', name);

    if (error) throw error;
    return data;
};

export const updateCustomer = async (id, updates) => {
    const { data, error } = await supabase
        .from('web_customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteCustomer = async (id) => {
    const { error } = await supabase
        .from('web_customers')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

export const getOrCreateCustomer = async ({
    name,
    phone = null,
    email = null,
    address = null,
    isAccountCustomer = false
}) => {
    if (email || phone) {
        const { data, error } = await supabase
            .from('web_customers')
            .select('*')
            .or(
                [
                    email ? `email.eq.${email}` : null,
                    phone ? `phone.eq.${phone}` : null
                ].filter(Boolean).join(',')
            )
            .limit(1);

        if (error) throw error;
        if (data.length) return data[0];
    }

    return await createCustomer({
        name,
        phone,
        email,
        address,
        isAccountCustomer
    });
};
