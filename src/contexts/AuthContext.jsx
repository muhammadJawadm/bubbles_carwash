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
        let isMounted = true;

        // Check current session on mount with timeout protection
        const initAuth = async () => {
            try {
                // Add a timeout to prevent infinite loading
                const timeoutId = setTimeout(() => {
                    if (isMounted) {
                        console.warn('Auth check timed out');
                        setLoading(false);
                    }
                }, 5000); // 5 second timeout

                await checkUser();
                clearTimeout(timeoutId);
            } catch (error) {
                console.error('Init auth error:', error);
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        initAuth();

        // Listen for auth state changes
        const { data: authListener } = onAuthStateChange(async (event, session) => {
            if (!isMounted) return;

            console.log('Auth state changed:', event);

            if (event === 'SIGNED_IN') {
                await checkUser();
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setAdminData(null);
                setIsAdmin(false);
                setLoading(false);
            } else if (event === 'TOKEN_REFRESHED') {
                // Session refreshed, check user again
                await checkUser();
            }
        });

        // Cleanup subscription
        return () => {
            isMounted = false;
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    const checkUser = async () => {
        try {
            setLoading(true);

            // Add timeout wrapper
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Auth check timeout')), 5000);
            });

            const authPromise = verifyAdminAccess();

            const result = await Promise.race([authPromise, timeoutPromise]);

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
