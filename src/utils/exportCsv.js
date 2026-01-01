export function exportCsv(sales) {
    if (!sales.length) {
        alert('No records to export yet.');
        return;
    }

    const header = [
        'Date',
        'Time',
        'Customer',
        'Vehicle',
        'Service',
        'PaymentType',
        'Amount',
        'BaseAmount',
        'Discount',
        'Notes',
        'Paid'
    ];
    const rows = [header];

    sales.forEach(s => {
        rows.push([
            s.date || '',
            s.time || '',
            s.customer || '',
            s.vehicle || '',
            s.service || '',
            s.paymentType || '',
            s.amount ?? 0,
            s.baseAmount ?? s.amount ?? 0,
            s.discount ?? 0,
            (s.notes || '').replace(/\r?\n/g, ' '),
            s.paid ? 'Yes' : 'No'
        ]);
    });

    const csv = rows
        .map(r =>
            r
                .map(field => {
                    const str = String(field ?? '');
                    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                        return '"' + str.replace(/"/g, '""') + '"';
                    }
                    return str;
                })
                .join(',')
        )
        .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'carwash_records.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
