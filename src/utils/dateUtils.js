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
