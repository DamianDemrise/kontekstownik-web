// Czysta logika stronicowania kart materiałów (testowana w scripts/test-paging.mjs).
export const PAGE_SIZE = 9;

// total = liczba kart po filtrze; page poza zakresem jest przycinana, więc nie powstaje pusta strona.
export function paginate(total, page = 1, size = PAGE_SIZE) {
  const pages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, Math.trunc(page) || 1), pages);
  return { pages, page: current, from: (current - 1) * size, to: Math.min(current * size, total) };
}
