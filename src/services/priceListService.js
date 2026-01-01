import { supabase } from '../utils/supabase';

/**
 * Price List Service
 * Handles all price list–related database operations
 */

/**
 * Get all price list items
 * @param {boolean} activeOnly
 */
export const getAllPriceListItems = async (activeOnly = true) => {
    let query = supabase
        .from('web_price_list')
        .select('*')
        .order('category')
        .order('vehicle');

    if (activeOnly) {
        query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;

    return data;
};

/**
 * Get price list items by category
 */
export const getPriceListByCategory = async (category) => {
    const { data, error } = await supabase
        .from('web_price_list')
        .select('*')
        .eq('category', category)
        .eq('is_active', true)
        .order('vehicle');

    if (error) throw error;
    return data;
};

/**
 * Get unique active categories
 */
export const getCategories = async () => {
    const { data, error } = await supabase
        .from('web_price_list')
        .select('category')
        .eq('is_active', true);

    if (error) throw error;

    return [...new Set(data.map(i => i.category))];
};

/**
 * Create price list item
 */
export const createPriceListItem = async ({
    category,
    vehicle,
    price,
    isActive = true,
    description = null
}) => {
    const { data, error } = await supabase
        .from('web_price_list')
        .insert({
            category,
            vehicle,
            price,
            is_active: isActive,
            description
        })
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Update price list item
 */
export const updatePriceListItem = async (id, updates) => {
    const { data, error } = await supabase
        .from('web_price_list')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

/**
 * Soft delete (deactivate)
 */
export const deactivatePriceListItem = async (id) => {
    return updatePriceListItem(id, { is_active: false });
};

/**
 * Hard delete
 */
export const deletePriceListItem = async (id) => {
    const { error } = await supabase
        .from('web_price_list')
        .delete()
        .eq('id', id);

    if (error) throw error;
    return true;
};

/**
 * Search price list (category or vehicle)
 */
export const searchPriceList = async (searchTerm) => {
    const { data, error } = await supabase
        .from('web_price_list')
        .select('*')
        .or(
            `category.ilike.%${searchTerm}%,vehicle.ilike.%${searchTerm}%`
        )
        .eq('is_active', true)
        .order('category')
        .order('vehicle');

    if (error) throw error;
    return data;
};
