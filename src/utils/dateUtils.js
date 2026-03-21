export const formatDateSafe = (dateStr) => {
    if (!dateStr) return '';
    // Handle YYYY-MM-DD format directly to avoid timezone shift
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length === 3) {
        const [year, month, day] = parts;
        return `${day}/${month}/${year}`;
    }
    // Fallback for other formats
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString();
};

export const getLocalTodayDate = () => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

/**
 * Calculates the difference in days between two YYYY-MM-DD date strings.
 * Returns (date2 - date1) in days.
 */
export const getDaysDiff = (date1Str, date2Str) => {
    if (!date1Str || !date2Str) return 0;
    
    // Parse as local dates at midnight
    const [y1, m1, d1] = date1Str.split('-').map(Number);
    const [y2, m2, d2] = date2Str.split('-').map(Number);
    
    const d1Obj = new Date(y1, m1 - 1, d1);
    const d2Obj = new Date(y2, m2 - 1, d2);
    
    const diffTime = d2Obj - d1Obj;
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
};
