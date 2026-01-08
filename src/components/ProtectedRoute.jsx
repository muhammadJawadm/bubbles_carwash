import { useAuth } from '../contexts/AuthContext';
import Login from './Login';

function ProtectedRoute({ children }) {
    const { user, isAdmin, loading } = useAuth();

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner-large">
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                    <div className="spinner-ring"></div>
                </div>
                <p className="loading-text">Loading...</p>
            </div>
        );
    }

    if (!user || !isAdmin) {
        return <Login />;
    }

    return children;
}

export default ProtectedRoute;
