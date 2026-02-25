// Test script for recommendation engine
const recommendationEngine = require('./api/recommendation-engine');

async function testRecommendationEngine() {
  try {
    console.log('Testing recommendation engine...');

    // Test basic functionality
    const recommendations = await recommendationEngine.getRecommendations(1, 5);
    console.log('✓ getRecommendations works');
    console.log('Sample recommendations:', recommendations.slice(0, 2));

    // Test interaction tracking
    await recommendationEngine.trackInteraction(1, 1, 'view', { test: true });
    console.log('✓ trackInteraction works');

    console.log('✅ All recommendation engine tests passed!');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testRecommendationEngine();