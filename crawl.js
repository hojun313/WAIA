const admin = require('firebase-admin');
const axios = require('axios');
const crypto = require('crypto');

// 1. Firebase Admin SDK 초기화
const serviceAccount = require('./waia-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 2. 메인 크롤링 함수
async function runCrawl() {
  console.log('크롤링을 시작합니다...');

  const servicesRef = db.collection('services');
  const snapshot = await servicesRef.get();

  if (snapshot.empty) {
    console.log('데이터베이스에 서비스가 없습니다.');
    return;
  }

  const crawlPromises = [];

  snapshot.forEach(doc => {
    const service = doc.data();
    const serviceId = doc.id;

    if (!service.policyUrl) {
      console.log(`[SKIP] ${service.name}: policyUrl이 없습니다.`);
      return; // 다음 서비스로 넘어감
    }

    console.log(`[CRAWL] ${service.name} (${service.policyUrl})`);

    const crawlPromise = axios.get(service.policyUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)' }
    })
      .then(response => {
        const html = response.data;
        const currentHash = crypto.createHash('sha256').update(html).digest('hex');

        if (service.lastHash && service.lastHash !== currentHash) {
          console.log(`  -> [!!] 변경 감지! 상태를 '주의 필요'로 업데이트합니다.`);
          return servicesRef.doc(serviceId).update({
            status: '주의 필요',
            lastHash: currentHash,
            lastUpdated: admin.firestore.FieldValue.serverTimestamp()
          });
        } else if (!service.lastHash || service.lastHash === currentHash) {
            console.log(`  -> [OK] 변경 없음. 해시값만 업데이트합니다.`);
            return servicesRef.doc(serviceId).update({
                lastHash: currentHash,
                // 변경이 없어도 마지막 확인 시각은 업데이트
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            });
        }
        
        return Promise.resolve();
      })
      .catch(error => {
        console.error(`  -> [ERROR] ${service.name} 크롤링 실패:`, error.message);
        return servicesRef.doc(serviceId).update({ status: '크롤링 실패' });
      });

    crawlPromises.push(crawlPromise);
  });

  await Promise.all(crawlPromises);
  console.log('\n크롤링 작업이 모두 완료되었습니다.');
}

// 3. 스크립트 실행
runCrawl();
