import { createContext, useContext, useState, useEffect } from 'react';
import { verifyAdminAccess, signOut as authSignOut, onAuthStateChange } from '../services/authService';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [adminData, setAdminData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        // Check current session on mount
        checkUser();

        // Listen for auth state changes
        const { data: authListener } = onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN') {
                await checkUser();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setAdminData(null);
                setIsAdmin(false);
            }
        });

        // Cleanup subscription
        return () => {
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    const checkUser = async () => {
        try {
            setLoading(true);
            const result = await verifyAdminAccess();

            if (result.isAuthenticated && result.isAdmin) {
                setUser(result.user);
                setAdminData(result.adminData);
                setIsAdmin(true);
            } else {
                setUser(null);
                setAdminData(null);
                setIsAdmin(false);
            }
        } catch (error) {
            console.error('Error checking user:', error);
            setUser(null);
            setAdminData(null);
            setIsAdmin(false);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await authSignOut();
            setUser(null);
            setAdminData(null);
            setIsAdmin(false);
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    const value = {
        user,
        adminData,
        isAdmin,
        loading,
        signOut,
        checkUser, // Expose this to allow manual refresh after login
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
