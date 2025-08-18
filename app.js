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
  console.log("애플리케이션 로직 시작");

  // --- DOM 요소 --- //
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

  // 1. 전체 서비스 목록 표시
  const displayServices = async () => {
    serviceList.innerHTML = '<h2>전체 서비스 목록</h2>';
    try {
      const querySnapshot = await db.collection('services').get();
      if (querySnapshot.empty) {
        serviceList.innerHTML += '<p>등록된 서비스가 없습니다.</p>';
        return;
      }
      querySnapshot.forEach(doc => {
        const service = doc.data();
        const serviceId = doc.id;
        const isFollowing = currentUser.following.includes(serviceId);

        const item = document.createElement('div');
        item.className = 'service-item';
        const statusClass = service.status === '정상' ? 'ok' : 'warning';

        item.innerHTML = `
          <span class="name">${service.name}</span>
          <span class="status ${statusClass}">${service.status}</span>
          <button 
            class="${isFollowing ? 'unfollow-btn' : 'follow-btn'}" 
            data-id="${serviceId}">
            ${isFollowing ? '팔로잉' : '팔로우'}
          </button>
        `;
        serviceList.appendChild(item);
      });
    } catch (error) {
      console.error("서비스 목록 로딩 오류: ", error);
      serviceList.innerHTML += '<p>서비스 목록을 불러오는 데 실패했습니다.</p>';
    }
  };

  // 2. 팔로우/언팔로우 처리
  const handleFollow = async (e) => {
    if (!currentUser.loggedIn) return;

    const button = e.target;
    const serviceId = button.dataset.id;
    const isFollowing = button.classList.contains('unfollow-btn');
    const userRef = db.collection('users').doc(currentUser.uid);

    try {
      if (isFollowing) {
        await userRef.update({ following: firebase.firestore.FieldValue.arrayRemove(serviceId) });
        currentUser.following = currentUser.following.filter(id => id !== serviceId);
      } else {
        await userRef.set({ following: firebase.firestore.FieldValue.arrayUnion(serviceId) }, { merge: true });
        currentUser.following.push(serviceId);
      }
      displayServices();
      // TODO: 대시보드도 업데이트
    } catch (error) {
      console.error('팔로우/언팔로우 오류:', error);
      alert('작업에 실패했습니다.');
    }
  };

  // --- 이벤트 리스너 --- //

  signupBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    if (!email || !password) { alert('이메일과 비밀번호를 모두 입력해주세요.'); return; }
    auth.createUserWithEmailAndPassword(email, password)
      .then(cred => { 
        alert('회원가입이 완료되었습니다.'); 
        emailInput.value = ''; 
        passwordInput.value = ''; 
      })
      .catch(err => alert('회원가입 오류: ' + err.message));
  });

  loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    if (!email || !password) { alert('이메일과 비밀번호를 모두 입력해주세요.'); return; }
    auth.signInWithEmailAndPassword(email, password)
      .then(cred => {
        console.log("로그인 성공");
      })
      .catch(err => alert('로그인 오류: ' + err.message));
  });

  logoutBtn.addEventListener('click', () => auth.signOut());

  serviceList.addEventListener('click', (e) => {
    if (e.target.matches('.follow-btn') || e.target.matches('.unfollow-btn')) {
      handleFollow(e);
    }
  });

  // --- 인증 상태 변경 감지 --- //
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      currentUser.loggedIn = true;
      currentUser.uid = user.uid;

      const userRef = db.collection('users').doc(user.uid);
      const userDoc = await userRef.get();
      if (userDoc.exists) {
        currentUser.following = userDoc.data().following || [];
      } else {
        currentUser.following = [];
      }

      loginForm.classList.add('hidden');
      userInfo.classList.remove('hidden');
      userEmail.textContent = user.email;
      
      displayServices();
      // TODO: 대시보드 표시

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
