
const axios = require('axios');

async function testApi() {
  try {
    const res = await axios.get('http://localhost:3001/api/questions/workflow/positionnement?formation=sketchup&scope=auto');
    console.log('Questions count:', res.data.length);
    if (res.data.length > 0) {
      console.log('Sample question:', JSON.stringify(res.data[0], null, 2));
    }
  } catch (err) {
    console.error('API Error:', err.message);
  }
}

testApi();
