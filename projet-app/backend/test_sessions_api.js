const axios = require('axios');
require('dotenv').config();

const apiBaseUrl = process.env.VITE_API_BASE_URL || "http://localhost:3001";

async function testSessionsAPI() {
  try {
    // Test without filter
    console.log('Testing /sessions endpoint without filter...');
    const res1 = await axios.get(`${apiBaseUrl}/sessions`);
    console.log('Sessions count:', res1.data.length);
    if (res1.data.length > 0) {
      console.log('First session sample:', {
        id: res1.data[0].id,
        formationChoisie: res1.data[0].formationChoisie,
        finalRecommendation: res1.data[0].finalRecommendation,
        parcoursTitle: res1.data[0].parcoursTitle,
        isCompleted: res1.data[0].isCompleted
      });
    }
    
    // Test with stagiaireId filter (using a known ID from previous check)
    console.log('\nTesting /sessions?stagiaireId=1...');
    const res2 = await axios.get(`${apiBaseUrl}/sessions?stagiaireId=1`);
    console.log('Sessions count:', res2.data.length);
    if (res2.data.length > 0) {
      console.log('First session sample:', {
        id: res2.data[0].id,
        formationChoisie: res2.data[0].formationChoisie,
        finalRecommendation: res2.data[0].finalRecommendation,
        parcoursTitle: res2.data[0].parcoursTitle,
        isCompleted: res2.data[0].isCompleted
      });
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testSessionsAPI();
