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
  // ... (The existing app logic) ...
  // --- DOM 요소 ---
  const loginForm = document.getElementById('login-form');
  const userInfo = document.getElementById('user-info');
  const userEmail = document.getElementById('user-email');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const signupBtn = document.getElementById('signup-btn');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const serviceList = document.getElementById('service-list');
  const dashboard = document.getElementById('dashboard');

  // --- 앱 상태 --- //
  let currentUser = {
    loggedIn: false,
    uid: null,
    following: []
  };

  // --- 함수 --- //

  const displayDashboard = async () => {
    dashboard.innerHTML = '<h2>내 대시보드</h2>';
    if (currentUser.following.length === 0) {
      dashboard.innerHTML += '<p>팔로우하는 서비스가 없습니다.</p>';
      return;
    }
    const servicePromises = currentUser.following.map(id => db.collection('services').doc(id).get());
    const serviceDocs = await Promise.all(servicePromises);
    serviceDocs.forEach(doc => {
      if (doc.exists) {
        const service = doc.data();
        const item = document.createElement('div');
        item.className = 'service-item';
        const statusClass = service.status === '정상' ? 'ok' : 'warning';
        item.innerHTML = `<span class="name">${service.name}</span><span class="status ${statusClass}">${service.status}</span>`;
        dashboard.appendChild(item);
      }
    });
  };

  const displayServices = async () => {
    serviceList.innerHTML = '<h2>전체 서비스 목록</h2>';
    const querySnapshot = await db.collection('services').orderBy('name').get();
    querySnapshot.forEach(doc => {
      const service = doc.data();
      const serviceId = doc.id;
      const isFollowing = currentUser.following.includes(serviceId);
      const item = document.createElement('div');
      item.className = `service-item ${isFollowing ? 'is-followed' : 'not-followed'}`;
      item.dataset.id = serviceId;
      item.innerHTML = `
        <span class="name">${service.name}</span>
        <span class="follower-count">${service.followerCount || 0}명 팔로우</span>
      `;
      serviceList.appendChild(item);
    });
  };

  const handleFollow = async (serviceId, isFollowing) => {
    if (!currentUser.loggedIn) return;

    const userRef = db.collection('users').doc(currentUser.uid);
    const serviceRef = db.collection('services').doc(serviceId);
    const increment = firebase.firestore.FieldValue.increment(isFollowing ? -1 : 1);

    try {
      // 트랜잭션을 사용하여 사용자 데이터와 서비스 데이터를 함께 업데이트
      await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists && !isFollowing) {
            transaction.set(userRef, { following: [serviceId] });
        } else {
            transaction.update(userRef, {
                following: isFollowing 
                    ? firebase.firestore.FieldValue.arrayRemove(serviceId)
                    : firebase.firestore.FieldValue.arrayUnion(serviceId)
            });
        }
        transaction.update(serviceRef, { followerCount: increment });
      });

      // 로컬 상태 업데이트
      if (isFollowing) {
        currentUser.following = currentUser.following.filter(id => id !== serviceId);
      } else {
        currentUser.following.push(serviceId);
      }

      // UI 새로고침
      await displayDashboard();
      await displayServices();

    } catch (error) {
      console.error('Follow/Unfollow Transaction Error:', error);
    }
  };

  // --- 이벤트 리스너 --- //

  signupBtn.addEventListener('click', () => {
    const email = emailInput.value, password = passwordInput.value;
    if (!email || !password) return alert('이메일과 비밀번호를 입력하세요.');
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => { 
        alert('회원가입 성공!'); 
        emailInput.value = ''; 
        passwordInput.value = ''; 
      })
      .catch(err => alert('회원가입 오류: ' + err.message));
  });

  loginBtn.addEventListener('click', () => {
    const email = emailInput.value, password = passwordInput.value;
    if (!email || !password) return alert('이메일과 비밀번호를 입력하세요.');
    auth.signInWithEmailAndPassword(email, password)
      .then(() => { 
        console.log('로그인 성공'); 
      })
      .catch(err => alert('로그인 오류: ' + err.message));
  });

  logoutBtn.addEventListener('click', () => auth.signOut());

  serviceList.addEventListener('click', (e) => {
    const targetItem = e.target.closest('.service-item');
    if (targetItem) {
      handleFollow(targetItem.dataset.id, targetItem.classList.contains('is-followed'));
    }
  });

  // --- 인증 상태 변경 감지 --- //
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser.loggedIn = true;
      currentUser.uid = user.uid;
      const userRef = db.collection('users').doc(user.uid);
      const userDoc = await userRef.get();
      currentUser.following = userDoc.exists ? userDoc.data().following || [] : [];

      loginForm.classList.add('hidden');
      userInfo.classList.remove('hidden');
      userEmail.textContent = user.email;
      
      await displayDashboard();
      await displayServices();
    } else {
      currentUser = { loggedIn: false, uid: null, following: [] };
      loginForm.classList.remove('hidden');
      userInfo.classList.add('hidden');
      userEmail.textContent = '';
      serviceList.innerHTML = '';
      dashboard.innerHTML = '';
    }
  });
});

