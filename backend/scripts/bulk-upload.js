const axios = require('axios');
const fs = require('fs');

// Configuration
const API_URL = 'https://your-backend.railway.app';
const JWT_TOKEN = 'your-admin-jwt-token';

// List of videos to upload
const videos = [
  {
    title: 'React Tutorial 1',
    description: 'Introduction to React',
    category: 'Tutorial',
    requiredPlan: 'basic',
    videoUrl: 'https://storage.com/react-1.mp4'
  },
  {
    title: 'React Tutorial 2',
    description: 'React Components',
    category: 'Tutorial',
    requiredPlan: 'basic',
    videoUrl: 'https://storage.com/react-2.mp4'
  },
  // Add more videos...
];

// Upload function
async function uploadVideo(videoData) {
  try {
    const response = await axios.post(
      `${API_URL}/api/videos/upload`,
      videoData,
      {
        headers: {
          'Authorization': `Bearer ${JWT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log(`✓ Uploaded: ${videoData.title}`);
    console.log(`  ID: ${response.data.data.id}`);
    console.log(`  Status: ${response.data.data.status}\n`);
    
    return response.data.data;
  } catch (error) {
    console.error(`✗ Failed: ${videoData.title}`);
    console.error(`  Error: ${error.response?.data?.message || error.message}\n`);
    return null;
  }
}

// Main function
async function bulkUpload() {
  console.log(`Starting bulk upload of ${videos.length} videos...\n`);
  
  const results = [];
  
  for (const video of videos) {
    const result = await uploadVideo(video);
    results.push(result);
    
    // Wait 2 seconds between uploads to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Summary
  const successful = results.filter(r => r !== null).length;
  const failed = results.length - successful;
  
  console.log('\n=== Upload Summary ===');
  console.log(`Total: ${videos.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
}

// Run
bulkUpload().catch(console.error);