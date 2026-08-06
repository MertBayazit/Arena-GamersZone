import { apiCall } from '../api';
import { currentUser } from '../auth';
import { getAvatarSVG } from '../ui/avatars';
import { connectSocket, disconnectSocket } from '../socket';

export const lobbyScreen = {
  render: async (container, queryParams) => {
    if (!currentUser) {
      window.location.hash = '#login';
      return;
    }

    const socket = connectSocket();
    let currentLobby = null;
    let isHost = queryParams.action === 'host';
    const lobbyCodeParam = queryParams.code;

    // Helper to get active user role/state in lobby
    const getSelfPlayerObj = () => {
      if (!currentLobby) return null;
      return currentLobby.players.find(p => p.userId === currentUser._id);
    };

    // Render structure
    container.innerHTML = `
      <div class="container" style="padding-top: var(--spacing-lg); padding-bottom: var(--spacing-lg);">
        <!-- Top Lobby Info Header -->
        <div class="glass-card" style="padding: var(--spacing-md); border: 1px solid var(--color-border); margin-bottom: var(--spacing-lg); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 15px;">
          <div>
            <div style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px;">OYUN ODASI</div>
            <h2 id="lobby-game-title" style="font-family: var(--font-heading); font-size: 1.4rem; color: #ffffff; text-transform: uppercase; margin-top: 3px;">
              Bağlantı kuruluyor...
            </h2>
            <div id="lobby-format-badge" class="game-card-badge published" style="margin-top: 5px; display: none;">2v2 FORMATI</div>
          </div>

          <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
            <div style="font-size: 0.7rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px;">LOBİ KODU</div>
            <div id="lobby-code-box" style="display: flex; align-items: center; gap: 8px; cursor: pointer; background: rgba(0,240,255,0.05); border: 1px dashed var(--color-accent-blue); padding: 8px 12px; border-radius: var(--radius-md); margin-top: 4px;" title="Kopyalamak için tıklayın">
              <span id="lobby-code-text" style="font-family: var(--font-heading); font-weight: 700; font-size: 1.3rem; color: var(--color-accent-blue); letter-spacing: 1px;">------</span>
              <span style="font-size: 0.9rem;">📋</span>
            </div>
            <div id="copy-toast" style="font-size: 0.7rem; color: var(--color-success); margin-top: 4px; display: none;">Kod kopyalandı! ✅</div>
          </div>
        </div>

        <!-- Alert notifications -->
        <div id="lobby-alert" class="alert alert-error" style="display: none; padding: 0.5rem 1rem; margin-bottom: 20px;"></div>

        <!-- Teams Grid Split screen -->
        <div style="display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg); md:grid-template-columns: 1fr 1fr;">
          
          <!-- Mavi Takım (Team A) -->
          <div class="glass-card" style="border: 1px solid rgba(0, 180, 255, 0.2); background: rgba(0, 180, 255, 0.01);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(0, 180, 255, 0.2); padding-bottom: var(--spacing-sm); margin-bottom: var(--spacing-md);">
              <h3 style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--color-accent-blue); letter-spacing: 1px;">🔵 MAVİ TAKIM</h3>
              <button id="join-team-a-btn" class="btn btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.7rem; display: none;">KATIL</button>
            </div>

            <div id="team-a-players" style="display: flex; flex-direction: column; gap: 10px; min-height: 120px;">
              <!-- Render players dynamically -->
            </div>
          </div>

          <!-- Kırmızı Takım (Team B) -->
          <div class="glass-card" style="border: 1px solid rgba(255, 51, 102, 0.2); background: rgba(255, 51, 102, 0.01);">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255, 51, 102, 0.2); padding-bottom: var(--spacing-sm); margin-bottom: var(--spacing-md);">
              <h3 style="font-family: var(--font-heading); font-size: 1.1rem; color: var(--color-error); letter-spacing: 1px;">🔴 KIRMIZI TAKIM</h3>
              <button id="join-team-b-btn" class="btn btn-secondary" style="padding: 0.35rem 0.8rem; font-size: 0.7rem; display: none;">KATIL</button>
            </div>

            <div id="team-b-players" style="display: flex; flex-direction: column; gap: 10px; min-height: 120px;">
              <!-- Render players dynamically -->
            </div>
          </div>

        </div>

        <!-- Control Actions Area -->
        <div class="glass-card" style="border: 1px solid var(--color-border); padding: var(--spacing-md); text-align: center; display: flex; flex-direction: column; align-items: center; gap: var(--spacing-sm);">
          <div id="lobby-state-text" style="font-size: 0.85rem; color: var(--color-text-muted);">
            Yarışmacıların takımlara yerleşmesi ve hazır duruma geçmesi bekleniyor...
          </div>
          
          <div style="display: flex; gap: var(--spacing-md); margin-top: 5px;">
            <!-- Start Game Button (Host only) -->
            <button id="host-start-btn" class="btn btn-primary" style="display: none; padding: 0.8rem 2rem; font-size: 0.9rem; box-shadow: var(--shadow-neon-blue);">
              OYUNU BAŞLAT 🚀
            </button>
            
            <!-- Ready Toggle Button (Player only) -->
            <button id="player-ready-btn" class="btn btn-secondary" style="display: none; padding: 0.8rem 2rem; font-size: 0.9rem;">
              HAZIR DEĞİLİM ❌
            </button>
            
            <button class="btn btn-secondary" id="leave-lobby-btn" style="padding: 0.8rem 1.5rem; font-size: 0.9rem;">
              LOBİDEN AYRIL
            </button>
          </div>
        </div>

      </div>
    `;

    // DOM Elements
    const gameTitleEl = document.getElementById('lobby-game-title');
    const formatBadgeEl = document.getElementById('lobby-format-badge');
    const codeBoxEl = document.getElementById('lobby-code-box');
    const codeTextEl = document.getElementById('lobby-code-text');
    const copyToastEl = document.getElementById('copy-toast');
    const alertEl = document.getElementById('lobby-alert');
    const teamAPlayersEl = document.getElementById('team-a-players');
    const teamBPlayersEl = document.getElementById('team-b-players');
    const joinTeamABtn = document.getElementById('join-team-a-btn');
    const joinTeamBBtn = document.getElementById('join-team-b-btn');
    const stateTextEl = document.getElementById('lobby-state-text');
    const hostStartBtn = document.getElementById('host-start-btn');
    const playerReadyBtn = document.getElementById('player-ready-btn');
    const leaveLobbyBtn = document.getElementById('leave-lobby-btn');

    // Click to copy lobby code helper
    codeBoxEl.addEventListener('click', () => {
      if (!currentLobby) return;
      navigator.clipboard.writeText(currentLobby.lobbyCode).then(() => {
        copyToastEl.style.display = 'block';
        setTimeout(() => copyToastEl.style.display = 'none', 2000);
      });
    });

    // Leave lobby binding
    leaveLobbyBtn.addEventListener('click', () => {
      window.location.hash = '#dashboard';
    });

    // Join Team A (Blue) binding
    joinTeamABtn.addEventListener('click', () => {
      if (!currentLobby) return;
      socket.emit('player:select-team', { lobbyCode: currentLobby.lobbyCode, team: 'A' });
    });

    // Join Team B (Red) binding
    joinTeamBBtn.addEventListener('click', () => {
      if (!currentLobby) return;
      socket.emit('player:select-team', { lobbyCode: currentLobby.lobbyCode, team: 'B' });
    });

    // Ready Toggle binding
    playerReadyBtn.addEventListener('click', () => {
      const self = getSelfPlayerObj();
      if (!self) return;
      socket.emit('player:ready', { lobbyCode: currentLobby.lobbyCode, isReady: !self.isReady });
    });

    // Host Start Game binding
    hostStartBtn.addEventListener('click', () => {
      socket.emit('host:start-game', { lobbyCode: currentLobby.lobbyCode });
    });

    // Render Room Members
    const drawLobbyState = () => {
      if (!currentLobby) return;

      // Title & badges
      gameTitleEl.innerText = currentLobby.gameTitle;
      formatBadgeEl.innerText = `${currentLobby.settings.playerFormat} FORMATI`;
      formatBadgeEl.style.display = 'inline-block';
      codeTextEl.innerText = currentLobby.lobbyCode;

      // Group players by teams
      const teamAPlayers = currentLobby.players.filter(p => p.team === 'A');
      const teamBPlayers = currentLobby.players.filter(p => p.team === 'B');

      // Draw Team A
      teamAPlayersEl.innerHTML = '';
      if (teamAPlayers.length === 0) {
        teamAPlayersEl.innerHTML = `
          <div style="font-size: 0.75rem; color: var(--color-text-muted); text-align: center; padding: 20px; border: 1px dashed rgba(0, 180, 255, 0.2); border-radius: var(--radius-sm); margin: auto;">
            Mavi takımda oyuncu yok
          </div>
        `;
      } else {
        teamAPlayers.forEach(player => {
          teamAPlayersEl.appendChild(createPlayerRow(player));
        });
      }

      // Draw Team B
      teamBPlayersEl.innerHTML = '';
      if (teamBPlayers.length === 0) {
        teamBPlayersEl.innerHTML = `
          <div style="font-size: 0.75rem; color: var(--color-text-muted); text-align: center; padding: 20px; border: 1px dashed rgba(255, 51, 102, 0.2); border-radius: var(--radius-sm); margin: auto;">
            Kırmızı takımda oyuncu yok
          </div>
        `;
      } else {
        teamBPlayers.forEach(player => {
          teamBPlayersEl.appendChild(createPlayerRow(player));
        });
      }

      // Adjust Action Buttons depending on role (Host vs Contestant)
      const self = getSelfPlayerObj();
      
      if (isHost) {
        // Host view
        hostStartBtn.style.display = 'inline-block';
        playerReadyBtn.style.display = 'none';
        joinTeamABtn.style.display = 'none';
        joinTeamBBtn.style.display = 'none';

        const required = currentLobby.settings.playerFormat === '1v1' ? 2 : 4;
        const totalJoined = currentLobby.players.length;
        const readyCount = currentLobby.players.filter(p => p.isReady).length;

        if (totalJoined < required) {
          stateTextEl.innerText = `⚠️ Oyuna başlamak için yeterli sayıda yarışmacı yok. (${totalJoined}/${required} oyuncu katıldı)`;
          hostStartBtn.disabled = true;
        } else if (readyCount < totalJoined) {
          stateTextEl.innerText = `⏳ Bazı yarışmacıların hazır duruma geçmesi bekleniyor (${readyCount}/${totalJoined} hazır).`;
          hostStartBtn.disabled = true;
        } else {
          stateTextEl.innerText = `🚀 Tüm oyuncular hazır! Oyunu başlatabilirsiniz.`;
          hostStartBtn.disabled = false;
        }
      } else if (self) {
        // Player view
        hostStartBtn.style.display = 'none';
        playerReadyBtn.style.display = 'inline-block';

        // Join Team buttons visibility
        const maxPerTeam = currentLobby.settings.playerFormat === '1v1' ? 1 : 2;
        joinTeamABtn.style.display = self.team !== 'A' && teamAPlayers.length < maxPerTeam ? 'inline-block' : 'none';
        joinTeamBBtn.style.display = self.team !== 'B' && teamBPlayers.length < maxPerTeam ? 'inline-block' : 'none';

        if (self.isReady) {
          playerReadyBtn.innerText = 'HAZIR DEĞİLİM ❌';
          playerReadyBtn.className = 'btn btn-secondary';
          stateTextEl.innerText = `👍 Hazır durumdasınız. Kurucunun oyunu başlatması bekleniyor...`;
        } else {
          playerReadyBtn.innerText = 'HAZIRIM 👍';
          playerReadyBtn.className = 'btn btn-primary';
          playerReadyBtn.style.boxShadow = 'var(--shadow-neon-blue)';
          stateTextEl.innerText = `⏳ Lütfen hazır durumuna geçin.`;
        }
      }
    };

    // Helper row drawer
    const createPlayerRow = (player) => {
      const row = document.createElement('div');
      row.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 10px 12px; background: rgba(255,255,255,0.02); border: 1px solid var(--color-border); border-radius: var(--radius-md);';
      
      const isSelf = player.userId === currentUser._id;
      
      row.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
          ${getAvatarSVG(player.avatar?.value || 'avatar_01', 32)}
          <div>
            <strong style="font-size: 0.85rem; color: #ffffff;">${player.username} ${isSelf ? '<span style="color: var(--color-accent-blue); font-size: 0.7rem;">(Sen)</span>' : ''}</strong>
          </div>
        </div>
        <div>
          ${player.isReady 
            ? `<span class="game-card-badge published" style="font-size: 0.65rem; background: var(--color-success); border-color: var(--color-success); color:#060919;">HAZIR</span>`
            : `<span class="game-card-badge draft" style="font-size: 0.65rem;">BEKLENİYOR</span>`
          }
        </div>
      `;
      return row;
    };

    // Setup Socket Listeners
    socket.on('connect', () => {
      console.log('🔌 Connected to Socket.io server');
      if (isHost) {
        socket.emit('host:create', { gameId: queryParams.gameId, user: currentUser });
      } else {
        socket.emit('player:join', { lobbyCode: lobbyCodeParam, user: currentUser });
      }
    });

    socket.on('host:created', (lobby) => {
      currentLobby = lobby;
      drawLobbyState();
    });

    socket.on('player:joined', (lobby) => {
      currentLobby = lobby;
      drawLobbyState();
    });

    socket.on('lobby:updated', (lobby) => {
      currentLobby = lobby;
      drawLobbyState();
    });

    socket.on('lobby:destroyed', (data) => {
      alert(data.message || 'Lobi odası dağıtıldı.');
      window.location.hash = '#dashboard';
    });

    socket.on('game:started', (lobby) => {
      // Navigate to Game Room screen (Phase 12)
      window.location.hash = `#game?code=${lobby.lobbyCode}`;
    });

    socket.on('error', (err) => {
      alert(err.message || 'Bir soket hatası oluştu.');
      window.location.hash = '#dashboard';
    });

    // Manually trigger connect if not connected
    if (!socket.connected) {
      socket.connect();
    } else {
      // Re-trigger action if already connected (fallback edge case)
      if (isHost) {
        socket.emit('host:create', { gameId: queryParams.gameId, user: currentUser });
      } else {
        socket.emit('player:join', { lobbyCode: lobbyCodeParam, user: currentUser });
      }
    }
  },

  destroy: () => {
    console.log('Lobby Screen destroyed');
    
    // Clean up socket event listeners to prevent duplicate triggers
    const socket = connectSocket();
    socket.off('connect');
    socket.off('host:created');
    socket.off('player:joined');
    socket.off('lobby:updated');
    socket.off('lobby:destroyed');
    socket.off('game:started');
    socket.off('error');
    
    // Disconnect connection
    disconnectSocket();
  }
};

export default lobbyScreen;
