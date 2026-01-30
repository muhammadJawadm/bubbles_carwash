import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabase';

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

    useEffect(() => {
        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                // Check admin status
                supabase
                    .from('admin-user')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .eq('is_active', true)
                    .single()
                    .then(({ data, error }) => {
                        if (data) {
                            setUser(session.user);
                            setAdminData(data);
                        }
                        setLoading(false);
                    })
                    .catch(() => setLoading(false));
            } else {
                setLoading(false);
            }
        }).catch(() => setLoading(false));

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                supabase
                    .from('admin-user')
                    .select('*')
                    .eq('user_id', session.user.id)
                    .eq('is_active', true)
                    .single()
                    .then(({ data }) => {
                        if (data) {
                            setUser(session.user);
                            setAdminData(data);
                        }
                    });
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setAdminData(null);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUser(null);
        setAdminData(null);
    };

    const value = {
        user,
        adminData,
        isAdmin: !!user && !!adminData,
        loading,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
