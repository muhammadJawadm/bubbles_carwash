export default function Pill({ value, active, onClick, children }) {
    const className = `pill ${active ? 'active' : ''}`;
    return (
        <div className={className} onClick={() => onClick(value)}>
            {children}
        </div>
    );
}
