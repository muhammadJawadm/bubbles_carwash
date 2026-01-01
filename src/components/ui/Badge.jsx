export default function Badge({ type, children }) {
    const className = `badge ${type}`;
    return <span className={className}>{children}</span>;
}
