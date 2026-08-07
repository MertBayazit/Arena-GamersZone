import { apiCall } from '../api';
import { currentUser, getMe, logout } from '../auth';
import { getAvatarSVG } from '../ui/avatars';

export const dashboardScreen = {
  render: async (container) => {
    // 1. Get Me (refreshes profile information)
    await getMe();

    if (!currentUser) {
      window.location.hash = '#login';
      return;
    }

    // 2. Fetch User's Games (fall back to empty array if fail)
    let myGames = [];
    try {
      myGames = await apiCall('/games/mine');
    } catch (err) {
      console.log('Games fetch failed (Phase 7 CRUD not ready yet, using empty array)');
      myGames = []; // fallback during development
    }

    // 3. Fetch Game History (fall back to empty array if fail)
    let gameHistory = [];
    try {
      gameHistory = await apiCall('/games/history');
    } catch (err) {
      console.log('History fetch failed, using empty array');
      gameHistory = [];
    }

    // 4. Render Layout
    container.innerHTML = `
      <div class="container" style="padding-bottom: var(--spacing-lg);">
        <!-- Dashboard Header -->
        <header class="dashboard-header">
          <div style="font-family: var(--font-heading); font-size: 1.4rem; font-weight: 900; letter-spacing: 2px;">
            ARENA <span class="text-gradient">GAMERSZONE</span>
          </div>
          
          <div style="display: flex; align-items: center; gap: 15px;">
            <div id="header-profile-btn" class="dashboard-user-card">
              ${getAvatarSVG(currentUser.avatar?.value || 'avatar_01', 36)}
              <div class="dashboard-user-info" style="display: none; sm:block;">
                <h4>${currentUser.username}</h4>
                <span>Profilim</span>
              </div>
            </div>
            <button id="logout-btn" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.75rem;">ÇIKIŞ</button>
          </div>
        </header>

        <!-- Main Dashboard Content -->
        <div class="action-grid">
          <!-- Left: Lobiye Katıl -->
          <div class="glass-card" style="display: flex; flex-direction: column; justify-content: center;">
            <h2 style="font-family: var(--font-heading); font-size: 1.2rem; letter-spacing: 1px;">LOBİYE KATIL</h2>
            <p style="color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: var(--spacing-sm);">
              Arkadaşlarınızın oluşturduğu yarışma lobisine 6 haneli kodla katılın.
            </p>
            <div id="lobby-error" class="alert alert-error" style="display: none; margin-bottom: 10px; padding: 0.5rem 1rem;"></div>
            <div class="join-lobby-box">
              <input 
                type="text" 
                id="lobby-code-input" 
                class="form-input lobby-input" 
                placeholder="X7K2M9" 
                maxlength="6" 
              />
              <button id="join-lobby-btn" class="btn btn-primary">KATIL</button>
            </div>
          </div>

          <!-- Right: Hızlı Aksiyonlar -->
          <div class="glass-card" style="display: flex; flex-direction: column;">
            <h2 style="font-family: var(--font-heading); font-size: 1.2rem; letter-spacing: 1px; margin-bottom: var(--spacing-sm);">İŞLEMLER</h2>
            <div class="quick-links-container">
              <button class="quick-link-btn" onclick="window.location.hash='#editor'">
                <svg viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
                </svg>
                <span>YENİ OYUN</span>
              </button>
              <button class="quick-link-btn" onclick="window.location.hash='#public-library'">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
                <span>KÜTÜPHANE</span>
              </button>
            </div>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); margin-top: var(--spacing-lg); lg:grid-template-columns: 2fr 1fr;">
          <!-- Left Bottom: Benim Oyunlarım -->
          <div>
            <div class="games-section-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
              <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
                <h2 style="font-family: var(--font-heading); font-size: 1.2rem; letter-spacing: 1px; margin: 0;">🎮 OYUNLARIM</h2>
                <span style="font-size: 0.75rem; color: var(--color-text-muted); background: rgba(255,255,255,0.05); padding: 2px 6px; border-radius: var(--radius-sm);">${myGames.length}</span>
              </div>
              <button class="btn btn-secondary" onclick="window.location.hash='#public-library'" style="padding: 0.4rem 0.8rem; font-size: 0.7rem; display: flex; align-items: center; gap: 4px; border-color: var(--color-accent-purple); color: #ffffff;">
                📚 KÜTÜPHANEDEN ŞABLON AL
              </button>
            </div>

            <div id="games-container" class="games-grid ${myGames.length === 0 ? 'empty' : ''}">
              ${myGames.length === 0 
                ? `
                  <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="currentColor" style="opacity: 0.3;">
                      <path d="M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-10 7H8v3H6v-3H3v-2h3V8h2v3h3v2zm4.5 3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4-3c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                    </svg>
                    <p>Henüz kendi oyununuzu tasarlamadınız.</p>
                    <div style="display: flex; gap: var(--spacing-sm); margin-top: 10px;">
                      <button class="btn btn-secondary" onclick="window.location.hash='#editor'" style="padding: 0.5rem 1.0rem; font-size: 0.8rem;">
                        İLK OYUNUNU OLUŞTUR
                      </button>
                      <button class="btn btn-primary" onclick="window.location.hash='#public-library'" style="padding: 0.5rem 1.0rem; font-size: 0.8rem; background: var(--color-accent-purple); box-shadow: var(--shadow-neon-purple);">
                        ŞABLON KOPYALA 📚
                      </button>
                    </div>
                  </div>
                `
                : myGames.map(game => `
                  <div class="glass-card game-card">
                    <div>
                      <div style="display: flex; justify-content: space-between; align-items: start;">
                        <span class="game-card-badge ${game.status}">
                          ${game.status === 'published' ? 'Yayınlandı' : 'Taslak'}
                        </span>
                      </div>
                      <h3 class="game-card-title" title="${game.title}">${game.title}</h3>
                      <div class="game-card-meta">
                        <span>🧩 ${game.settings?.stageOrder?.length || 1} Etap</span>
                        <span>👤 ${game.settings?.playerFormat || '2v2'}</span>
                      </div>
                    </div>
                    <div class="game-card-actions">
                      <button class="btn btn-primary game-card-btn start-lobby-btn" data-game-id="${game._id}">LOBİ AÇ</button>
                      <button class="btn btn-secondary game-card-btn edit-game-btn" data-game-id="${game._id}">DÜZENLE</button>
                      <button class="btn btn-danger game-card-btn delete-game-btn" data-game-id="${game._id}" style="max-width: 40px; padding: 0;">🗑️</button>
                    </div>
                  </div>
                `).join('')
              }
            </div>
          </div>

          <!-- Right Bottom: Son Oyun Geçmişi -->
          <div>
            <h2 style="font-family: var(--font-heading); font-size: 1.2rem; letter-spacing: 1px; margin-bottom: var(--spacing-md);">📜 GEÇMİŞ</h2>
            
            <div class="history-list">
              ${gameHistory.length === 0
                ? `
                  <div class="empty-state" style="padding: var(--spacing-md);">
                    <p style="font-size: 0.85rem;">Henüz tamamlanmış oyun bulunmuyor.</p>
                  </div>
                `
                : gameHistory.map(item => `
                  <div class="history-item">
                    <div class="history-item-meta">
                      <span class="history-item-game">${item.gameId?.title || 'Bilinmeyen Oyun'}</span>
                      <span class="history-item-date">${new Date(item.playedAt).toLocaleDateString('tr-TR')}</span>
                    </div>
                    <span class="history-item-result ${item.result?.winner === item.players.find(p => p.userId === currentUser._id)?.team ? 'win' : 'loss'}">
                      ${item.result?.winner === item.players.find(p => p.userId === currentUser._id)?.team ? 'Kazanıldı' : 'Kaybedildi'}
                    </span>
                  </div>
                `).join('')
              }
            </div>
          </div>
        </div>
      </div>
    `;

    // 5. Setup Event Listeners
    const headerProfileBtn = document.getElementById('header-profile-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const joinLobbyBtn = document.getElementById('join-lobby-btn');
    const lobbyCodeInput = document.getElementById('lobby-code-input');
    const lobbyError = document.getElementById('lobby-error');

    headerProfileBtn.addEventListener('click', () => {
      window.location.hash = '#profile';
    });

    logoutBtn.addEventListener('click', () => {
      logout();
    });

    // Handle Join Lobby
    const handleJoinLobby = () => {
      const code = lobbyCodeInput.value.trim().toUpperCase();
      lobbyError.style.display = 'none';

      if (code.length !== 6) {
        lobbyError.innerText = 'Lobi kodu 6 haneli olmalıdır!';
        lobbyError.style.display = 'flex';
        return;
      }

      // Navigate to lobby screen with the code in parameters
      window.location.hash = `#lobby?code=${code}`;
    };

    joinLobbyBtn.addEventListener('click', handleJoinLobby);
    
    // Allow pressing Enter in lobby code input
    lobbyCodeInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleJoinLobby();
    });

    // Handle Game Card Buttons (Edit, Delete, Start Lobby)
    const editBtns = document.querySelectorAll('.edit-game-btn');
    const deleteBtns = document.querySelectorAll('.delete-game-btn');
    const startLobbyBtns = document.querySelectorAll('.start-lobby-btn');

    editBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const gameId = btn.dataset.gameId;
        window.location.hash = `#editor?id=${gameId}`;
      });
    });

    deleteBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const gameId = btn.dataset.gameId;
        if (!confirm('Bu oyunu tamamen silmek istediğinize emin misiniz?')) return;
        
        try {
          await apiCall(`/games/${gameId}`, 'DELETE');
          // Re-render dashboard to refresh list
          dashboardScreen.render(container);
        } catch (err) {
          alert(err.message || 'Oyun silinemedi.');
        }
      });
    });

    startLobbyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const gameId = btn.dataset.gameId;
        // Redirect to lobby action host
        window.location.hash = `#lobby?gameId=${gameId}&action=host`;
      });
    });
  },
  destroy: () => {
    console.log('Dashboard Screen destroyed');
  }
};

export default dashboardScreen;
