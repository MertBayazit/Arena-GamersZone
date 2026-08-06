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
          <div class="glass-card" style="border: 1px solid rgba(0, 180, 255, 0.2); padding: 12px; display: flex; flex-direction: column; gap: 8px;">
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
          <div class="glass-card" style="border: 1px solid rgba(255, 51, 102, 0.2); padding: 12px; display: flex; flex-direction: column; gap: 8px;">
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
                <div class="game-card-badge published" style="font-size: 0.6rem;">SUNUCU</div>
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
              ${(stageKey === 'multipleChoice' && currentStage?.questions && state.currentQuestionIndex < currentStage.questions.length - 1)
                ? `<button id="btn-next-question" class="btn btn-secondary" style="width: 100%; padding: 0.8rem; margin-bottom: 8px; border-color: var(--color-accent-blue); color: #ffffff;">SONRAKİ SORU ➡️</button>`
                : ''
              }
              <button id="btn-next-stage" class="btn btn-secondary" style="width: 100%; padding: 0.8rem; box-shadow: var(--shadow-neon-purple); border-color: var(--color-accent-purple); color: #ffffff;">
                SONRAKİ ETAP 🏁
              </button>
            </div>
          </div>

        </div>
      `;

      // Render Stage Specific Question on Host screen
      const hostStageContentBox = document.getElementById('host-stage-content-box');
      if (stageKey === 'multipleChoice') {
        const questions = currentStage?.questions || [];
        const qIdx = state.currentQuestionIndex;

        if (qIdx < questions.length) {
          const q = questions[qIdx];
          hostStageContentBox.innerHTML = `
            <div style="margin-bottom: 12px; font-weight: 600; font-size: 0.95rem; font-family: var(--font-heading); color: var(--color-text-muted);">
              SORU ${qIdx + 1} / ${questions.length}
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
          hostStageContentBox.innerHTML = `
            <div class="empty-state" style="border: 1px dashed var(--color-border); padding: var(--spacing-md);">
              🏁 Çoktan Seçmeli etabındaki tüm sorular tamamlandı! Sonraki etaba geçebilirsiniz.
            </div>
          `;
        }
      }

      // Event handlers bind
      if (hasBuzzed) {
        document.getElementById('btn-correct').addEventListener('click', () => {
          const dmg = currentStage?.damagePerQuestion || currentStage?.damage || 10;
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
      if (stageKey === 'multipleChoice') {
        const questions = currentStage?.questions || [];
        const qIdx = state.currentQuestionIndex;

        if (qIdx < questions.length) {
          const q = questions[qIdx];
          const isMyTurn = buzzedPlayer && buzzedPlayer.userId === currentUser._id;
          
          arenaRow.innerHTML = `
            <div class="glass-card" style="border: 1px solid var(--color-border); padding: var(--spacing-md); display: flex; flex-direction: column; gap: var(--spacing-md);">
              <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--color-border); padding-bottom: 8px;">
                <span style="font-family: var(--font-heading); font-size: 0.8rem; color: var(--color-text-muted);">ÇOKTAN SEÇMELİ - SORU ${qIdx + 1} / ${questions.length}</span>
                <span class="game-card-badge draft" style="font-size: 0.6rem;">${currentStage.timeLimit || 15} SN SÜRE</span>
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
          arenaRow.innerHTML = `
            <div class="glass-card" style="text-align: center; padding: var(--spacing-xl);">
              <div style="font-size: 3rem; margin-bottom: 10px;">🏁</div>
              <h3 style="font-family: var(--font-heading); font-size: 1.1rem; color: #ffffff;">ÇOKTAN SEÇMELİ ETABI TAMAMLANDI</h3>
              <p style="color: var(--color-text-muted); font-size: 0.8rem; margin-top: 5px;">
                Sunucunun bir sonraki etaba geçmesi bekleniyor...
              </p>
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
    socket.off('lobby:destroyed');
    socket.off('error');
    
    // Disconnect
    disconnectSocket();
  }
};

export default gameScreen;
