import { useState, useEffect } from 'react';

const STORAGE_KEY = 'carwashSales_v2';

export function useLocalStorage() {
    const [sales, setSales] = useState([]);

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (!raw) return;
            const data = JSON.parse(raw);
            if (Array.isArray(data)) {
                setSales(data);
            }
        } catch (e) {
            console.error('Error loading sales', e);
        }
    }, []);

    // Save to localStorage whenever sales change
    useEffect(() => {
        if (sales.length > 0 || localStorage.getItem(STORAGE_KEY)) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
        }
    }, [sales]);

    return [sales, setSales];
}
