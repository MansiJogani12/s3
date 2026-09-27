async function test() {
  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ loginId: '24IT001', password: 'password123' })
    });
    const data = await res.json();
    console.log('Login Response:', data);
    const token = data.token;
    console.log('Login success');
    
    const ghRes = await fetch('http://localhost:5000/api/integration/github', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Github:', await ghRes.json());
    
    const tasksRes = await fetch('http://localhost:5000/api/agile/tasks', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Tasks length:', (await tasksRes.json()).tasks?.length);
    
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
