async function getUsers(token: string) {
  const response = await fetch('https://tmszero.auth0.com/api/v2/users', {
    method: 'GET',
    mode: 'cors',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return await response.json();
}

export default getUsers;