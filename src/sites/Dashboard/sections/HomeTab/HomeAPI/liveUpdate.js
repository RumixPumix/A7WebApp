import config from '../../../../../config/config';
import handleResponse from '../../../utils/handleResponse.js';
import errorWrapper from '../../../utils/errorWrapper.js';

export default async function liveUpdate() {
  return errorWrapper(async () => {
    const start = performance.now();
    
    const response = await fetch(`${config.baseURL}/api/dashboard/live`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`
      }
    });

    const end = performance.now();
    const rawResponseTime = end - start;
    const responseTime = Math.max(0, rawResponseTime - 1000);


    const data = await handleResponse(response, false);

    data["performanceMetrics"]["responseTime"] = responseTime;

    return data;

  });
}
