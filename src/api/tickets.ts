export default interface TicketCategory {
  id: number;
  name: string;
  categories: {
    [category: string]: string;
  };
}

export async function saveCategories(tc: TicketCategory[]) {
  const response = await fetch(process.env.VUE_APP_BACKEND_HOST + '/tickets', {
    method: 'PUT',
    mode: 'cors',
    cache: 'no-cache',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(tc),
  });
}
