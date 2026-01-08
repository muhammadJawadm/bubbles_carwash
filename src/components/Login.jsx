import { useState } from 'react';
import { signIn } from '../services/authService';
import { checkAdminUser } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { checkUser } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // First, sign in with Supabase Auth
            const { user, session, error: signInError } = await signIn(email, password);

            if (signInError) {
                setError(signInError.message || 'Failed to sign in. Please check your credentials.');
                setLoading(false);
                return;
            }

            if (!user) {
                setError('Authentication failed. Please try again.');
                setLoading(false);
                return;
            }

            // Then, check if user exists in admin-user table
            const { isAdmin, error: adminError } = await checkAdminUser(user.id);

            if (adminError) {
                setError('Error verifying admin access. Please contact support.');
                setLoading(false);
                return;
            }

            if (!isAdmin) {
                setError('Access denied. You are not authorized to access this system.');
                setLoading(false);
                return;
            }

            // If both checks pass, refresh auth context
            await checkUser();

        } catch (err) {
            console.error('Login error:', err);
            setError('An unexpected error occurred. Please try again.');
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-background">
                <div className="bubble bubble-1"></div>
                <div className="bubble bubble-2"></div>
                <div className="bubble bubble-3"></div>
                <div className="bubble bubble-4"></div>
            </div>

            <div className="login-card">
                <div className="login-header">
                    <div className="login-logo">
                        <div className="logo-icon">🚗</div>
                    </div>
                    <h1 className="login-title">Bubbles Car Wash</h1>
                    <p className="login-subtitle">Admin Portal</p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label htmlFor="email" className="form-label">
                            Email Address
                        </label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="form-input"
                            placeholder="admin@bubblescarwash.com"
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password" className="form-label">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input"
                            placeholder="••••••••"
                            required
                            disabled={loading}
                        />
                    </div>

                    {error && (
                        <div className="error-message">
                            <span className="error-icon">⚠️</span>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="login-button"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <span className="spinner"></span>
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p className="footer-text">
                        Secure access for authorized administrators only
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
