import { supabase } from '../utils/supabase';

export const getVehiclesByCompany = async (companyId) => {
    const { data, error } = await supabase
        .from('web_vehicles')
        .select('*')
        .eq('company_id', companyId)
        .order('registration', { ascending: true });

    if (error) throw error;
    return data;
};

export const addVehicle = async (companyId, registration) => {
    const { data, error } = await supabase
        .from('web_vehicles')
        .insert({ company_id: companyId, registration: registration.trim().toUpperCase() })
        .select()
        .single();

    if (error) throw error;
    return data;
};