// --- Helper Functions (for admin use in console) ---

/**
 * Adds multiple services to Firestore in a batch.
 * HOW TO USE:
 * 1. Modify the 'servicesToAdd' array below.
 * 2. Open the browser developer console (F12).
 * 3. Type addServicesBatch() and press Enter.
 */
async function addServicesBatch() {
  const servicesToAdd = [
    { name: 'Kakao', status: '확인전', followerCount: 0 },
    { name: 'Toss', status: '확인전', followerCount: 0 },
    { name: 'Coupang', status: '확인전', followerCount: 0 },
    { name: 'Baemin', status: '확인전', followerCount: 0 },
    { name: 'Instagram', status: '확인전', followerCount: 0 },
    { name: 'Twitter', status: '확인전', followerCount: 0 },
    { name: 'Netflix', status: '확인전', followerCount: 0 },
    { name: 'Disney+', status: '확인전', followerCount: 0 },
    { name: 'Apple TV+', status: '확인전', followerCount: 0 },
    { name: 'Hulu', status: '확인전', followerCount: 0 },
    { name: 'Amazon Prime Video', status: '확인전', followerCount: 0 },
    { name: 'YouTube', status: '확인전', followerCount: 0 }
  ];

  console.log(`Starting to add ${servicesToAdd.length} services...`);
  let addedCount = 0;
  let skippedCount = 0;

  for (const service of servicesToAdd) {
    try {
      const querySnapshot = await db.collection('services').where('name', '==', service.name).get();
      if (querySnapshot.empty) {
        await db.collection('services').add(service);
        console.log(`Successfully added: ${service.name}`);
        addedCount++;
      } else {
        console.log(`Skipped (already exists): ${service.name}`);
        skippedCount++;
      }
    } catch (error) {
      console.error(`Failed to add ${service.name}:`, error);
    }
  }

  console.log(`Batch process finished. Added: ${addedCount}, Skipped: ${skippedCount}.`);
  console.log("Please refresh the page to see the new services.");
}

/**
 * Initializes or resets the followerCount for all services to 0.
 * HOW TO USE:
 * 1. Open the browser developer console (F12).
 * 2. Type initializeFollowerCounts() and press Enter.
 */
async function initializeFollowerCounts() {
  console.log("Starting to initialize follower counts for all services to 0...");
  const batch = db.batch();
  const querySnapshot = await db.collection('services').get();
  
  querySnapshot.forEach(doc => {
    batch.update(doc.ref, { followerCount: 0 });
  });

  try {
    await batch.commit();
    console.log(`Successfully initialized follower counts for ${querySnapshot.size} services.`);
    console.log("Please refresh the page to see the changes.");
  } catch (error) {
    console.error("Error initializing follower counts:", error);
  }
}