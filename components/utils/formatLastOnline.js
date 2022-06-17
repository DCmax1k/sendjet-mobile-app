export default function formatLastOnline(lastOnline) {
    const now = new Date();
    const lastOnlineDate = new Date(lastOnline)
    const diff = now - lastOnlineDate;
    const diffMinutes = Math.ceil((diff / 1000) / 60);
    const diffHours = Math.ceil((diff / 1000) / 3600);
    const diffDays = Math.ceil((diff / 1000) / 86400);
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return `Last online ${lastOnlineDate.toLocaleDateString()}`;
}