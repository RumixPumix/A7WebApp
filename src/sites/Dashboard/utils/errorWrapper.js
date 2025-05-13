// utils/errorWrapper.js
import { ExpectedIssue } from './expectedIssue.js';
import notification from '../../ModularComponents/notification.jsx';

export default async function errorWrapper(asyncFn) {
  try {
    return await asyncFn();
  } catch (error) {
    if (error instanceof ExpectedIssue) {
        console.log(error.message);
        notification(error.message, 'error');
    } else {
      notification('An unexpected error occurred. Check console for details.', 'error');
      console.error(error);
    }
    return false;
  }
}
