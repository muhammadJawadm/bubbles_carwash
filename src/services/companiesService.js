import { supabase } from '../utils/supabase';

export const getCompanies = async () => {
    const { data, error } = await supabase
        .from('web_companies')
        .select('*')
        .order('name', { ascending: true });

    if (error) throw error;
    return data;
};

export const addCompany = async (name) => {
    const { data, error } = await supabase
        .from('web_companies')
        .insert({ name: name.trim() })
        .select()
        .single();

    if (error) throw error;
    return data;
};
