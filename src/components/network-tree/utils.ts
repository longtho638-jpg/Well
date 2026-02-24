export const getRankColor = (rankId: number) => {
    if (rankId <= 2) return 'border-purple-500 shadow-purple-500/20'; // High rank
    if (rankId <= 5) return 'border-blue-500 shadow-blue-500/20'; // Mid rank
    return 'border-zinc-700 shadow-zinc-500/10'; // Low rank
};
