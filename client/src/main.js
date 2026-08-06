/**
 * main.js — Arena GamersZone SPA Giriş Noktası
 *
 * Faz 1: Temel altyapı.
 * Şu an sadece ping testi ve console log'u gösterir.
 * Faz 4'te SPA router buraya entegre edilecek.
 */

import './css/main.css';
import { pingServer } from './js/api.js';

async function init() {
  console.log('🎮 Arena GamersZone başlatılıyor...');

  // Backend bağlantı testi
  const result = await pingServer();
  if (result) {
    console.log('✅ Backend bağlantısı başarılı:', result.message);
    document.getElementById('app').innerHTML = `
      <div class="ping-screen">
        <h1>🎮 Arena GamersZone</h1>
        <p class="status success">✅ Backend bağlantısı başarılı</p>
        <p class="detail">${result.message}</p>
        <p class="detail">Ortam: <strong>${result.env}</strong></p>
        <p class="detail">Zaman: ${new Date(result.timestamp).toLocaleString('tr-TR')}</p>
        <p class="note">Faz 1 tamamlandı. Geliştirme devam ediyor...</p>
      </div>
    `;
  } else {
    document.getElementById('app').innerHTML = `
      <div class="ping-screen">
        <h1>🎮 Arena GamersZone</h1>
        <p class="status error">❌ Backend bağlantısı kurulamadı</p>
        <p class="note">Server'ın çalıştığından emin ol: <code>cd server && npm run dev</code></p>
      </div>
    `;
  }
}

init();
