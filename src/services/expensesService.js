import { supabase } from '../utils/supabase';

export const addExpense = async ({ expenseType, amount, date, notes = null }) => {
    const { data, error } = await supabase
        .from('web_expenses')
        .insert({
            expense_type: expenseType,
            amount,
            expense_date: date,
            notes
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getExpensesByMonth = async (year, month) => {
    const start = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const end = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await supabase
        .from('web_expenses')
        .select('*')
        .gte('expense_date', start)
        .lte('expense_date', end)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const deleteExpense = async (id) => {
    const { error } = await supabase
        .from('web_expenses')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};
