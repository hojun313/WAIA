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
  console.log("애플리케이션 인증 로직 시작");

  // DOM 요소 가져오기
  const loginForm = document.getElementById('login-form');
  const userInfo = document.getElementById('user-info');
  const userEmail = document.getElementById('user-email');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const signupBtn = document.getElementById('signup-btn');
  const loginBtn = document.getElementById('login-btn');
  const logoutBtn = document.getElementById('logout-btn');
  const serviceList = document.getElementById('service-list');

  // --- 함수 --- //

  // 서비스 목록 표시
  const displayServices = () => {
    serviceList.innerHTML = '<h2>전체 서비스 목록</h2>'; // 목록 초기화 및 헤더 추가
    db.collection('services').get()
      .then(querySnapshot => {
        if (querySnapshot.empty) {
          serviceList.innerHTML += '<p>등록된 서비스가 없습니다.</p>';
          return;
        }
        querySnapshot.forEach(doc => {
          const service = doc.data();
          const serviceId = doc.id;
          const item = document.createElement('div');
          item.className = 'service-item';
          
          const statusClass = service.status === '정상' ? 'ok' : 'warning';

          item.innerHTML = `
            <span class="name">${service.name}</span>
            <span class="status ${statusClass}">${service.status}</span>
            <button class="follow-btn" data-id="${serviceId}">팔로우</button>
          `;
          serviceList.appendChild(item);
        });
      })
      .catch(error => {
        console.error("서비스 목록 로딩 오류: ", error);
        serviceList.innerHTML += '<p>서비스 목록을 불러오는 데 실패했습니다.</p>';
      });
  };

  // --- 이벤트 리스너 --- //

  // 회원가입
  signupBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    if (!email || !password) {
      alert('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    auth.createUserWithEmailAndPassword(email, password)
      .then(userCredential => {
        console.log('회원가입 성공:', userCredential.user);
        alert('회원가입이 완료되었습니다. 자동으로 로그인됩니다.');
        emailInput.value = '';
        passwordInput.value = '';
      })
      .catch(error => {
        alert('회원가입 오류: ' + error.message);
      });
  });

  // 로그인
  loginBtn.addEventListener('click', () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    if (!email || !password) {
      alert('이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }
    auth.signInWithEmailAndPassword(email, password)
      .then(userCredential => {
        console.log('로그인 성공:', userCredential.user);
      })
      .catch(error => {
        alert('로그인 오류: ' + error.message);
      });
  });

  // 로그아웃
  logoutBtn.addEventListener('click', () => {
    auth.signOut().then(() => {
      console.log('로그아웃 성공');
    });
  });

  // --- 인증 상태 변경 감지 --- //
  auth.onAuthStateChanged(user => {
    if (user) {
      // 사용자가 로그인한 상태
      loginForm.classList.add('hidden');
      userInfo.classList.remove('hidden');
      userEmail.textContent = user.email;
      displayServices(); // 로그인 시 서비스 목록 표시
    } else {
      // 사용자가 로그아웃한 상태
      loginForm.classList.remove('hidden');
      userInfo.classList.add('hidden');
      userEmail.textContent = '';
      serviceList.innerHTML = ''; // 로그아웃 시 서비스 목록 제거
    }
  });
});
