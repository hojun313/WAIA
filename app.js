// 1. Firebase 구성
// Firebase 구성: waia-f673e
const firebaseConfig = {
    apiKey: "AIzaSyAjuoWxPU3ApBKP84xbwrCHqxt14bQCxSw",
    authDomain: "waia-f673e.firebaseapp.com",
    projectId: "waia-f673e",
    storageBucket: "waia-f673e.firebasestorage.app",
    messagingSenderId: "464745695584",
    appId: "1:464745695584:web:e8081effc2828da9cf7605"
  };

// 2. Firebase 초기화
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 3. 앱 로직
document.addEventListener('DOMContentLoaded', () => {
  console.log("애플리케이션이 시작되었습니다.");
  // TODO: 여기에 앱의 주요 로직을 추가합니다.
});
