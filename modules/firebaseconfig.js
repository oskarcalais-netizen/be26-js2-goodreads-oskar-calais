import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyDrPgW6TMEh-MZQMCe2PM4Q0UnMpYyMMSI",
  authDomain: "be26-firebase.firebaseapp.com",
  databaseURL: "https://be26-firebase-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "be26-firebase",
  storageBucket: "be26-firebase.firebasestorage.app",
  messagingSenderId: "748942362710",
  appId: "1:748942362710:web:42a7144129f429c174d3f7"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
