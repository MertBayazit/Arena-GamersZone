/**
 * api.js — Backend REST API çağrıları için yardımcı modül.
 *
 * Faz 1: Sadece ping fonksiyonu.
 * Faz 3-7'de auth, oyun CRUD, upload fonksiyonları eklenecek.
 */

const BASE_URL = '/api';

/**
 * Backend bağlantısını test eder.
 * @returns {Object|null} Sunucu yanıtı veya null (hata durumunda)
 */
export async function pingServer() {
  try {
    const response = await fetch(`${BASE_URL}/ping`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('❌ Ping başarısız:', err.message);
    return null;
  }
}
