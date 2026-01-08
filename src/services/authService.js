import { supabase } from '../utils/supabase';

/**
 * Sign in with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{user, session, error}>}
 */
export const signIn = async (email, password) => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;

        return { user: data.user, session: data.session, error: null };
    } catch (error) {
        console.error('Sign in error:', error);
        return { user: null, session: null, error };
    }
};

/**
 * Sign out the current user
 * @returns {Promise<{error}>}
 */
export const signOut = async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Sign out error:', error);
        return { error };
    }
};

/**
 * Get the current session
 * @returns {Promise<{session, error}>}
 */
export const getSession = async () => {
    try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        return { session: data.session, error: null };
    } catch (error) {
        console.error('Get session error:', error);
        return { session: null, error };
    }
};

/**
 * Get the current user
 * @returns {Promise<{user, error}>}
 */
export const getCurrentUser = async () => {
    try {
        const { data, error } = await supabase.auth.getUser();
        if (error) throw error;
        return { user: data.user, error: null };
    } catch (error) {
        console.error('Get current user error:', error);
        return { user: null, error };
    }
};

/**
 * Check if user exists in admin-user table
 * @param {string} userId - The user's auth ID
 * @returns {Promise<{isAdmin, adminData, error}>}
 */
export const checkAdminUser = async (userId) => {
    try {
        const { data, error } = await supabase
            .from('admin-user')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .single();

        if (error) {
            // User not found in admin table
            if (error.code === 'PGRST116') {
                return { isAdmin: false, adminData: null, error: null };
            }
            throw error;
        }

        return { isAdmin: true, adminData: data, error: null };
    } catch (error) {
        console.error('Check admin user error:', error);
        return { isAdmin: false, adminData: null, error };
    }
};

/**
 * Verify if user is authenticated and is an admin
 * @returns {Promise<{isAuthenticated, isAdmin, user, adminData, error}>}
 */
export const verifyAdminAccess = async () => {
    try {
        // First check if user is authenticated
        const { user, error: userError } = await getCurrentUser();

        if (userError || !user) {
            return {
                isAuthenticated: false,
                isAdmin: false,
                user: null,
                adminData: null,
                error: userError
            };
        }

        // Then check if user is in admin-user table
        const { isAdmin, adminData, error: adminError } = await checkAdminUser(user.id);

        if (adminError) {
            return {
                isAuthenticated: true,
                isAdmin: false,
                user,
                adminData: null,
                error: adminError
            };
        }

        return {
            isAuthenticated: true,
            isAdmin,
            user,
            adminData,
            error: null
        };
    } catch (error) {
        console.error('Verify admin access error:', error);
        return {
            isAuthenticated: false,
            isAdmin: false,
            user: null,
            adminData: null,
            error
        };
    }
};

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Object} Subscription object with unsubscribe method
 */
export const onAuthStateChange = (callback) => {
    return supabase.auth.onAuthStateChange(callback);
};
