import config from '../../../../../config/config';
import handleResponse from '../../../utils/handleResponse.js';

export default async function liveUpdate() {
  try {
    // Calculate response time for the first request
    const start = performance.now();
    
    // Fetch initial data
    const response = await fetch(`${config.baseURL}/api/dashboard/live`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    // Measure the time it took to get the response
    const end = performance.now();
    const rawResponseTime = end - start;
    const responseTime = Math.max(0, rawResponseTime - 1000);  // Clamp to zero


    // Handle the initial response
    const data = await handleResponse(response, false);

    // Append the calculated response time to the data object
    data["performanceMetrics"]["responseTime"] = responseTime;

    return data;

  } catch (error) {
    console.error('Error during live update:', error);
    return false;
  }
}
