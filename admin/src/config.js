import { getDatabase, ref, get } from 'firebase/database';
import app from './firebase';

let API_BASE_URL = null;
let settingsLoaded = false;
let settingsPromise = null;

export const loadApiBaseUrl = async () => {
  if (settingsLoaded && API_BASE_URL) {
    return API_BASE_URL;
  }

  if (settingsPromise) {
    return settingsPromise;
  }

  settingsPromise = new Promise(async (resolve, reject) => {
    try {
      const db = getDatabase(app);
      const settingsRef = ref(db, 'settings');

      const snapshot = await get(settingsRef);
      if (snapshot.exists()) {
        const settings = snapshot.val();
        const mobileBackendUrl = settings.backendUrl;
        if (mobileBackendUrl) {
          // Convert mobile app URL (e.g., https://api.example.com/api/) to base URL without /admin
          // The components will append /admin/... where needed
          API_BASE_URL = mobileBackendUrl.replace(/\/$/, ''); 
          console.log('Loaded API_BASE_URL from Firebase:', API_BASE_URL);
        } else {
          API_BASE_URL = 'http://127.0.0.1:8000/api'; // fallback to localhost
          console.log('No backendUrl in Firebase settings, using localhost fallback:', API_BASE_URL);
        }
      } else {
        // Fallback to localhost if no settings found
        API_BASE_URL = 'http://127.0.0.1:8000/api';
        console.log('No Firebase settings found, using localhost fallback:', API_BASE_URL);
      }

      settingsLoaded = true;
      resolve(API_BASE_URL);
    } catch (error) {
      console.error('Error loading API_BASE_URL from Firebase:', error);
      // Fallback to localhost on error
      API_BASE_URL = 'http://127.0.0.1:8000/api';
      settingsLoaded = true;
      resolve(API_BASE_URL);
    }
  });

  return settingsPromise;
};

export { API_BASE_URL }; 