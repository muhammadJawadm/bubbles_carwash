import { useAuth } from '../contexts/AuthContext';

export default function Header() {
    const { user, adminData, signOut } = useAuth();

    return (
        <header>
            <h1 style={{ paddingLeft: '250px' }}>Bubbles & Bugs – Car Wash Manager</h1>
            {user && (
                <div className="header-user-section">
                    <span className="user-email">{user.email}</span>
                    <button onClick={signOut} className="logout-button">
                        Logout
                    </button>
                </div>
            )}
        </header>
    );
}
