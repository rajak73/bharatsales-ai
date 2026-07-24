const fetch = require('node-fetch') || global.fetch; // just in case
async function run() {
  try {
    const loginRes = await fetch('http://localhost:6002/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@bharatsales.com', password: 'password123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.access_token;
    console.log('Token received');
    const res = await fetch('http://localhost:6002/onboarding/step/1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ companyName: 'Test' })
    });
    const data = await res.json();
    console.log('Status:', res.status);
    console.log('Response:', data);
  } catch(e) {
    console.error('Error:', e);
  }
}
run();
