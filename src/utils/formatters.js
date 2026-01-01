export function formatAmount(num) {
    return 'R' + Number(num || 0).toFixed(2);
}

export function getNumberVal(value) {
    return parseFloat(value || '0') || 0;
}

export function todayStr() {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${dd}`;
}
