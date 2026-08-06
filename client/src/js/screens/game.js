import { currentUser } from '../auth';
import { getAvatarSVG } from '../ui/avatars';
import { connectSocket, disconnectSocket } from '../socket';

const stageNames = {
  multipleChoice: { name: 'Çoktan Seçmeli', icon: '🧠' },
  imageGuess: { name: 'Görsel Tahmin', icon: '🖼️' },
  soundGuess: { name: 'Ses Tahmin', icon: '🎵' },
  sayismaca: { name: 'Sayışmaca', icon: '🎯' },
  wordPuzzle: { name: 'Kelime Bulmaca', icon: '🧩' },
  mapGuess: { name: 'Harita Tahmin', icon: '🗺️' },
  finalDuel: { name: 'Final Düellosu', icon: '🏆' }
};

export const gameScreen = {
  render: async (container, queryParams) => {
    if (!currentUser) {
      window.location.hash = '#login';
      return;
    }

    const socket = connectSocket();
    const lobbyCode = queryParams.code;
    let lobby = null;
    let isHost = false;
    let isBuzzedByMe = false;

    // Helper to get my player object
    const getSelfPlayer = () => {
      if (!lobby) return null;
      return lobby.players.find(p => p.userId === currentUser._id);
    };

    // Main HTML structure
    container.innerHTML = `
      <div class="container" style="padding-top: var(--spacing-md); padding-bottom: var(--spacing-lg); max-width: 1000px;">
        
        <!-- Live HP Progress Bars -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-lg);">
          <!-- Team A (Blue) Can Bar -->
          <div id="team-card-a" class="glass-card" style="border: 1px solid rgba(0, 180, 255, 0.2); padding: 12px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; font-family: var(--font-heading); font-size: 0.8rem; color: var(--color-accent-blue);">
              <span>🔵 MAVİ TAKIM</span>
              <span id="hp-text-a">300 / 300 HP</span>
            </div>
            <div class="hp-bar-outer">
              <div id="hp-bar-a" class="hp-bar-inner blue" style="width: 100%;"></div>
            </div>
            <div id="team-a-contestants" style="display: flex; gap: 5px; font-size: 0.7rem; color: var(--color-text-muted);"></div>
          </div>

          <!-- Team B (Red) Can Bar -->
          <div id="team-card-b" class="glass-card" style="border: 1px solid rgba(255, 51, 102, 0.2); padding: 12px; display: flex; flex-direction: column; gap: 8px;">
            <div style="display: flex; justify-content: space-between; font-family: var(--font-heading); font-size: 0.8rem; color: var(--color-error);">
              <span>🔴 KIRMIZI TAKIM</span>
              <span id="hp-text-b">300 / 300 HP</span>
            </div>
            <div class="hp-bar-outer">
              <div id="hp-bar-b" class="hp-bar-inner red" style="width: 100%;"></div>
            </div>
            <div id="team-b-contestants" style="display: flex; gap: 5px; font-size: 0.7rem; color: var(--color-text-muted);"></div>
          </div>
        </div>

        <!-- Stage Title and Indicator Header -->
        <div class="glass-card" style="padding: 10px var(--spacing-md); text-align: center; border: 1px solid var(--color-border); margin-bottom: var(--spacing-lg); display: flex; justify-content: space-between; align-items: center;">
          <button class="btn btn-secondary" id="exit-game-btn" style="padding: 0.4rem 0.8rem; font-size: 0.7rem;">ÇIKIŞ YAP</button>
          <div>
            <span id="game-stage-indicator" style="font-size: 0.7rem; color: var(--color-text-muted); font-family: var(--font-heading); text-transform: uppercase;">ETAP 1 / 1</span>
            <h3 id="game-stage-title" style="font-family: var(--font-heading); font-size: 1.15rem; color: #ffffff; text-transform: uppercase; margin-top: 2px;">YÜKLENİYOR...</h3>
          </div>
          <div style="width: 80px;"></div> <!-- Spacer -->
        </div>

        <!-- Dynamic Game Arena Area -->
        <div id="game-arena-row" style="display: grid; grid-template-columns: 1fr; gap: var(--spacing-lg);">
          <!-- Injected dynamically by role (Host Panel vs Player Buzzer Arena) -->
        </div>

      </div>
    `;

    // DOM Elements
    const hpTextA = document.getElementById('hp-text-a');
    const hpTextB = document.getElementById('hp-text-b');
    const hpBarA = document.getElementById('hp-bar-a');
    const hpBarB = document.getElementById('hp-bar-b');
    const teamAContestants = document.getElementById('team-a-contestants');
    const teamBContestants = document.getElementById('team-b-contestants');
    const stageIndicator = document.getElementById('game-stage-indicator');
    const stageTitle = document.getElementById('game-stage-title');
    const arenaRow = document.getElementById('game-arena-row');
    const exitGameBtn = document.getElementById('exit-game-btn');

    exitGameBtn.addEventListener('click', () => {
      if (confirm('Oyundan ayrılmak istediğinize emin misiniz?')) {
        window.location.hash = '#dashboard';
      }
    });

    // Spacebar keyboard listener for contestant buzzer
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !isHost && lobby) {
        // Prevent page scrolling on space
        e.preventDefault();
        
        const self = getSelfPlayer();
        if (self && lobby.gameState.isBuzzerActive && !lobby.gameState.buzzedPlayer) {
          if (!lobby.gameState.failedTeams.includes(self.team)) {
            socket.emit('game:buzz', { lobbyCode });
          }
        }
      }
    };

    gameScreen._keydownListener = handleKeyDown;
    window.addEventListener('keydown', gameScreen._keydownListener);

    let lastHpA = null;
    let lastHpB = null;

    const triggerDamageAnimation = (cardId) => {
      const el = document.getElementById(cardId);
      if (el) {
        el.classList.add('shake-damage');
        setTimeout(() => el.classList.remove('shake-damage'), 400);
      }
    };

    // Render the score values and health bar widths
    const updateHPBars = () => {
      if (!lobby) return;

      const hpA = lobby.gameState.teamA_HP;
      const hpB = lobby.gameState.teamB_HP;
      const maxHP = lobby.settings.startingHP;

      hpTextA.innerText = `${hpA} / ${maxHP} HP`;
      hpTextB.innerText = `${hpB} / ${maxHP} HP`;

      const widthA = (hpA / maxHP) * 100;
      const widthB = (hpB / maxHP) * 100;

      hpBarA.style.width = `${widthA}%`;
      hpBarB.style.width = `${widthB}%`;

      // Trigger shake on decrease
      if (lastHpA !== null && hpA < lastHpA) {
        triggerDamageAnimation('team-card-a');
      }
      if (lastHpB !== null && hpB < lastHpB) {
        triggerDamageAnimation('team-card-b');
      }
      lastHpA = hpA;
      lastHpB = hpB;
      
      // Update contestants lists
      const playersA = lobby.players.filter(p => p.team === 'A').map(p => p.username).join(', ');
      const playersB = lobby.players.filter(p => p.team === 'B').map(p => p.username).join(', ');
      teamAContestants.innerText = playersA ? `Oyuncular: ${playersA}` : 'Oyuncu yok';
      teamBContestants.innerText = playersB ? `Oyuncular: ${playersB}` : 'Oyuncu yok';
    };

    // Render Active Stage Layout
    const drawArena = () => {
      if (!lobby) return;

      const activeIndex = lobby.gameState.activeStageIndex;
      const stageOrder = lobby.settings.stageOrder;
      
      stageIndicator.innerText = `ETAP ${activeIndex + 1} / ${stageOrder.length}`;
      
      const currentStageKey = stageOrder[activeIndex];
      const stageInfo = stageNames[currentStageKey];
      stageTitle.innerText = stageInfo ? stageInfo.name : 'Bilinmeyen Etap';

      if (lobby.gameState.isPaused) {
        arenaRow.innerHTML = `
          <div class="glass-card" style="text-align: center; padding: var(--spacing-xl); border: 2px solid rgba(255,200,0,0.3);">
            <div style="font-size: 3rem; margin-bottom: var(--spacing-md);">⏸️</div>
            <h2 style="font-family: var(--font-heading); font-size: 1.6rem; color: #ffd700; margin-bottom: 5px;">OYUN DURAKLATILDI</h2>
            <p style="color: var(--color-text-muted); font-size: 0.85rem;">Sunucu oyunu geçici olarak durdurdu. Devam etmesi bekleniyor...</p>
            ${isHost ? `
              <button id="btn-resume-game" class="btn btn-primary" style="margin-top: var(--spacing-lg); padding: 0.8rem 2rem; font-size: 0.9rem;">
                ▶️ DEVAM ET
              </button>
            ` : ''}
          </div>
        `;
        if (isHost) {
          document.getElementById('btn-resume-game').addEventListener('click', () => {
            socket.emit('host:resume-game', { lobbyCode });
          });
        }
        return;
      }

      if (lobby.gameState.isGameOver) {
        drawGameOverScreen();
        return;
      }

      if (isHost) {
        drawHostPanel(currentStageKey);
      } else {
        drawContestantBuzzerScreen(currentStageKey);
      }
    };

    // GameOver Screen (HP = 0 Trigger)
    const drawGameOverScreen = () => {
      const winner = lobby.gameState.winnerTeam;
      const winnerText = winner === 'A' ? '🔵 MAVİ TAKIM KAZANDI!' : '🔴 KIRMIZI TAKIM KAZANDI!';
      const colorStyle = winner === 'A' ? 'color: var(--color-accent-blue);' : 'color: var(--color-error);';

      arenaRow.innerHTML = `
        <div class="glass-card" style="text-align: center; padding: var(--spacing-xl); border: 2px solid var(--color-accent-purple);">
          <div style="font-size: 3.5rem; margin-bottom: var(--spacing-md);">🏆</div>
          <h2 class="text-gradient" style="font-family: var(--font-heading); font-size: 1.8rem; margin-bottom: 5px; ${colorStyle}">
            ${winnerText}
          </h2>
          <p style="color: var(--color-text-muted); font-size: 0.85rem; margin-bottom: var(--spacing-lg);">
            Takımlardan birinin canı 0'a ulaştı. Yarışma sona erdi!
          </p>

          <div style="display: flex; gap: var(--spacing-md); justify-content: center; flex-wrap: wrap;">
            ${isHost 
              ? `<button id="host-override-continue" class="btn btn-secondary" style="padding: 0.7rem 1.5rem; font-size: 0.8rem;">CAN VER & DEVAM ET 🛠️</button>
                 <button id="host-save-finish" class="btn btn-primary" style="padding: 0.7rem 1.5rem; font-size: 0.8rem; background: var(--color-accent-purple); box-shadow: var(--shadow-neon-purple);">YARIŞMAYI TAMAMLA 💾</button>`
              : `<p style="font-size: 0.85rem; color: var(--color-text-muted);">Sunucunun yarışma sonuçlarını kaydetmesi bekleniyor...</p>`
            }
          </div>
        </div>
      `;

      if (isHost) {
        document.getElementById('host-override-continue').addEventListener('click', () => {
          socket.emit('host:override-continue', { lobbyCode });
        });
        document.getElementById('host-save-finish').addEventListener('click', () => {
          socket.emit('host:next-stage', { lobbyCode }); // Triggers end-game database save
        });
      }
    };

    // Host Moderator Screen
    const drawHostPanel = (stageKey) => {
      const state = lobby.gameState;
      const currentStage = lobby.stages[stageKey];
      const hasBuzzed = state.buzzedPlayer !== null;

      // Render general details
      arenaRow.innerHTML = `
        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: var(--spacing-lg);">
          
          <!-- Left: Stage control & buzzer decisions -->
          <div class="glass-card" style="border: 1px solid var(--color-border); display: flex; flex-direction: column; justify-content: space-between;">
            <div>
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 8px; margin-bottom: var(--spacing-md);">
                <h4 style="font-family: var(--font-heading); font-size: 0.85rem; color: var(--color-text-muted);">HOST KONTROL PANELİ</h4>
                <div style="display: flex; gap: 5px; align-items: center;">
                  <button id="btn-pause-game" class="stage-item-btn" style="padding: 4px 8px; font-size: 0.7rem; color: #ffd700; border-color: #ffd700;" title="Oyunu Durdur / Devam Et">
                    ${state.isPaused ? '▶️' : '⏸️'}
                  </button>
                  <button id="btn-end-game" class="stage-item-btn" style="padding: 4px 8px; font-size: 0.7rem; color: var(--color-error); border-color: var(--color-error);" title="Oyunu Bitir">
                    🏁 BİTİR
                  </button>
                  <div class="game-card-badge published" style="font-size: 0.6rem;">SUNUCU</div>
                </div>
              </div>

              <!-- Question placeholder or details (Phase 13 details will update this) -->
              <div id="host-stage-content-box">
                <div class="game-question-box">
                  Etap: ${stageNames[stageKey]?.name}. Soru detayları ve canlı veri akış kontrolleri.
                </div>
              </div>
            </div>

            <!-- Buzzer Actions -->
            <div style="border-top: 1px solid var(--color-border); padding-top: var(--spacing-md); display: flex; flex-direction: column; align-items: center; gap: var(--spacing-sm);">
            <!-- Buzzer Actions -->
            <div style="border-top: 1px solid var(--color-border); padding-top: var(--spacing-md); display: flex; flex-direction: column; align-items: center; gap: var(--spacing-sm);">
              ${hasBuzzed 
                ? `
                  <div style="background: rgba(0,240,255,0.05); border: 1px dashed var(--color-accent-blue); padding: var(--spacing-sm); border-radius: var(--radius-md); text-align: center; width: 100%; margin-bottom: 5px;">
                    <div style="font-size: 0.7rem; color: var(--color-text-muted);">BUZZER TETİKLENDİ!</div>
                    <strong style="font-size: 1.1rem; color: #ffffff;">🔵 @${state.buzzedPlayer.username} (${state.buzzedPlayer.team === 'A' ? 'Mavi Takım' : 'Kırmızı Takım'})</strong>
                    ${state.selectedOptionIndex !== null 
                      ? `<div style="margin-top: 5px; color: var(--color-accent-blue); font-weight: bold; font-size: 0.95rem;">Seçilen Şık: ${String.fromCharCode(65 + state.selectedOptionIndex)}</div>`
                      : `<div style="margin-top: 5px; color: var(--color-text-muted); font-size: 0.8rem; font-style: italic;">Şık seçimi bekleniyor...</div>`
                    }
                  </div>
                  <div style="display: flex; gap: var(--spacing-md); width: 100%;">
                    <button id="btn-correct" class="btn btn-success" style="flex: 1; padding: 0.75rem;">DOĞRU CEVAP ✅</button>
                    <button id="btn-incorrect" class="btn btn-danger" style="flex: 1; padding: 0.75rem;">YANLIŞ CEVAP ❌</button>
                  </div>
                `
                : `
                  <div style="display: flex; align-items: center; gap: var(--spacing-md); width: 100%;">
                    <button id="btn-toggle-buzzer" class="btn ${state.isBuzzerActive ? 'btn-danger' : 'btn-primary'}" style="flex: 1; padding: 0.75rem;" ${(!currentStage?.questions || state.currentQuestionIndex >= currentStage.questions.length) ? 'disabled' : ''}>
                      ${state.isBuzzerActive ? '🔒 BUZZER\'I KİLİTLE' : '🔓 BUZZER\'I AKTİF ET'}
                    </button>
                  </div>
                  <div style="font-size: 0.7rem; color: var(--color-text-muted); margin-top: 5px;">
                    ${state.failedTeams.length > 0 ? `Buzzer kilitli takımlar: ${state.failedTeams.map(t => t === 'A' ? 'Mavi' : 'Kırmızı').join(', ')}` : 'Tüm takımlar buzz basabilir durumda.'}
                  </div>
                `
              }
            </div>
          </div>

          <!-- Right: HP Overrides & Next Stage controls -->
          <div class="glass-card" style="border: 1px solid var(--color-border); display: flex; flex-direction: column; justify-content: space-between; gap: 15px;">
            <div>
              <h4 style="font-family: var(--font-heading); font-size: 0.85rem; color: var(--color-text-muted); border-bottom: 1px solid var(--color-border); padding-bottom: 8px; margin-bottom: var(--spacing-md);">MANUEL AYARLAR</h4>

              <!-- Player connection status -->
              <div style="margin-bottom: var(--spacing-md);">
                <div style="font-size: 0.65rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">OYUNCU BAĞLANTILARI</div>
                <div style="display: flex; flex-direction: column; gap: 4px;">
                  ${lobby.players.map(p => {
                    const teamColor = p.team === 'A' ? 'var(--color-accent-blue)' : 'var(--color-error)';
                    const teamLabel = p.team === 'A' ? '🔵' : '🔴';
                    const isConnected = p.isConnected !== false;
                    const statusEmoji = isConnected ? '✅' : '⚠️';
                    const nameStyle = isConnected ? 'color: #fff;' : 'color: var(--color-text-muted); text-decoration: line-through;';
                    const warningLabel = isConnected ? '' : ' <span style="color: var(--color-error); font-size: 0.65rem; font-weight: bold;">(Koptu)</span>';
                    return `<div style="display: flex; align-items: center; gap: 6px; font-size: 0.72rem;">
                      <span style="font-size: 0.8rem;">${statusEmoji}</span>
                      <span style="color: ${teamColor}">${teamLabel}</span>
                      <span style="${nameStyle}">@${p.username}${warningLabel}</span>
                    </div>`;
                  }).join('')}
                  ${lobby.players.length === 0 ? '<div style="font-size: 0.7rem; color: var(--color-text-muted); font-style: italic;">Oyuncu yok</div>' : ''}
                </div>
              </div>

              <!-- Team A Manual adjustment -->
              <div style="margin-bottom: var(--spacing-md);">
                <div style="font-size: 0.75rem; color: var(--color-accent-blue); font-weight: bold; margin-bottom: 5px;">MAVİ TAKIM CANI</div>
                <div style="display: flex; gap: 5px;">
                  <button class="stage-item-btn hp-override" data-team="A" data-diff="-10" style="flex: 1; padding: 6px;">-10</button>
                  <button class="stage-item-btn hp-override" data-team="A" data-diff="-50" style="flex: 1; padding: 6px;">-50</button>
                  <button class="stage-item-btn hp-override" data-team="A" data-diff="10" style="flex: 1; padding: 6px; color: var(--color-success);">+10</button>
                </div>
              </div>

              <!-- Team B Manual adjustment -->
              <div style="margin-bottom: var(--spacing-md);">
                <div style="font-size: 0.75rem; color: var(--color-error); font-weight: bold; margin-bottom: 5px;">KIRMIZI TAKIM CANI</div>
                <div style="display: flex; gap: 5px;">
                  <button class="stage-item-btn hp-override" data-team="B" data-diff="-10" style="flex: 1; padding: 6px;">-10</button>
                  <button class="stage-item-btn hp-override" data-team="B" data-diff="-50" style="flex: 1; padding: 6px;">-50</button>
                  <button class="stage-item-btn hp-override" data-team="B" data-diff="10" style="flex: 1; padding: 6px; color: var(--color-success);">+10</button>
                </div>
              </div>
            </div>

            <!-- Next Question or Next Stage -->
            <div>
              ${((stageKey === 'multipleChoice' || stageKey === 'finalDuel') && currentStage?.questions && state.currentQuestionIndex < currentStage.questions.length - 1)
                ? `<button id="btn-next-question" class="btn btn-secondary" style="width: 100%; padding: 0.8rem; margin-bottom: 8px; border-color: var(--color-accent-blue); color: #ffffff;">SONRAKİ SORU ➡️</button>`
                : ''
              }
              ${stageKey === 'imageGuess' ? `
                <button id="btn-reveal-step" class="btn btn-secondary" style="width: 100%; padding: 0.8rem; margin-bottom: 8px; border-color: var(--color-accent-blue); color: #ffffff;" ${(state.currentRevealStep ?? 0) >= parseInt(currentStage?.steps || 5) ? 'disabled' : ''}>🔍 BİR ADIM AÇ (${(state.currentRevealStep ?? 0)} / ${parseInt(currentStage?.steps || 5)})</button>
                ${(currentStage?.items && state.currentQuestionIndex < currentStage.items.length - 1)
                  ? `<button id="btn-next-image" class="btn btn-secondary" style="width: 100%; padding: 0.8rem; margin-bottom: 8px; border-color: var(--color-accent-blue); color: #ffffff;">SONRAKİ GÖRSEL 🖼️</button>`
                  : ''
                }
              ` : ''}
              ${stageKey === 'soundGuess' ? `
                <button id="btn-play-sound" class="btn btn-secondary" style="width: 100%; padding: 0.8rem; margin-bottom: 8px; border-color: var(--color-accent-blue); color: #ffffff;">🎵 SESİ ÇALI / +5SN UZAT (Adım ${state.soundPlayStep ?? 0})</button>
                ${(currentStage?.items && state.currentQuestionIndex < currentStage.items.length - 1)
                  ? `<button id="btn-next-sound" class="btn btn-secondary" style="width: 100%; padding: 0.8rem; margin-bottom: 8px; border-color: var(--color-accent-blue); color: #ffffff;">SONRAKİ SES 🎵</button>`
                  : ''
                }
              ` : ''}
              ${stageKey === 'sayismaca' ? `
                <button id="btn-sayismaca-A" class="btn btn-secondary" style="width: 100%; padding: 0.7rem; margin-bottom: 6px; border-color: var(--color-accent-blue); color: var(--color-accent-blue);">🔵 MAVİ TAKIM Sayıyor</button>
                <button id="btn-sayismaca-B" class="btn btn-secondary" style="width: 100%; padding: 0.7rem; margin-bottom: 8px; border-color: var(--color-error); color: var(--color-error);">🔴 KIRMIZI TAKIM Sayıyor</button>
                ${(currentStage?.items && state.currentQuestionIndex < currentStage.items.length - 1)
                  ? `<button id="btn-next-theme" class="btn btn-secondary" style="width: 100%; padding: 0.7rem; margin-bottom: 8px; border-color: var(--color-accent-blue); color: #ffffff;">SONRAKİ TEMA ➡️</button>`
                  : ''
                }
              ` : ''}
              ${stageKey === 'wordPuzzle' ? (() => {
                const items = currentStage?.items || [];
                const qIdx = state.currentQuestionIndex;
                const word = qIdx < items.length ? items[qIdx].word : '';
                const revealed = state.revealedLetters || [];
                const allRevealed = word.length > 0 && revealed.length === word.length;
                return `
                  <div style="font-size: 0.65rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">Harf Aç</div>
                  <div style="display: grid; grid-template-columns: repeat(${Math.min(word.length, 5)}, 1fr); gap: 4px; margin-bottom: 8px;">
                    ${Array.from(word).map((letter, i) => {
                      const isRevealed = revealed.includes(i);
                      return `<button id="reveal-letter-${i}" class="stage-item-btn" style="padding: 5px 2px; font-size: 0.7rem; font-weight: bold; background: ${isRevealed ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.03)'}; border-color: ${isRevealed ? 'var(--color-success)' : 'var(--color-border)'}; color: ${isRevealed ? 'var(--color-success)' : '#fff'}; ${isRevealed ? 'cursor:not-allowed;' : ''}">${isRevealed ? letter : '_'}</button>`;
                    }).join('')}
                  </div>
                  <div style="display: flex; gap: 4px; margin-bottom: 8px;">
                    <button id="btn-word-solved-A" class="btn btn-secondary" style="flex:1; padding: 0.6rem; font-size: 0.7rem; border-color: var(--color-accent-blue); color: var(--color-accent-blue);">🔵 Mavi Bildi</button>
                    <button id="btn-word-solved-B" class="btn btn-secondary" style="flex:1; padding: 0.6rem; font-size: 0.7rem; border-color: var(--color-error); color: var(--color-error);">🔴 Kırmızı Bildi</button>
                  </div>
                  ${(items.length > 0 && qIdx < items.length - 1)
                    ? `<button id="btn-next-word" class="btn btn-secondary" style="width: 100%; padding: 0.7rem; margin-bottom: 8px; border-color: var(--color-accent-blue); color: #ffffff;">SONRAKİ KELİME ➡️</button>`
                    : ''
                  }
                `;
              })() : ''}
              ${stageKey === 'mapGuess' ? `
                <button id="btn-reveal-map-hint" class="btn btn-secondary" style="width: 100%; padding: 0.8rem; margin-bottom: 8px; border-color: var(--color-accent-blue); color: #ffffff;" ${state.mapHintRevealed ? 'disabled' : ''}>💡 İPUCUNU GÖSTER</button>
                ${(currentStage?.items && state.currentQuestionIndex < currentStage.items.length - 1)
                  ? `<button id="btn-next-map" class="btn btn-secondary" style="width: 100%; padding: 0.8rem; margin-bottom: 8px; border-color: var(--color-accent-blue); color: #ffffff;">SONRAKİ HARİTA 🗺️</button>`
                  : ''
                }
              ` : ''}
              <button id="btn-next-stage" class="btn btn-secondary" style="width: 100%; padding: 0.8rem; box-shadow: var(--shadow-neon-purple); border-color: var(--color-accent-purple); color: #ffffff;">
                SONRAKİ ETAP 🏁
              </button>
            </div>
          </div>

        </div>
      `;

      // Render Stage Specific Question on Host screen
      const hostStageContentBox = document.getElementById('host-stage-content-box');
      if (stageKey === 'multipleChoice' || stageKey === 'finalDuel') {
        const questions = currentStage?.questions || [];
        const qIdx = state.currentQuestionIndex;

        if (qIdx < questions.length) {
          const q = questions[qIdx];
          const isGoldQuestion = stageKey === 'finalDuel' && qIdx === questions.length - 1;
          const goldBadge = isGoldQuestion ? `<span class="game-card-badge draft" style="font-size: 0.65rem; background: var(--color-error); box-shadow: var(--shadow-neon-purple); border-color: var(--color-accent-purple); padding: 1px 4px; margin-left: 8px;">🏆 ALTIN SORU (${currentStage.lastQuestionMultiplier || 2}x Hasar!)</span>` : '';

          hostStageContentBox.innerHTML = `
            <div style="margin-bottom: 12px; font-weight: 600; font-size: 0.95rem; font-family: var(--font-heading); color: var(--color-text-muted); display: flex; align-items: center;">
              <span>${stageKey === 'finalDuel' ? 'DÜELLO SORUSU' : 'SORU'} ${qIdx + 1} / ${questions.length}</span>
              ${goldBadge}
            </div>
            <div class="game-question-box" style="margin-bottom: var(--spacing-md); font-weight: 600;">
              ${q.question}
            </div>
            <div class="option-btn-grid" style="margin-bottom: var(--spacing-md);">
              ${q.options.map((opt, i) => {
                const isCorrect = i === q.correctAnswer;
                const isSelected = i === state.selectedOptionIndex;
                let borderStyle = '';
                if (isCorrect) borderStyle = 'border: 2px solid var(--color-success); background: rgba(0, 255, 136, 0.05);';
                else if (isSelected) borderStyle = 'border: 2px solid var(--color-accent-blue); background: rgba(0, 240, 255, 0.05);';
                
                return `
                  <div class="game-option-btn" style="${borderStyle} display: flex; justify-content: space-between; align-items: center; cursor: default;">
                    <span>${String.fromCharCode(65 + i)}) ${opt}</span>
                    ${isCorrect ? '<span style="color: var(--color-success); font-weight: bold; font-size: 0.75rem;">DOĞRU ŞIK</span>' : ''}
                    ${isSelected ? '<span style="color: var(--color-accent-blue); font-weight: bold; font-size: 0.75rem;">SEÇİLEN</span>' : ''}
                  </div>
                `;
              }).join('')}
            </div>
          `;
        } else {
          const finishedLabel = stageKey === 'finalDuel' ? 'Final Düellosu etabındaki tüm sorular tamamlandı! Sonraki etaba geçebilirsiniz.' : 'Çoktan Seçmeli etabındaki tüm sorular tamamlandı! Sonraki etaba geçebilirsiniz.';
          hostStageContentBox.innerHTML = `
            <div class="empty-state" style="border: 1px dashed var(--color-border); padding: var(--spacing-md);">
              🏁 ${finishedLabel}
            </div>
          `;
        }
      }

      // ── Image Guess Stage: Host Panel ──
      if (stageKey === 'imageGuess') {
        const items = currentStage?.items || [];
        const qIdx = state.currentQuestionIndex;
        const revealStep = state.currentRevealStep ?? 0;
        const totalSteps = parseInt(currentStage?.steps || 5);
        const effect = currentStage?.revealEffect || 'blur';

        if (qIdx < items.length) {
          const item = items[qIdx];
          // Compute current filter based on effect
          const progress = Math.min(revealStep / totalSteps, 1);
          let filterStyle = '';
          if (effect === 'blur') {
            const blurPx = Math.round((1 - progress) * 30);
            filterStyle = `filter: blur(${blurPx}px);`;
          } else if (effect === 'pixel') {
            // Pixelation via scale trick: CSS doesn't have a native pixel filter,
            // so we'll use a data attribute and rely on a CSS brightness approach
            const pixelSize = Math.max(1, Math.round((1 - progress) * 20));
            filterStyle = `filter: blur(${pixelSize}px); image-rendering: pixelated;`;
          }
          // For puzzle effect, we use JS overlay tiles (handled in JS below)

          hostStageContentBox.innerHTML = `
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; font-size: 0.95rem; font-family: var(--font-heading); color: var(--color-text-muted);">GÖRSEL ${qIdx + 1} / ${items.length}</span>
              <span style="font-size: 0.75rem; color: var(--color-accent-blue); font-family: var(--font-heading);">ADIM ${revealStep} / ${totalSteps}</span>
            </div>
            <div class="reveal-image-wrap" id="host-reveal-wrap" style="margin-bottom: var(--spacing-md);">
              <img id="host-reveal-img" src="${item.imageUrl}" style="${filterStyle}" />
              ${effect === 'puzzle' ? `<div class="puzzle-grid-overlay" id="host-puzzle-overlay" style="grid-template-columns: repeat(5,1fr); grid-template-rows: repeat(4,1fr);"></div>` : ''}
              <div class="reveal-step-info">${effect.toUpperCase()} · ${totalSteps} ADIM</div>
            </div>
            <div style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; margin-bottom: 5px;">
              Cevap: <strong style="color: ${revealStep >= totalSteps ? 'var(--color-success)' : 'transparent'}; background: ${revealStep >= totalSteps ? 'none' : 'var(--color-text-muted)'}; border-radius: 3px; padding: 1px 5px;">${item.answer}</strong>
              ${revealStep < totalSteps ? '<span style="font-size:0.65rem;">(Tüm adımlar açıldığında görünür)</span>' : ''}
            </div>
          `;

          // Puzzle overlay logic: create tiles and reveal them randomly
          if (effect === 'puzzle') {
            const overlay = document.getElementById('host-puzzle-overlay');
            if (overlay) {
              const cols = 5, rows = 4, total = cols * rows;
              overlay.innerHTML = Array.from({ length: total }, (_, i) => `<div class="puzzle-tile" data-idx="${i}"></div>`).join('');
              const tiles = overlay.querySelectorAll('.puzzle-tile');
              // Reveal proportional tiles based on step progress
              const revealCount = Math.round(progress * total);
              const indices = [...Array(total).keys()];
              // Use seeded pseudo-random based on revealStep to keep order consistent
              indices.sort((a, b) => ((a * 7 + 3) % total) - ((b * 7 + 3) % total));
              indices.slice(0, revealCount).forEach(i => tiles[i]?.classList.add('revealed'));
            }
          }
        } else {
          hostStageContentBox.innerHTML = `
            <div class="empty-state" style="border: 1px dashed var(--color-border); padding: var(--spacing-md);">
              🏁 Görsel Tahmin etabındaki tüm görseller tamamlandı! Sonraki etaba geçebilirsiniz.
            </div>
          `;
        }
      }

      // ── Sound Guess Stage: Host Panel ──
      if (stageKey === 'soundGuess') {
        const items = currentStage?.items || [];
        const qIdx = state.currentQuestionIndex;
        const soundStep = state.soundPlayStep ?? 0;
        const playMode = currentStage?.playMode || 'gradual';

        if (qIdx < items.length) {
          const item = items[qIdx];
          const playedSec = soundStep * 5;

          hostStageContentBox.innerHTML = `
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; font-size: 0.95rem; font-family: var(--font-heading); color: var(--color-text-muted);">SES ${qIdx + 1} / ${items.length}</span>
              <span style="font-size: 0.75rem; color: var(--color-accent-blue); font-family: var(--font-heading);">${soundStep > 0 ? `${playedSec} SN ÇALINDI` : 'HENÜz ÇALINMADI'}</span>
            </div>

            <!-- Audio player (host only) -->
            <div style="background: rgba(0,240,255,0.03); border: 1px solid rgba(0,240,255,0.1); border-radius: var(--radius-md); padding: var(--spacing-sm); margin-bottom: var(--spacing-sm);">
              <audio id="host-audio-player" src="${item.audioUrl}" style="width:100%; height: 32px;" ${soundStep === 0 ? '' : ''}></audio>
            </div>

            <div style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center;">
              Cevap: <strong style="color: var(--color-success);">${item.answer}</strong>
            </div>
            <div style="font-size: 0.7rem; color: var(--color-text-muted); text-align: center; margin-top: 4px;">
              ${playMode === 'gradual' ? 'Kademeli mod: Her basışta +5 saniye açılır.' : 'Tam mod: Ses tamamı çalınır.'}
            </div>
          `;

          // Auto-play audio up to playedSec when step > 0 (host-side preview)
          if (soundStep > 0) {
            const audioEl = document.getElementById('host-audio-player');
            if (audioEl) {
              audioEl.currentTime = 0;
              audioEl.play().catch(() => {});
              if (playMode === 'gradual') {
                setTimeout(() => audioEl.pause(), playedSec * 1000);
              }
            }
          }
        } else {
          hostStageContentBox.innerHTML = `
            <div class="empty-state" style="border: 1px dashed var(--color-border); padding: var(--spacing-md);">
              🏁 Ses Tahmin etabındaki tüm sesler tamamlandı! Sonraki etaba geçebilirsiniz.
            </div>
          `;
        }
      }

      // ── Sayişmaca Stage: Host Panel ──
      if (stageKey === 'sayismaca') {
        const items = currentStage?.items || [];
        const qIdx = state.currentQuestionIndex;
        const countdownTime = currentStage?.countdownTime || 30;
        const isRunning = state.sayismacaRunning;
        const activeTeam = state.sayismacaActiveTeam;

        if (qIdx < items.length) {
          const item = items[qIdx];

          hostStageContentBox.innerHTML = `
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; font-size: 0.95rem; font-family: var(--font-heading); color: var(--color-text-muted);">TEMA ${qIdx + 1} / ${items.length}</span>
              <span id="sayismaca-timer" style="font-size: 1.2rem; font-weight: 800; font-family: var(--font-heading); color: ${isRunning ? 'var(--color-error)' : 'var(--color-text-muted)'};">⏱ ${countdownTime}s</span>
            </div>

            <!-- Theme name -->
            <div style="text-align: center; padding: 14px; background: rgba(0,240,255,0.03); border: 1px solid rgba(0,240,255,0.15); border-radius: var(--radius-md); margin-bottom: var(--spacing-sm);">
              <div style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 2px; color: var(--color-text-muted); margin-bottom: 5px;">AKTİF TEMA</div>
              <div style="font-size: 1.4rem; font-weight: 800; font-family: var(--font-heading); color: #ffffff;">${item.theme}</div>
            </div>

            <!-- Reference answers (host only) -->
            <div style="margin-bottom: var(--spacing-sm);">
              <div style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 2px; color: var(--color-text-muted); margin-bottom: 6px;">REFERANS CEVAPLAR (Sadece Sen Görebilirsin)</div>
              <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                ${item.referenceAnswers.map(ans => `<span style="background: rgba(0,255,136,0.08); border: 1px solid rgba(0,255,136,0.2); border-radius: var(--radius-sm); padding: 2px 8px; font-size: 0.75rem; color: var(--color-success);">${ans}</span>`).join('')}
              </div>
            </div>

            ${isRunning ? `
              <!-- Sayışmaca running: success/fail buttons -->
              <div style="display: flex; gap: var(--spacing-sm); margin-top: var(--spacing-sm);">
                <button id="btn-say-success" class="btn btn-success" style="flex: 1; padding: 0.75rem; font-size: 0.85rem;">BAŞARILI ✅<br><span style="font-size: 0.65rem;">${activeTeam === 'A' ? 'Kırmızı takıma' : 'Mavi takıma'} ${currentStage?.successDamage || 15} hasar</span></button>
                <button id="btn-say-fail" class="btn btn-danger" style="flex: 1; padding: 0.75rem; font-size: 0.85rem;">BAŞARISIZ ❌<br><span style="font-size: 0.65rem;">${activeTeam === 'A' ? 'Mavi takıma' : 'Kırmızı takıma'} ${currentStage?.failDamage || 20} hasar</span></button>
              </div>
            ` : `
              <div style="text-align: center; color: var(--color-text-muted); font-size: 0.8rem; margin-top: var(--spacing-sm);">
                Sağdaki butonlardan hangi takımın sayacağını seçin.
              </div>
            `}
          `;

          // Live countdown timer (host-side only)
          if (isRunning) {
            let remainingSec = countdownTime;
            const timerEl = document.getElementById('sayismaca-timer');
            // Store interval reference on window to allow cleanup on drawArena re-renders
            if (window._sayismacaTimer) clearInterval(window._sayismacaTimer);
            window._sayismacaTimer = setInterval(() => {
              remainingSec--;
              if (timerEl) timerEl.innerText = `⏱ ${remainingSec}s`;
              if (remainingSec <= 0) {
                clearInterval(window._sayismacaTimer);
                if (timerEl) timerEl.innerText = '⏱ SÜRE DOLDU!';
              }
            }, 1000);

            // Bind success/fail buttons
            setTimeout(() => {
              const sucBtn = document.getElementById('btn-say-success');
              const failBtn = document.getElementById('btn-say-fail');
              if (sucBtn) sucBtn.addEventListener('click', () => {
                if (window._sayismacaTimer) clearInterval(window._sayismacaTimer);
                socket.emit('host:sayismaca-result', { lobbyCode, success: true });
              });
              if (failBtn) failBtn.addEventListener('click', () => {
                if (window._sayismacaTimer) clearInterval(window._sayismacaTimer);
                socket.emit('host:sayismaca-result', { lobbyCode, success: false });
              });
            }, 0);
          }
        } else {
          hostStageContentBox.innerHTML = `
            <div class="empty-state" style="border: 1px dashed var(--color-border); padding: var(--spacing-md);">
              🏁 Sayışmaca etabındaki tüm temalar tamamlandı! Sonraki etaba geçebilirsiniz.
            </div>
          `;
        }
      }

      // ── Word Puzzle Stage: Host Panel ──
      if (stageKey === 'wordPuzzle') {
        const items = currentStage?.items || [];
        const qIdx = state.currentQuestionIndex;
        const revealed = state.revealedLetters || [];

        if (qIdx < items.length) {
          const item = items[qIdx];
          const word = item.word || '';
          const allRevealed = revealed.length === word.length;

          hostStageContentBox.innerHTML = `
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; font-size: 0.95rem; font-family: var(--font-heading); color: var(--color-text-muted);">KELİME ${qIdx + 1} / ${items.length}</span>
              <span style="font-size: 0.75rem; color: ${allRevealed ? 'var(--color-success)' : 'var(--color-accent-purple)'}; font-family: var(--font-heading);">${revealed.length} / ${word.length} Harf Açık</span>
            </div>

            <!-- Full word visible to host -->
            <div style="text-align:center; background: rgba(180,60,255,0.05); border: 1px solid rgba(180,60,255,0.2); border-radius: var(--radius-md); padding: 12px; margin-bottom: var(--spacing-sm);">
              <div style="font-size: 0.6rem; text-transform: uppercase; letter-spacing: 2px; color: var(--color-text-muted); margin-bottom: 5px;">GELİ CEVAP (Sadece Sen Görebilirsin)</div>
              <div style="font-size: 1.6rem; font-weight: 900; font-family: var(--font-heading); color: var(--color-accent-purple); letter-spacing: 6px;">${word}</div>
            </div>

            <!-- Hint -->
            <div style="background: rgba(0,240,255,0.03); border: 1px solid rgba(0,240,255,0.1); border-radius: var(--radius-md); padding: 10px; margin-bottom: var(--spacing-sm); font-size: 0.85rem;">
              <span style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; color: var(--color-text-muted);">İPUCU: </span>
              <span style="color: #ffffff;">${item.hint}</span>
            </div>

            <!-- Hidden word display with revealed slots -->
            <div style="display: flex; flex-wrap: wrap; gap: 6px; justify-content: center; padding: var(--spacing-sm) 0;">
              ${Array.from(word).map((letter, i) => {
                const isRevealed = revealed.includes(i);
                return `<div style="
                  width: 34px; height: 34px;
                  display: flex; align-items: center; justify-content: center;
                  font-size: 1rem; font-weight: 900;
                  font-family: var(--font-heading);
                  border-bottom: 3px solid ${isRevealed ? 'var(--color-success)' : 'var(--color-accent-purple)'};
                  color: ${isRevealed ? 'var(--color-success)' : 'transparent'};
                  background: ${isRevealed ? 'rgba(0,255,136,0.05)' : 'transparent'};
                  border-radius: 4px 4px 0 0;
                  transition: all 0.4s ease;
                ">${isRevealed ? letter : '?'}</div>`;
              }).join('')}
            </div>
          `;
        } else {
          hostStageContentBox.innerHTML = `
            <div class="empty-state" style="border: 1px dashed var(--color-border); padding: var(--spacing-md);">
              🏁 Kelime Bulmaca etabındaki tüm kelimeler tamamlandı! Sonraki etaba geçebilirsiniz.
            </div>
          `;
        }
      }

      // ── Map Guess Stage: Host Panel ──
      if (stageKey === 'mapGuess') {
        const items = currentStage?.items || [];
        const qIdx = state.currentQuestionIndex;
        const hintRevealed = state.mapHintRevealed;

        if (qIdx < items.length) {
          const item = items[qIdx];
          hostStageContentBox.innerHTML = `
            <div style="margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;">
              <span style="font-weight: 600; font-size: 0.95rem; font-family: var(--font-heading); color: var(--color-text-muted);">HARİTA ${qIdx + 1} / ${items.length}</span>
              <span style="font-size: 0.75rem; color: ${hintRevealed ? 'var(--color-success)' : 'var(--color-text-muted)'}; font-family: var(--font-heading);">${hintRevealed ? 'İPUCU AÇIK' : 'İPUCU KAPALI'}</span>
            </div>

            <div style="position: relative; width: 100%; max-height: 260px; overflow: hidden; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: #0a0a0a; margin-bottom: var(--spacing-sm);">
              <img src="${item.imageUrl}" style="width: 100%; height: 100%; max-height: 260px; object-fit: contain; display: block;" />
            </div>

            <div style="font-size: 0.85rem; color: var(--color-text-muted); margin-bottom: 5px; text-align: center;">
              Cevap: <strong style="color: var(--color-success);">${item.answer}</strong>
            </div>

            ${item.hint ? `
              <div style="background: rgba(0,240,255,0.03); border: 1px solid rgba(0,240,255,0.1); border-radius: var(--radius-md); padding: 10px; font-size: 0.8rem; text-align: center;">
                <strong>İpucu:</strong> ${item.hint}
              </div>
            ` : ''}
          `;
        } else {
          hostStageContentBox.innerHTML = `
            <div class="empty-state" style="border: 1px dashed var(--color-border); padding: var(--spacing-md);">
              🏁 Harita Tahmin etabındaki tüm haritalar tamamlandı! Sonraki etaba geçebilirsiniz.
            </div>
          `;
        }
      }

      // Event handlers bind
      if (hasBuzzed) {
        document.getElementById('btn-correct').addEventListener('click', () => {
          let dmg = currentStage?.damagePerQuestion || currentStage?.damage || 10;
          if (stageKey === 'finalDuel') {
            const qIdx = state.currentQuestionIndex;
            const questions = currentStage?.questions || [];
            if (qIdx === questions.length - 1) {
              dmg *= (currentStage.lastQuestionMultiplier || 2);
            }
          }
          socket.emit('host:submit-answer', { lobbyCode, isCorrect: true, damageValue: dmg });
        });
        document.getElementById('btn-incorrect').addEventListener('click', () => {
          socket.emit('host:submit-answer', { lobbyCode, isCorrect: false });
        });
      } else {
        const toggleBtn = document.getElementById('btn-toggle-buzzer');
        if (toggleBtn) {
          toggleBtn.addEventListener('click', () => {
            socket.emit('host:set-buzzer-active', { lobbyCode, active: !state.isBuzzerActive });
          });
        }
      }

      // Next Question bind
      const nextQBtn = document.getElementById('btn-next-question');
      if (nextQBtn) {
        nextQBtn.addEventListener('click', () => {
          socket.emit('host:next-question', { lobbyCode });
        });
      }

      // Pause/Resume/End game bindings
      const pauseBtn = document.getElementById('btn-pause-game');
      if (pauseBtn) {
        pauseBtn.addEventListener('click', () => {
          if (state.isPaused) {
            socket.emit('host:resume-game', { lobbyCode });
          } else {
            socket.emit('host:pause-game', { lobbyCode });
          }
        });
      }
      const endGameBtn = document.getElementById('btn-end-game');
      if (endGameBtn) {
        endGameBtn.addEventListener('click', () => {
          if (confirm('Oyunu bitirmek istediğinize emin misiniz? Sonuçlar kaydedilecek.')) {
            socket.emit('host:end-game', { lobbyCode });
          }
        });
      }

      // Reveal Step bind (Image Guess)
      const revealBtn = document.getElementById('btn-reveal-step');
      if (revealBtn) {
        revealBtn.addEventListener('click', () => {
          socket.emit('host:reveal-step', { lobbyCode });
        });
      }

      // Next Image bind (Image Guess)
      const nextImgBtn = document.getElementById('btn-next-image');
      if (nextImgBtn) {
        nextImgBtn.addEventListener('click', () => {
          socket.emit('host:next-image', { lobbyCode });
        });
      }

      // Play Sound bind (Sound Guess)
      const playSoundBtn = document.getElementById('btn-play-sound');
      if (playSoundBtn) {
        playSoundBtn.addEventListener('click', () => {
          socket.emit('host:play-sound', { lobbyCode });
        });
      }

      // Next Sound bind (Sound Guess)
      const nextSoundBtn = document.getElementById('btn-next-sound');
      if (nextSoundBtn) {
        nextSoundBtn.addEventListener('click', () => {
          socket.emit('host:next-sound', { lobbyCode });
        });
      }

      // Sayışmaca: Start round for team A or B
      const sayABtn = document.getElementById('btn-sayismaca-A');
      if (sayABtn) {
        sayABtn.addEventListener('click', () => {
          socket.emit('host:start-sayismaca', { lobbyCode, activeTeam: 'A' });
        });
      }
      const sayBBtn = document.getElementById('btn-sayismaca-B');
      if (sayBBtn) {
        sayBBtn.addEventListener('click', () => {
          socket.emit('host:start-sayismaca', { lobbyCode, activeTeam: 'B' });
        });
      }
      // Sayışmaca: Next theme
      const nextThemeBtn = document.getElementById('btn-next-theme');
      if (nextThemeBtn) {
        nextThemeBtn.addEventListener('click', () => {
          socket.emit('host:next-theme', { lobbyCode });
        });
      }

      // Word Puzzle: Reveal individual letters
      if (stageKey === 'wordPuzzle') {
        const items = currentStage?.items || [];
        const word = items[state.currentQuestionIndex]?.word || '';
        Array.from(word).forEach((_, i) => {
          const btn = document.getElementById(`reveal-letter-${i}`);
          if (btn && !(state.revealedLetters || []).includes(i)) {
            btn.addEventListener('click', () => {
              socket.emit('host:reveal-letter', { lobbyCode, letterIndex: i });
            });
          }
        });

        const solvedABtn = document.getElementById('btn-word-solved-A');
        const solvedBBtn = document.getElementById('btn-word-solved-B');
        if (solvedABtn) solvedABtn.addEventListener('click', () => socket.emit('host:word-solved', { lobbyCode, winnerTeam: 'A' }));
        if (solvedBBtn) solvedBBtn.addEventListener('click', () => socket.emit('host:word-solved', { lobbyCode, winnerTeam: 'B' }));

        const nextWordBtn = document.getElementById('btn-next-word');
        if (nextWordBtn) nextWordBtn.addEventListener('click', () => socket.emit('host:next-word', { lobbyCode }));
      }

      // Map Guess bindings
      if (stageKey === 'mapGuess') {
        const revealHintBtn = document.getElementById('btn-reveal-map-hint');
        if (revealHintBtn) {
          revealHintBtn.addEventListener('click', () => {
            socket.emit('host:reveal-map-hint', { lobbyCode });
          });
        }
        const nextMapBtn = document.getElementById('btn-next-map');
        if (nextMapBtn) {
          nextMapBtn.addEventListener('click', () => {
            socket.emit('host:next-map', { lobbyCode });
          });
        }
      }

      // Next Stage bind
      document.getElementById('btn-next-stage').addEventListener('click', () => {
        socket.emit('host:next-stage', { lobbyCode });
      });

      // HP Override buttons bind
      document.querySelectorAll('.hp-override').forEach(btn => {
        btn.addEventListener('click', () => {
          const team = btn.dataset.team;
          const diff = btn.dataset.diff;
          socket.emit('host:override-hp', { lobbyCode, team, change: diff });
        });
      });
    };

    // Contestant (Player) Buzzer Screen
    const drawContestantBuzzerScreen = (stageKey) => {
      const state = lobby.gameState;
      const self = getSelfPlayer();
      if (!self) return;

      const currentStage = lobby.stages[stageKey];
      const isBuzzerActive = state.isBuzzerActive;
      const buzzedPlayer = state.buzzedPlayer;
      const hasFailed = state.failedTeams.includes(self.team);

      // Default visual statuses
      let buzzerClass = 'buzzer-circle-btn locked';
      let buzzerText = 'KİLİTLİ';
      let statusInfoText = 'Sunucunun lobi kilidini kaldırması bekleniyor...';

      if (isBuzzerActive) {
        if (hasFailed) {
          buzzerClass = 'buzzer-circle-btn locked';
          buzzerText = 'HATA ❌';
          statusInfoText = 'Bu tur yanlış tahmin yaptınız, buzzer kilitlendi.';
        } else {
          buzzerClass = 'buzzer-circle-btn active-glow';
          buzzerText = 'SPACE';
          statusInfoText = 'Buzzer aktif! SPACE tuşuna ilk basan cevap hakkı kazanır.';
        }
      } else if (buzzedPlayer) {
        const isBuzzedByMe = buzzedPlayer.userId === currentUser._id;
        const isBuzzedByMyTeam = buzzedPlayer.team === self.team;

        if (isBuzzedByMe) {
          buzzerClass = 'buzzer-circle-btn active-glow';
          buzzerText = 'CEVAPLA!';
          statusInfoText = 'Cevap hakkı sende! Şıkkı seç.';
        } else if (isBuzzedByMyTeam) {
          buzzerClass = 'buzzer-circle-btn locked';
          buzzerText = 'TAKIMIN BASTI';
          statusInfoText = 'Takım arkadaşın @' + buzzedPlayer.username + ' cevap veriyor.';
        } else {
          buzzerClass = 'buzzer-circle-btn locked';
          buzzerText = 'RAKİP BASTI';
          statusInfoText = 'Rakip takımdan @' + buzzedPlayer.username + ' cevap hakkı kazandı.';
        }
      }

      // Check if Multiple Choice questions are active
      if (stageKey === 'multipleChoice' || stageKey === 'finalDuel') {
        const questions = currentStage?.questions || [];
        const qIdx = state.currentQuestionIndex;

        if (qIdx < questions.length) {
          const q = questions[qIdx];
          const isMyTurn = buzzedPlayer && buzzedPlayer.userId === currentUser._id;
          const isGoldQuestion = stageKey === 'finalDuel' && qIdx === questions.length - 1;
          const stageNameLabel = stageKey === 'finalDuel' ? 'FİNAL DÜELLOSU' : 'ÇOKTAN SEÇMELİ';
          const goldBadge = isGoldQuestion ? `<span class="game-card-badge draft" style="font-size: 0.65rem; background: var(--color-error); box-shadow: var(--shadow-neon-purple); border-color: var(--color-accent-purple);">🏆 ALTIN SORU (${currentStage.lastQuestionMultiplier || 2}x Hasar!)</span>` : '';

          arenaRow.innerHTML = `
            <div class="glass-card" style="border: 1px solid var(--color-border); padding: var(--spacing-md); display: flex; flex-direction: column; gap: var(--spacing-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 8px;">
                <span style="font-family: var(--font-heading); font-size: 0.8rem; color: var(--color-text-muted);">${stageNameLabel} - SORU ${qIdx + 1} / ${questions.length}</span>
                <div style="display: flex; gap: 5px; align-items: center;">
                  ${goldBadge}
                  <span class="game-card-badge draft" style="font-size: 0.6rem;">${currentStage.timeLimit || 15} SN SÜRE</span>
                </div>
              </div>

              <!-- Question text -->
              <h2 style="font-family: var(--font-heading); font-size: 1.25rem; text-align: center; color: #ffffff; padding: var(--spacing-sm) 0;">
                ${q.question}
              </h2>

              <!-- Options Grid list -->
              <div class="option-btn-grid" style="margin-bottom: var(--spacing-sm);">
                ${q.options.map((opt, i) => {
                  const isSelectedByMe = i === state.selectedOptionIndex && isMyTurn;
                  const isSelectedByAnyone = i === state.selectedOptionIndex;
                  const activeClickClass = isMyTurn && state.selectedOptionIndex === null ? 'clickable-option' : '';
                  let styleClass = '';
                  
                  if (isSelectedByMe) styleClass = 'border: 2px solid var(--color-accent-blue); background: rgba(0, 240, 255, 0.1);';
                  else if (isSelectedByAnyone && buzzedPlayer) {
                    const col = buzzedPlayer.team === 'A' ? 'var(--color-accent-blue)' : 'var(--color-error)';
                    styleClass = `border: 2px solid ${col}; background: rgba(255,255,255,0.01);`;
                  }
                  
                  return `
                    <button class="game-option-btn ${activeClickClass}" data-idx="${i}" style="${styleClass}" ${(!isMyTurn || state.selectedOptionIndex !== null) ? 'disabled' : ''}>
                      <strong>${String.fromCharCode(65 + i)})</strong> ${opt}
                    </button>
                  `;
                }).join('')}
              </div>

              <!-- Large Buzzer circle status under the options -->
              <div style="display: flex; flex-direction: column; align-items: center; border-top: 1px solid var(--color-border); padding-top: var(--spacing-sm); gap: 10px;">
                ${isMyTurn && state.selectedOptionIndex === null
                  ? `<div style="font-weight: bold; color: var(--color-accent-blue); animation: blink 1.2s infinite; font-size: 0.85rem;">EKRANDAN BİR ŞIK SEÇİN!</div>`
                  : `<button id="contestant-buzzer-btn" class="${buzzerClass}" style="width: 80px; height: 80px; font-size: 0.65rem; border-width: 4px;">${buzzerText}</button>
                     <div style="font-size: 0.75rem; color: var(--color-text-muted); text-align: center;">${statusInfoText}</div>`
                }
              </div>
            </div>
          `;

          // Bind option click if it is my turn
          if (isMyTurn && state.selectedOptionIndex === null) {
            document.querySelectorAll('.clickable-option').forEach(btn => {
              btn.addEventListener('click', () => {
                const optIdx = parseInt(btn.dataset.idx);
                socket.emit('game:select-option', { lobbyCode, optionIndex: optIdx });
              });
            });
          } else {
            // Bind click to the buzzer button
            const buzzerBtn = document.getElementById('contestant-buzzer-btn');
            if (buzzerBtn) {
              buzzerBtn.addEventListener('click', () => {
                if (isBuzzerActive && !buzzedPlayer && !hasFailed) {
                  socket.emit('game:buzz', { lobbyCode });
                }
              });
            }
          }
          return;
        } else {
          const finishedLabel = stageKey === 'finalDuel' ? 'FİNAL DÜELLOSU TAMAMLANDI' : 'ÇOKTAN SEÇMELİ ETABI TAMAMLANDI';
          arenaRow.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: var(--spacing-xl);">
              <div style="font-size: 3rem; margin-bottom: 10px;">🏁</div>
              <h3 style="font-family: var(--font-heading); font-size: 1.1rem; color: #ffffff;">${finishedLabel}</h3>
              <p style="color: var(--color-text-muted); font-size: 0.8rem; margin-top: 5px;">
                Sunucunun bir sonraki etaba geçmesi bekleniyor...
              </p>
            </div>
          `;
          return;
        }
      }

      // ── Image Guess Stage: Contestant Screen ──
      if (stageKey === 'imageGuess') {
        const items = currentStage?.items || [];
        const qIdx = state.currentQuestionIndex;
        const revealStep = state.currentRevealStep ?? 0;
        const totalSteps = parseInt(currentStage?.steps || 5);
        const effect = currentStage?.revealEffect || 'blur';

        if (qIdx < items.length) {
          const item = items[qIdx];
          const progress = Math.min(revealStep / totalSteps, 1);
          let filterStyle = '';
          if (effect === 'blur') {
            const blurPx = Math.round((1 - progress) * 30);
            filterStyle = `filter: blur(${blurPx}px);`;
          } else if (effect === 'pixel') {
            const pixelSize = Math.max(1, Math.round((1 - progress) * 20));
            filterStyle = `filter: blur(${pixelSize}px); image-rendering: pixelated;`;
          }

          arenaRow.innerHTML = `
            <div class="glass-card" style="border: 1px solid var(--color-border); padding: var(--spacing-md); display: flex; flex-direction: column; gap: var(--spacing-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 8px;">
                <span style="font-family: var(--font-heading); font-size: 0.8rem; color: var(--color-text-muted);">GÖRSEL TAHMİN - GÖRSEL ${qIdx + 1} / ${items.length}</span>
                <span style="font-size: 0.75rem; color: var(--color-accent-blue); font-family: var(--font-heading);">ADIM ${revealStep} / ${totalSteps}</span>
              </div>

              <!-- Revealing image -->
              <div class="reveal-image-wrap" style="margin: 0 auto; max-width: 500px;">
                <img id="contestant-reveal-img" src="${item.imageUrl}" style="${filterStyle}" />
                ${effect === 'puzzle' ? `<div class="puzzle-grid-overlay" id="contestant-puzzle-overlay" style="grid-template-columns: repeat(5,1fr); grid-template-rows: repeat(4,1fr);"></div>` : ''}
                <div class="reveal-step-info">${effect.toUpperCase()}</div>
              </div>

              <!-- Buzzer below image -->
              <div style="display: flex; flex-direction: column; align-items: center; border-top: 1px solid var(--color-border); padding-top: var(--spacing-sm); gap: 10px;">
                <button id="contestant-buzzer-btn" class="${buzzerClass}" style="width: 100px; height: 100px; font-size: 0.75rem; border-width: 5px;">${buzzerText}</button>
                <div style="font-size: 0.75rem; color: var(--color-text-muted); text-align: center;">${statusInfoText}</div>
                <div style="font-size: 0.7rem; color: var(--color-text-muted);">Cevabınızı sözlü olarak söyleyin. SPACE tuşuyla da buzzer'a basabilirsiniz.</div>
              </div>
            </div>
          `;

          // Puzzle overlay
          if (effect === 'puzzle') {
            const overlay = document.getElementById('contestant-puzzle-overlay');
            if (overlay) {
              const cols = 5, rows = 4, total = cols * rows;
              overlay.innerHTML = Array.from({ length: total }, (_, i) => `<div class="puzzle-tile" data-idx="${i}"></div>`).join('');
              const tiles = overlay.querySelectorAll('.puzzle-tile');
              const revealCount = Math.round(progress * total);
              const indices = [...Array(total).keys()];
              indices.sort((a, b) => ((a * 7 + 3) % total) - ((b * 7 + 3) % total));
              indices.slice(0, revealCount).forEach(i => tiles[i]?.classList.add('revealed'));
            }
          }

          const buzzerBtn = document.getElementById('contestant-buzzer-btn');
          if (buzzerBtn) {
            buzzerBtn.addEventListener('click', () => {
              if (isBuzzerActive && !buzzedPlayer && !hasFailed) {
                socket.emit('game:buzz', { lobbyCode });
              }
            });
          }
          return;
        } else {
          arenaRow.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: var(--spacing-xl);">
              <div style="font-size: 3rem; margin-bottom: 10px;">🏁</div>
              <h3 style="font-family: var(--font-heading); font-size: 1.1rem; color: #ffffff;">GÖRSEL TAHMİN ETABI TAMAMLANDI</h3>
              <p style="color: var(--color-text-muted); font-size: 0.8rem; margin-top: 5px;">
                Sunucunun bir sonraki etaba geçmesi bekleniyor...
              </p>
            </div>
          `;
          return;
        }
      }

      // ── Sound Guess Stage: Contestant Screen ──
      if (stageKey === 'soundGuess') {
        const items = currentStage?.items || [];
        const qIdx = state.currentQuestionIndex;
        const soundStep = state.soundPlayStep ?? 0;
        const playMode = currentStage?.playMode || 'gradual';

        if (qIdx < items.length) {
          const item = items[qIdx];
          const playedSec = soundStep * 5;
          const hasPlayed = soundStep > 0;

          arenaRow.innerHTML = `
            <div class="glass-card" style="border: 1px solid var(--color-border); padding: var(--spacing-md); display: flex; flex-direction: column; gap: var(--spacing-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 8px;">
                <span style="font-family: var(--font-heading); font-size: 0.8rem; color: var(--color-text-muted);">SES TAHMİN - SES ${qIdx + 1} / ${items.length}</span>
                <span style="font-size: 0.75rem; color: ${hasPlayed ? 'var(--color-accent-blue)' : 'var(--color-text-muted)'}; font-family: var(--font-heading);">${hasPlayed ? `${playedSec}sn ÇALINDI` : 'BEKLENIYOR...'}</span>
              </div>

              <!-- Sound wave visual -->
              <div style="display: flex; flex-direction: column; align-items: center; gap: var(--spacing-sm); padding: var(--spacing-md) 0;">
                <div style="font-size: 4rem;">${hasPlayed ? '🎵' : '🔇'}</div>
                <div id="sound-wave-bars" style="display: flex; gap: 4px; align-items: center; height: 48px;">
                  ${Array.from({ length: 16 }, (_, i) => {
                    const h = hasPlayed ? (20 + Math.abs(Math.sin(i * 0.8 + soundStep)) * 30) : 6;
                    return `<div style="width: 6px; height: ${h}px; background: ${hasPlayed ? 'var(--color-accent-blue)' : 'var(--color-border)'}; border-radius: 3px; transition: height 0.3s ease;"></div>`;
                  }).join('')}
                </div>
                <div style="font-size: 0.75rem; color: var(--color-text-muted); text-align: center;">
                  ${hasPlayed ? 'Ses çalınıyor — tahmin ettiğinizde SPACE tuşuna basın!' : 'Sunucu sesi çalmaya başlayana kadar bekleyin...'}
                </div>
              </div>

              <!-- Hidden audio to play on client side too -->
              <audio id="contestant-audio-player" src="${item.audioUrl}" style="display:none;"></audio>

              <!-- Buzzer -->
              <div style="display: flex; flex-direction: column; align-items: center; border-top: 1px solid var(--color-border); padding-top: var(--spacing-sm); gap: 10px;">
                <button id="contestant-buzzer-btn" class="${buzzerClass}" style="width: 110px; height: 110px; font-size: 0.75rem; border-width: 5px;" ${!hasPlayed ? 'disabled style="opacity:0.4;cursor:not-allowed;"' : ''}>${buzzerText}</button>
                <div style="font-size: 0.75rem; color: var(--color-text-muted); text-align: center;">${statusInfoText}</div>
              </div>
            </div>
          `;

          // Auto-play audio segment on contestant side too when soundStep > 0
          if (hasPlayed) {
            const audioEl = document.getElementById('contestant-audio-player');
            if (audioEl) {
              audioEl.currentTime = 0;
              audioEl.play().catch(() => {});
              if (playMode === 'gradual') {
                setTimeout(() => audioEl.pause(), playedSec * 1000);
              }
            }
          }

          const buzzerBtn = document.getElementById('contestant-buzzer-btn');
          if (buzzerBtn && hasPlayed) {
            buzzerBtn.addEventListener('click', () => {
              if (isBuzzerActive && !buzzedPlayer && !hasFailed) {
                socket.emit('game:buzz', { lobbyCode });
              }
            });
          }
          return;
        } else {
          arenaRow.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: var(--spacing-xl);">
              <div style="font-size: 3rem; margin-bottom: 10px;">🏁</div>
              <h3 style="font-family: var(--font-heading); font-size: 1.1rem; color: #ffffff;">SES TAHMİN ETABI TAMAMLANDI</h3>
              <p style="color: var(--color-text-muted); font-size: 0.8rem; margin-top: 5px;">
                Sunucunun bir sonraki etaba geçmesi bekleniyor...
              </p>
            </div>
          `;
          return;
        }
      }

      // ── Sayişmaca Stage: Contestant Screen ──
      if (stageKey === 'sayismaca') {
        const items = currentStage?.items || [];
        const qIdx = state.currentQuestionIndex;
        const countdownTime = currentStage?.countdownTime || 30;
        const isRunning = state.sayismacaRunning;
        const activeTeam = state.sayismacaActiveTeam;

        if (qIdx < items.length) {
          const item = items[qIdx];
          const self = getSelfPlayer();
          const isMyTeamActive = self && activeTeam === self.team;
          const teamColor = activeTeam === 'A' ? 'var(--color-accent-blue)' : 'var(--color-error)';
          const teamLabel = activeTeam === 'A' ? '🔵 MAVİ TAKIM' : '🔴 KIRMIZI TAKIM';

          arenaRow.innerHTML = `
            <div class="glass-card" style="border: 1px solid var(--color-border); padding: var(--spacing-md); display: flex; flex-direction: column; gap: var(--spacing-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 8px;">
                <span style="font-family: var(--font-heading); font-size: 0.8rem; color: var(--color-text-muted);">SAYIŞMACA - TEMA ${qIdx + 1} / ${items.length}</span>
                <span id="contestant-sayismaca-timer" style="font-size: 1.1rem; font-weight: 800; font-family: var(--font-heading); color: ${isRunning ? 'var(--color-error)' : 'var(--color-text-muted)'};">⏱ ${countdownTime}s</span>
              </div>

              <!-- Theme name (hidden until started) -->
              <div style="text-align: center; padding: 20px; background: rgba(0,240,255,0.03); border: 1px solid rgba(0,240,255,0.15); border-radius: var(--radius-md);">
                <div style="font-size: 0.65rem; text-transform: uppercase; letter-spacing: 2px; color: var(--color-text-muted); margin-bottom: 8px;">AKTİF TEMA</div>
                ${isRunning
                  ? `<div style="font-size: 1.6rem; font-weight: 800; font-family: var(--font-heading); color: #ffffff;">${item.theme}</div>`
                  : `<div style="font-size: 1.1rem; color: var(--color-text-muted); font-style: italic;">Sunucu turu başlatana kadar bekleyin...</div>`
                }
              </div>

              ${isRunning ? `
                <!-- Active team indicator -->
                <div style="text-align: center; padding: 10px; border-radius: var(--radius-md); background: rgba(255,255,255,0.02); border: 1px dashed ${teamColor};">
                  <span style="color: ${teamColor}; font-weight: bold; font-family: var(--font-heading); font-size: 1rem;">${teamLabel} SAYIYOR!</span>
                  ${isMyTeamActive
                    ? `<div style="color: var(--color-success); font-size: 0.8rem; margin-top: 5px; font-weight: bold;">🎙️ SEN SAYIYORSUN — Hızlı ol!</div>`
                    : `<div style="color: var(--color-text-muted); font-size: 0.75rem; margin-top: 5px;">Rakip takım sayıyor, hazırda bekle.</div>`
                  }
                </div>

                <!-- Wave animation bars for active team -->
                <div style="display: flex; justify-content: center; gap: 4px; align-items: flex-end; height: 40px;">
                  ${Array.from({ length: 12 }, (_, i) => `
                    <div style="
                      width: 7px;
                      border-radius: 4px;
                      background: ${isMyTeamActive ? 'var(--color-success)' : teamColor};
                      animation: sayismacaBar 0.6s ease infinite alternate;
                      animation-delay: ${i * 0.05}s;
                      height: ${14 + Math.abs(Math.sin(i)) * 26}px;
                    "></div>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          `;

          // Live countdown on contestant side
          if (isRunning) {
            let remainingSec = countdownTime;
            const timerEl = document.getElementById('contestant-sayismaca-timer');
            if (window._contestantSayTimer) clearInterval(window._contestantSayTimer);
            window._contestantSayTimer = setInterval(() => {
              remainingSec--;
              if (timerEl) timerEl.innerText = `⏱ ${remainingSec}s`;
              if (remainingSec <= 0) {
                clearInterval(window._contestantSayTimer);
                if (timerEl) timerEl.innerText = '⏱ SÜRE DOLDU!';
              }
            }, 1000);
          }
          return;
        } else {
          arenaRow.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: var(--spacing-xl);">
              <div style="font-size: 3rem; margin-bottom: 10px;">🏁</div>
              <h3 style="font-family: var(--font-heading); font-size: 1.1rem; color: #ffffff;">SAYIŞMACA ETABI TAMAMLANDI</h3>
              <p style="color: var(--color-text-muted); font-size: 0.8rem; margin-top: 5px;">
                Sunucunun bir sonraki etaba geçmesi bekleniyor...
              </p>
            </div>
          `;
          return;
        }
      }

      // ── Word Puzzle Stage: Contestant Screen ──
      if (stageKey === 'wordPuzzle') {
        const items = currentStage?.items || [];
        const qIdx = state.currentQuestionIndex;
        const revealed = state.revealedLetters || [];
        const wordSolved = state.wordSolved;
        const wordSolvedByTeam = state.wordSolvedByTeam;

        if (qIdx < items.length) {
          const item = items[qIdx];
          const word = item.word || '';
          const teamColor = wordSolvedByTeam === 'A' ? 'var(--color-accent-blue)' : 'var(--color-error)';
          const teamLabel = wordSolvedByTeam === 'A' ? '🔵 Mavi Takım' : '🔴 Kırmızı Takım';

          arenaRow.innerHTML = `
            <div class="glass-card" style="border: 1px solid var(--color-border); padding: var(--spacing-md); display: flex; flex-direction: column; gap: var(--spacing-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 8px;">
                <span style="font-family: var(--font-heading); font-size: 0.8rem; color: var(--color-text-muted);">KELİME BULMACA - KELİME ${qIdx + 1} / ${items.length}</span>
                <span style="font-size: 0.75rem; color: var(--color-accent-purple); font-family: var(--font-heading);">${revealed.length} / ${word.length} Harf</span>
              </div>

              <!-- Hint -->
              <div style="text-align: center; font-size: 0.85rem; color: var(--color-text-muted); padding: 8px; background: rgba(0,240,255,0.02); border-radius: var(--radius-sm);">
                <strong style="color: var(--color-accent-blue);">İPUCU:</strong> ${item.hint}
              </div>

              <!-- Masked word letter slots -->
              <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; padding: var(--spacing-sm) 0;">
                ${Array.from(word).map((letter, i) => {
                  const isRevealed = revealed.includes(i);
                  return `<div style="
                    width: 40px; height: 46px;
                    display: flex; align-items: center; justify-content: center;
                    font-size: 1.3rem; font-weight: 900;
                    font-family: var(--font-heading);
                    border-bottom: 3px solid ${isRevealed ? 'var(--color-success)' : 'rgba(180,60,255,0.5)'};
                    color: ${isRevealed ? 'var(--color-success)' : 'rgba(255,255,255,0.15)'};
                    background: ${isRevealed ? 'rgba(0,255,136,0.06)' : 'rgba(180,60,255,0.04)'};
                    border-radius: 4px 4px 0 0;
                    transition: all 0.4s ease;
                  ">${isRevealed ? letter : ''}</div>`;
                }).join('')}
              </div>

              ${wordSolved ? `
                <!-- Word solved banner -->
                <div style="text-align:center; padding: 14px; background: rgba(0,255,136,0.06); border: 1px solid rgba(0,255,136,0.2); border-radius: var(--radius-md);">
                  <div style="font-size: 1.8rem; margin-bottom: 6px;">🏆</div>
                  <div style="font-family: var(--font-heading); font-weight: bold; color: var(--color-success); font-size: 1rem;">KELİME BULUNDU!</div>
                  <div style="color: ${teamColor}; font-size: 0.85rem; margin-top: 4px;">${teamLabel} doğru bildi!</div>
                </div>
              ` : `
                <!-- Buzzer to answer -->
                <div style="display: flex; flex-direction: column; align-items: center; border-top: 1px solid var(--color-border); padding-top: var(--spacing-sm); gap: 10px;">
                  <button id="contestant-buzzer-btn" class="${buzzerClass}" style="width: 100px; height: 100px; font-size: 0.75rem; border-width: 5px;">${buzzerText}</button>
                  <div style="font-size: 0.75rem; color: var(--color-text-muted); text-align: center;">${statusInfoText}</div>
                  <div style="font-size: 0.7rem; color: var(--color-text-muted);">Harf veya kelime tahmin etmek için SPACE tuşuna basın.</div>
                </div>
              `}
            </div>
          `;

          if (!wordSolved) {
            const buzzerBtn = document.getElementById('contestant-buzzer-btn');
            if (buzzerBtn) {
              buzzerBtn.addEventListener('click', () => {
                if (isBuzzerActive && !buzzedPlayer && !hasFailed) {
                  socket.emit('game:buzz', { lobbyCode });
                }
              });
            }
          }
          return;
        } else {
          arenaRow.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: var(--spacing-xl);">
              <div style="font-size: 3rem; margin-bottom: 10px;">🏁</div>
              <h3 style="font-family: var(--font-heading); font-size: 1.1rem; color: #ffffff;">KELİME BULMACA TAMAMLANDI</h3>
              <p style="color: var(--color-text-muted); font-size: 0.8rem; margin-top: 5px;">Sunucunun bir sonraki etaba geçmesi bekleniyor...</p>
            </div>
          `;
          return;
        }
      }

      // ── Map Guess Stage: Contestant Screen ──
      if (stageKey === 'mapGuess') {
        const items = currentStage?.items || [];
        const qIdx = state.currentQuestionIndex;
        const hintRevealed = state.mapHintRevealed;

        if (qIdx < items.length) {
          const item = items[qIdx];
          arenaRow.innerHTML = `
            <div class="glass-card" style="border: 1px solid var(--color-border); padding: var(--spacing-md); display: flex; flex-direction: column; gap: var(--spacing-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 8px;">
                <span style="font-family: var(--font-heading); font-size: 0.8rem; color: var(--color-text-muted);">HARİTA TAHMİN - HARİTA ${qIdx + 1} / ${items.length}</span>
                <span style="font-size: 0.75rem; color: var(--color-accent-blue); font-family: var(--font-heading);">${currentStage.damage || 10} HASAR</span>
              </div>

              <!-- Map Image -->
              <div style="position: relative; width: 100%; max-width: 500px; max-height: 280px; overflow: hidden; border-radius: var(--radius-md); border: 1px solid var(--color-border); background: #0a0a0a; margin: 0 auto;">
                <img src="${item.imageUrl}" style="width: 100%; height: 100%; max-height: 280px; object-fit: contain; display: block;" />
              </div>

              <!-- Hint displayed only if revealed by host -->
              ${hintRevealed && item.hint ? `
                <div style="text-align: center; font-size: 0.85rem; color: var(--color-text-muted); padding: 8px; background: rgba(0,240,255,0.03); border-radius: var(--radius-sm); border: 1px solid rgba(0,240,255,0.1);">
                  <strong style="color: var(--color-accent-blue);">İPUCU:</strong> ${item.hint}
                </div>
              ` : `
                <div style="text-align: center; font-size: 0.75rem; color: var(--color-text-muted); font-style: italic;">
                  İpucu kilitli (Sunucunun ipucunu göstermesi beklenebilir)
                </div>
              `}

              <!-- Buzzer -->
              <div style="display: flex; flex-direction: column; align-items: center; border-top: 1px solid var(--color-border); padding-top: var(--spacing-sm); gap: 10px;">
                <button id="contestant-buzzer-btn" class="${buzzerClass}" style="width: 100px; height: 100px; font-size: 0.75rem; border-width: 5px;">${buzzerText}</button>
                <div style="font-size: 0.75rem; color: var(--color-text-muted); text-align: center;">${statusInfoText}</div>
                <div style="font-size: 0.7rem; color: var(--color-text-muted);">Cevabınızı sözlü olarak söyleyin. SPACE tuşuyla da buzzer'a basabilirsiniz.</div>
              </div>
            </div>
          `;

          const buzzerBtn = document.getElementById('contestant-buzzer-btn');
          if (buzzerBtn) {
            buzzerBtn.addEventListener('click', () => {
              if (isBuzzerActive && !buzzedPlayer && !hasFailed) {
                socket.emit('game:buzz', { lobbyCode });
              }
            });
          }
          return;
        } else {
          arenaRow.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: var(--spacing-xl);">
              <div style="font-size: 3rem; margin-bottom: 10px;">🏁</div>
              <h3 style="font-family: var(--font-heading); font-size: 1.1rem; color: #ffffff;">HARİTA TAHMİN ETABI TAMAMLANDI</h3>
              <p style="color: var(--color-text-muted); font-size: 0.8rem; margin-top: 5px;">Sunucunun bir sonraki etaba geçmesi bekleniyor...</p>
            </div>
          `;
          return;
        }
      }

      // Generic layout fallback for placeholders
      arenaRow.innerHTML = `
        <div class="glass-card" style="border: 1px solid var(--color-border); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--spacing-xl); gap: var(--spacing-lg);">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 15px;">
            <button id="contestant-buzzer-btn" class="${buzzerClass}">
              ${buzzerText}
            </button>
            <div style="font-family: var(--font-heading); font-size: 0.9rem; letter-spacing: 0.5px; color: #ffffff; text-align: center; margin-top: 10px;">
              ${statusInfoText}
            </div>
          </div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); border-top: 1px solid var(--color-border); padding-top: 15px; width: 100%; text-align: center;">
            Klavye üzerindeki <strong>SPACE (Boşluk)</strong> tuşuna basarak da buzzer'ı tetikleyebilirsiniz.
          </div>
        </div>
      `;

      const buzzerBtn = document.getElementById('contestant-buzzer-btn');
      if (buzzerBtn) {
        buzzerBtn.addEventListener('click', () => {
          if (isBuzzerActive && !buzzedPlayer && !hasFailed) {
            socket.emit('game:buzz', { lobbyCode });
          }
        });
      }
    };

    // Socket Event Bindings
    socket.on('connect', () => {
      socket.emit('player:join', { lobbyCode, user: currentUser });
    });

    socket.on('host:created', (retrievedLobby) => {
      lobby = retrievedLobby;
      isHost = true;
      updateHPBars();
      drawArena();
    });

    socket.on('player:joined', (retrievedLobby) => {
      lobby = retrievedLobby;
      isHost = false;
      updateHPBars();
      drawArena();
    });

    socket.on('lobby:updated', (retrievedLobby) => {
      lobby = retrievedLobby;
      updateHPBars();
      drawArena();
    });

    socket.on('game:buzzed', (data) => {
      if (!lobby) return;
      lobby.gameState.isBuzzerActive = data.isBuzzerActive;
      lobby.gameState.buzzedPlayer = data.buzzedPlayer;
      drawArena();
    });

    socket.on('game:option-selected', (data) => {
      if (!lobby) return;
      lobby.gameState.selectedOptionIndex = data.selectedOptionIndex;
      drawArena();
    });

    socket.on('game:reveal-step', (data) => {
      if (!lobby) return;
      lobby.gameState.currentRevealStep = data.currentRevealStep;
      drawArena();
    });

    socket.on('game:play-sound', (data) => {
      if (!lobby) return;
      lobby.gameState.soundPlayStep = data.soundPlayStep;
      drawArena();
    });

    socket.on('game:sayismaca-started', (data) => {
      if (!lobby) return;
      lobby.gameState.sayismacaActiveTeam = data.activeTeam;
      lobby.gameState.sayismacaRunning = true;
      drawArena();
    });

    socket.on('game:letter-revealed', (data) => {
      if (!lobby) return;
      lobby.gameState.revealedLetters = data.revealedLetters;
      drawArena();
    });

    socket.on('game:map-hint-revealed', (data) => {
      if (!lobby) return;
      lobby.gameState.mapHintRevealed = data.mapHintRevealed;
      drawArena();
    });

    socket.on('game:question-changed', (data) => {
      if (!lobby) return;
      lobby.gameState.currentQuestionIndex = data.currentQuestionIndex;
      lobby.gameState = data.gameState;
      drawArena();
    });

    socket.on('game:buzzer-state', (data) => {
      if (!lobby) return;
      lobby.gameState.isBuzzerActive = data.isBuzzerActive;
      lobby.gameState.buzzedPlayer = data.buzzedPlayer;
      lobby.gameState.failedTeams = data.failedTeams;
      drawArena();
    });

    socket.on('game:state-updated', (gameState) => {
      if (!lobby) return;
      lobby.gameState = gameState;
      updateHPBars();
      drawArena();
    });

    socket.on('game:stage-changed', (data) => {
      if (!lobby) return;
      lobby.gameState.activeStageIndex = data.activeStageIndex;
      lobby.gameState = data.gameState;
      updateHPBars();
      drawArena();
    });

    socket.on('game:finished', (data) => {
      window.location.hash = `#results?id=${data.historyId}`;
    });

    socket.on('game:paused', () => {
      if (!lobby) return;
      lobby.gameState.isPaused = true;
      drawArena();
    });

    socket.on('game:resumed', () => {
      if (!lobby) return;
      lobby.gameState.isPaused = false;
      drawArena();
    });

    socket.on('lobby:destroyed', (data) => {
      alert(data.message || 'Oyun bağlantısı koptu.');
      window.location.hash = '#dashboard';
    });

    socket.on('error', (err) => {
      alert(err.message || 'Soket hatası.');
      window.location.hash = '#dashboard';
    });

    // Handle initial join/reconnect action
    if (!socket.connected) {
      socket.connect();
    } else {
      socket.emit('player:join', { lobbyCode, user: currentUser });
    }
  },

  destroy: () => {
    console.log('Game Screen destroyed');
    
    // Clean up keyboard listener
    if (gameScreen._keydownListener) {
      window.removeEventListener('keydown', gameScreen._keydownListener);
      gameScreen._keydownListener = null;
    }
    
    // Clean up socket event listeners
    const socket = connectSocket();
    socket.off('connect');
    socket.off('host:created');
    socket.off('player:joined');
    socket.off('lobby:updated');
    socket.off('game:buzzed');
    socket.off('game:buzzer-state');
    socket.off('game:state-updated');
    socket.off('game:stage-changed');
    socket.off('game:finished');
    socket.off('game:paused');
    socket.off('game:resumed');
    socket.off('lobby:destroyed');
    socket.off('error');
    
    // Disconnect
    disconnectSocket();
  }
};

export default gameScreen;
