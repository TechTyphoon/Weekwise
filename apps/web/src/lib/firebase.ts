import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-api-key',
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
	appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef',
};

let app: FirebaseApp;
let db: Firestore;

if (!getApps().length) {
	app = initializeApp(firebaseConfig);
	db = getFirestore(app);
} else {
	app = getApps()[0];
	db = getFirestore(app);
}

export { app, db };
