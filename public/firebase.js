import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const app = initializeApp({
    apiKey: "AIzaSyAoAl-09tw3K0i8N2PnYKAjjZb19e4zEBk",
    appId: "1:6198929588:web:3e2650dacec00b1bf90fe1",
    authDomain: "wixonic-website-2.firebaseapp.com",
    databaseURL: "https://wixonic-website-2-default-rtdb.europe-west1.firebasedatabase.app",
    measurementId: "G-H9LVZLMXEW",
    messagingSenderId: "6198929588",
    projectId: "wixonic-website-2",
    storageBucket: "wixonic-website-2.appspot.com"
});

const appAuth = getAuth(app);

const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider("6Ldo4HgpAAAAAOQS51hI3MrKMUUK6WFh8oEPGXIp"),
    isTokenAutoRefreshEnabled: true
});

const appAnalytics = getAnalytics(app);

const appFirestore = getFirestore(app);

const appStorage = getStorage(app);

const init = async () => {
    
};

export default {
    app,
    appAnalytics,
    appAuth,
    appCheck,
    appFirestore,
    init
};