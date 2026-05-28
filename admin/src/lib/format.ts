const won = new Intl.NumberFormat('ko-KR');
export const formatWon = (n: number | null | undefined): string =>
  n == null ? '-' : `${won.format(n)}원`;

export const formatDate = (iso: string): string => {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};
