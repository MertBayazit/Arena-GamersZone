import { apiCall } from '../api';

const stageNames = {
  multipleChoice: { name: 'Çoktan Seçmeli', icon: '🧠' },
  imageGuess: { name: 'Görsel Tahmin', icon: '🖼️' },
  soundGuess: { name: 'Ses Tahmin', icon: '🎵' },
  sayismaca: { name: 'Sayışmaca', icon: '🎯' },
  wordPuzzle: { name: 'Kelime Bulmaca', icon: '🧩' },
  mapGuess: { name: 'Harita Tahmin', icon: '🗺️' },
  finalDuel: { name: 'Final Düellosu', icon: '🏆' }
};

export const publicLibraryScreen = {
  render: async (container) => {
    let allGames = [];
    let filteredGames = [];

    // Header layout and structures
    container.innerHTML = `
      <div class="container" style="padding-top: var(--spacing-lg); padding-bottom: var(--spacing-lg);">
        
        <!-- Header -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-lg);">
          <div>
            <h1 class="text-gradient" style="font-family: var(--font-heading); font-size: 2rem; letter-spacing: 2px;">GENEL KÜTÜPHANE</h1>
            <p style="color: var(--color-text-muted); font-size: 0.85rem; margin-top: 5px;">
              Diğer oyuncuların yayınladığı hazır bilgi yarışmalarını inceleyin ve kendi kütüphanenize kopyalayın!
            </p>
          </div>
          <button class="btn btn-secondary" onclick="window.location.hash='#dashboard'" style="padding: 0.6rem 1.2rem; font-size: 0.8rem;">
            ANASAYFAYA DÖN
          </button>
        </div>

        <!-- Alert Bar -->
        <div id="lib-alert" class="alert" style="display: none; padding: 0.5rem 1rem; margin-bottom: 20px;"></div>

        <!-- Filter & Search Bar -->
        <div class="glass-card" style="padding: var(--spacing-md); margin-bottom: var(--spacing-lg); display: flex; gap: var(--spacing-md); flex-wrap: wrap; align-items: center; border: 1px solid var(--color-border);">
          <div style="flex: 1; min-width: 250px; position: relative;">
            <input type="text" id="lib-search" class="form-input" placeholder="Oyun adı veya yapımcı ara..." style="padding: 0.7rem 1.1rem;" />
          </div>
          
          <div style="width: 180px;">
            <select id="lib-filter-format" class="form-input" style="padding: 0.7rem 1.1rem;">
              <option value="all">Tüm Formatlar</option>
              <option value="1v1">1v1 Formatı</option>
              <option value="2v2">2v2 Formatı</option>
            </select>
          </div>
        </div>

        <!-- Games Grid -->
        <div id="lib-games-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: var(--spacing-lg);">
          <!-- Spinner initially -->
          <div style="grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: var(--spacing-xl);">
            <div class="spinner" style="width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1); border-left-color: var(--color-accent-purple); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 15px;"></div>
            <p style="color: var(--color-text-muted); font-size: 0.85rem;">Yayınlanmış oyunlar yükleniyor...</p>
          </div>
        </div>

      </div>
    `;

    const alertBar = document.getElementById('lib-alert');
    const searchInput = document.getElementById('lib-search');
    const formatFilter = document.getElementById('lib-filter-format');
    const gamesGrid = document.getElementById('lib-games-grid');

    const showAlert = (message, type = 'success') => {
      alertBar.innerText = message;
      alertBar.className = `alert alert-${type}`;
      alertBar.style.display = 'flex';
      setTimeout(() => {
        alertBar.style.display = 'none';
      }, 4000);
    };

    // Load Games from backend
    try {
      allGames = await apiCall('/games/public');
      filteredGames = [...allGames];
      renderGames();
    } catch (err) {
      console.error(err);
      gamesGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: var(--spacing-xl); color: var(--color-error); border: 1px dashed var(--color-error); border-radius: var(--radius-md);">
          Oyunlar yüklenirken bir hata oluştu: ${err.message}
        </div>
      `;
    }

    // Render list of games
    function renderGames() {
      gamesGrid.innerHTML = '';

      if (filteredGames.length === 0) {
        gamesGrid.innerHTML = `
          <div style="grid-column: 1 / -1; text-align: center; padding: var(--spacing-xl); border: 1px dashed var(--color-border); border-radius: var(--radius-md);">
            <div style="font-size: 2.5rem; margin-bottom: 10px;">🔍</div>
            <h4 style="font-family: var(--font-heading); font-size: 1rem; margin-bottom: 5px;">HİÇBİR OYUN BULUNAMADI</h4>
            <p style="color: var(--color-text-muted); font-size: 0.8rem;">Arama kriterlerinizi değiştirmeyi deneyebilirsiniz.</p>
          </div>
        `;
        return;
      }

      filteredGames.forEach(game => {
        const card = document.createElement('div');
        card.className = 'glass-card game-card';
        card.style.cssText = 'display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--color-border); padding: var(--spacing-md);';

        const stagesCount = game.settings?.stageOrder?.length || 0;
        const stagesBadges = (game.settings?.stageOrder || []).map(key => {
          const info = stageNames[key];
          return info ? `<span title="${info.name}" style="font-size: 1.1rem; cursor: help;">${info.icon}</span>` : '';
        }).join(' ');

        card.innerHTML = `
          <div>
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
              <span class="game-card-badge published" style="font-size: 0.65rem;">${game.settings?.playerFormat || '2v2'} FORMATI</span>
              <span style="font-size: 0.7rem; color: var(--color-text-muted); font-weight: 500;">❤️ ${game.settings?.startingHP || 300} HP</span>
            </div>
            
            <h3 style="font-family: var(--font-heading); font-size: 1.1rem; margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${game.title}">
              ${game.title}
            </h3>

            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: var(--spacing-md);">
              Yapımcı: <span style="color: #ffffff; font-weight: 600;">@${game.creatorId?.username || 'Bilinmeyen'}</span>
            </div>

            <div style="border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px; margin-bottom: var(--spacing-md);">
              <div style="font-size: 0.7rem; color: var(--color-text-muted); margin-bottom: 5px;">Etaplar (${stagesCount}):</div>
              <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                ${stagesBadges || '<span style="font-size: 0.75rem; color: var(--color-text-muted);">Etap eklenmemiş</span>'}
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 8px; border-top: 1px solid var(--color-border); padding-top: 12px; margin-top: auto;">
            <button class="btn btn-secondary inspect-btn" style="flex: 1; padding: 0.5rem; font-size: 0.75rem;">DETAY</button>
            <button class="btn btn-primary clone-btn" style="flex: 1; padding: 0.5rem; font-size: 0.75rem; box-shadow: var(--shadow-neon-purple); background: var(--color-accent-purple);">KOPYALA</button>
          </div>
        `;

        // Inspect Detail modal binding
        card.querySelector('.inspect-btn').addEventListener('click', () => openInspectModal(game));

        // Clone button binding
        card.querySelector('.clone-btn').addEventListener('click', () => cloneGame(game._id, game.title));

        gamesGrid.appendChild(card);
      });
    }

    // Filter and search handling
    function filterResults() {
      const query = searchInput.value.toLowerCase().trim();
      const format = formatFilter.value;

      filteredGames = allGames.filter(game => {
        const matchesSearch = game.title.toLowerCase().includes(query) || 
                              (game.creatorId?.username || '').toLowerCase().includes(query);
        const matchesFormat = format === 'all' || game.settings?.playerFormat === format;
        return matchesSearch && matchesFormat;
      });

      renderGames();
    }

    searchInput.addEventListener('input', filterResults);
    formatFilter.addEventListener('change', filterResults);

    // Clone Game call
    async function cloneGame(id, title) {
      if (confirm(`"${title}" adlı oyunu kendi kütüphanenize kopyalamak istiyor musunuz?`)) {
        try {
          await apiCall(`/games/${id}/clone`, 'POST');
          showAlert('Oyun başarıyla kütüphanenize kopyalandı! Yönlendiriliyorsunuz...', 'success');
          setTimeout(() => {
            window.location.hash = '#dashboard';
          }, 1500);
        } catch (err) {
          showAlert(err.message || 'Klonlama başarısız oldu.', 'error');
        }
      }
    }

    // Detailed Inspect Modal popup
    function openInspectModal(game) {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';

      const totalStages = game.settings?.stageOrder?.length || 0;
      
      modal.innerHTML = `
        <div class="glass-card modal-content" style="max-width: 550px; max-height: 80vh; overflow-y: auto;">
          <div class="editor-form-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: var(--spacing-md);">
            <h3 style="font-family: var(--font-heading); font-size: 1.1rem; letter-spacing: 1px; text-transform: uppercase;">
              🔍 OYUN DETAYLARI
            </h3>
            <button id="close-inspect-btn" class="stage-item-btn" style="font-size: 1.2rem;">&times;</button>
          </div>

          <div style="display: flex; flex-direction: column; gap: var(--spacing-md); font-size: 0.85rem;">
            <!-- Main Info -->
            <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--color-border); padding: 12px; border-radius: var(--radius-md);">
              <h2 style="font-family: var(--font-heading); font-size: 1.3rem; margin-bottom: 5px; color: #ffffff;">${game.title}</h2>
              <div style="color: var(--color-text-muted); font-size: 0.75rem; margin-bottom: 10px;">
                Yapımcı: <strong style="color: var(--color-accent-blue);">@${game.creatorId?.username || 'Bilinmeyen'}</strong>
              </div>
              <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; text-align: center; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px;">
                <div>
                  <div style="color: var(--color-text-muted); font-size: 0.7rem;">FORMAT</div>
                  <strong style="font-size: 0.95rem; color: #ffffff;">${game.settings?.playerFormat || '2v2'}</strong>
                </div>
                <div>
                  <div style="color: var(--color-text-muted); font-size: 0.7rem;">BAŞLANGIÇ HP</div>
                  <strong style="font-size: 0.95rem; color: #ffffff;">❤️ ${game.settings?.startingHP || 300}</strong>
                </div>
                <div>
                  <div style="color: var(--color-text-muted); font-size: 0.7rem;">TOPLAM ETAP</div>
                  <strong style="font-size: 0.95rem; color: #ffffff;">🏁 ${totalStages}</strong>
                </div>
              </div>
            </div>

            <!-- Stages Summary -->
            <div>
              <h4 style="font-family: var(--font-heading); font-size: 0.85rem; margin-bottom: 8px; letter-spacing: 0.5px;">ETAP DETAYLARI</h4>
              
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${totalStages === 0 ? `
                  <div style="color: var(--color-text-muted); text-align: center; padding: 10px; border: 1px dashed var(--color-border); border-radius: var(--radius-sm);">
                    Oyunda henüz hiç etap bulunmuyor.
                  </div>
                ` : (game.settings.stageOrder).map((key, idx) => {
                  const info = stageNames[key];
                  const stageObj = game.stages[key];
                  if (!info || !stageObj) return '';

                  let detailText = '';
                  if (key === 'multipleChoice') {
                    detailText = `Soru sayısı: ${stageObj.questions?.length || 0} (${stageObj.answerMode === 'buzzer' ? 'Buzzer' : 'Sırayla'})`;
                  } else if (key === 'imageGuess') {
                    detailText = `Görsel sayısı: ${stageObj.items?.length || 0} (Reveal: ${stageObj.revealEffect || 'blur'})`;
                  } else if (key === 'soundGuess') {
                    detailText = `Ses klibi: ${stageObj.items?.length || 0} (Play: ${stageObj.playMode || 'gradual'})`;
                  } else if (key === 'sayismaca') {
                    detailText = `Tema sayısı: ${stageObj.items?.length || 0}`;
                  } else if (key === 'wordPuzzle') {
                    detailText = `Kelime sayısı: ${stageObj.items?.length || 0}`;
                  } else if (key === 'mapGuess') {
                    detailText = `Harita sayısı: ${stageObj.items?.length || 0}`;
                  } else if (key === 'finalDuel') {
                    detailText = `Düello sorusu: ${stageObj.questions?.length || 0} (${stageObj.damagePerQuestion} HP hasar)`;
                  }

                  return `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: rgba(255,255,255,0.01); border: 1px solid var(--color-border); border-radius: var(--radius-sm);">
                      <div style="font-weight: 600;">${idx + 1}. ${info.icon} ${info.name}</div>
                      <div style="font-size: 0.75rem; color: var(--color-text-muted);">${detailText}</div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>

            <button id="modal-clone-btn" class="btn btn-primary" style="width: 100%; margin-top: 5px;">
              BU OYUNU KÜTÜPHANEME KOPYALA
            </button>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      setTimeout(() => modal.classList.add('active'), 10);

      const closeBtn = modal.querySelector('#close-inspect-btn');
      const modalCloneBtn = modal.querySelector('#modal-clone-btn');

      const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => modal.remove(), 300);
      };

      closeBtn.addEventListener('click', closeModal);
      modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
      });

      modalCloneBtn.addEventListener('click', () => {
        closeModal();
        cloneGame(game._id, game.title);
      });
    }

  },
  destroy: () => {
    console.log('Public Library Screen destroyed');
  }
};

export default publicLibraryScreen;
