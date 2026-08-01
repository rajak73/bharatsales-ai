const jwt = require('jsonwebtoken');

async function test() {
  const secret = 'bharatsales-super-secret-key-2026';
  
  // Create an Org Admin token
  const token = jwt.sign({
    sub: 'org-admin-id',
    email: 'admin@org.com',
    orgId: 'org-1',
    role: 'Organization Admin'
  }, secret);

  const testEndpoint = async (path) => {
    try {
      const res = await fetch(`http://localhost:3000${path}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`${path}: ${res.status} ${res.statusText}`);
    } catch (e) {
      console.log(`${path}: Error ${e.message}`);
    }
  }

  await testEndpoint('/api/inventory');
  await testEndpoint('/api/collections');
  await testEndpoint('/api/returns');
}

test();
