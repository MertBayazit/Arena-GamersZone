import { apiCall } from '../api';
import { openStageSelector } from './stageSelector';
import { renderMultipleChoiceForm } from './forms/multipleChoiceForm';
import { renderImageGuessForm } from './forms/imageGuessForm';
import { renderSoundGuessForm } from './forms/soundGuessForm';
import { renderSayismacaForm } from './forms/sayismacaForm';
import { renderWordPuzzleForm } from './forms/wordPuzzleForm';
import { renderMapGuessForm } from './forms/mapGuessForm';
import { renderFinalDuelForm } from './forms/finalDuelForm';
import { renderClassicQAForm } from './forms/classicQAForm';

// Default blank game template
const createDefaultGame = () => ({
  title: 'Yeni Bilgi Yarışması',
  status: 'draft',
  settings: {
    startingHP: 300,
    playerFormat: '2v2',
    stageOrder: []
  },
  stages: {
    multipleChoice: {
      enabled: false,
      answerMode: 'buzzer',
      timeLimit: 15,
      damagePerQuestion: 10,
      questions: []
    }
  }
});

// Helper map to translate stage type names in UI
const stageNames = {
  multipleChoice: { name: 'Çoktan Seçmeli', icon: '🧠' },
  imageGuess: { name: 'Görsel Tahmin', icon: '🖼️' },
  soundGuess: { name: 'Ses Tahmin', icon: '🎵' },
  sayismaca: { name: 'Sayışmaca', icon: '🎯' },
  wordPuzzle: { name: 'Kelime Bulmaca', icon: '🧩' },
  mapGuess: { name: 'Harita Tahmin', icon: '🗺️' },
  finalDuel: { name: 'Final Düellosu', icon: '🏆' },
  classicQA: { name: 'Klasik', icon: '📝' }
};

export const editorScreen = {
  render: async (container, queryParams) => {
    let game = createDefaultGame();
    let isEditMode = false;
    let gameId = queryParams.id;
    let activeStageKey = null;

    // 1. Fetch game details if in edit mode
    if (gameId) {
      try {
        game = await apiCall(`/games/${gameId}`);
        isEditMode = true;
        // Set first stage as active
        if (game.settings?.stageOrder?.length > 0) {
          activeStageKey = game.settings.stageOrder[0];
        }
      } catch (err) {
        console.error('Oyun verisi çekilemedi:', err.message);
        alert('Oyun yüklenirken bir hata oluştu, yeni oyun moduna geçiliyor.');
        isEditMode = false;
        gameId = null;
      }
    }

    // Render structure
    container.innerHTML = `
      <div class="container editor-container">
        <!-- Top Bar -->
        <div class="editor-topbar">
          <input 
            type="text" 
            id="editor-title" 
            class="editor-title-input" 
            value="${game.title}" 
            placeholder="Oyun Adı Girin"
            required
          />
          
          <div style="display: flex; gap: 10px; align-items: center;">
            <div id="save-status-msg" style="font-size: 0.8rem; color: var(--color-success); display: none;">Kaydedildi ✅</div>
            <button id="save-draft-btn" class="btn btn-secondary" style="padding: 0.6rem 1.2rem; font-size: 0.8rem;">TASLAK KAYDET</button>
            <button id="publish-btn" class="btn btn-primary" style="padding: 0.6rem 1.2rem; font-size: 0.8rem;">YAYINLA</button>
            <button class="btn btn-secondary" onclick="window.location.hash='#dashboard'" style="padding: 0.6rem 1.2rem; font-size: 0.8rem;">GERİ DÖN</button>
          </div>
        </div>

        <div id="editor-alert" class="alert" style="display: none; padding: 0.5rem 1rem; margin-bottom: 15px;"></div>

        <!-- Sidebar / Main Split Workspace -->
        <div class="editor-workspace">
          <!-- Sidebar: Etap Listesi -->
          <div class="editor-sidebar glass-card">
            <h4 style="font-family: var(--font-heading); font-size: 0.85rem; color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 1px;">ETAP SIRALAMASI</h4>
            
            <div id="stages-list-container" class="stages-list">
              <!-- Rendered dynamically -->
            </div>

            <button id="add-stage-btn" class="btn btn-secondary" style="width: 100%; font-size: 0.75rem; border-style: dashed;">
              ➕ ETAP EKLE
            </button>
          </div>

          <!-- Main Content: Selected Stage Config Form -->
          <div class="editor-main-content glass-card">
            <div class="editor-form-card">
              <div class="editor-form-header">
                <h3 id="active-stage-title" style="font-family: var(--font-heading); font-size: 1.2rem; text-transform: uppercase;">ÇOKTAN SEÇMELİ</h3>
                <span id="active-stage-type-badge" class="game-card-badge published" style="margin-top: 5px;">SABİT ETAP</span>
              </div>
              
              <div id="active-stage-form-container" class="editor-form-body">
                <!-- Rendered dynamically (Stage content forms will be implemented in Phase 9) -->
                <div class="empty-state" style="border: 1px dashed var(--color-border); padding: var(--spacing-lg);">
                  <div style="font-size: 2.5rem; margin-bottom: 10px;">⚙️</div>
                  <h4 style="font-family: var(--font-heading); font-size: 0.95rem; margin-bottom: 5px;">ETAP AYARLARI VE İÇERİĞİ</h4>
                  <p style="font-size: 0.8rem; max-width: 400px; line-height: 1.5; color: var(--color-text-muted);">
                    Bu etabın soru ekleme, düzenleme ve dosya yükleme formları **Faz 9 (Etap Formları)** aşamasında eklenecektir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // DOM References
    const titleInput = document.getElementById('editor-title');
    const stagesListContainer = document.getElementById('stages-list-container');
    const activeStageTitle = document.getElementById('active-stage-title');
    const activeStageTypeBadge = document.getElementById('active-stage-type-badge');
    const saveDraftBtn = document.getElementById('save-draft-btn');
    const publishBtn = document.getElementById('publish-btn');
    const saveStatusMsg = document.getElementById('save-status-msg');
    const editorAlert = document.getElementById('editor-alert');
    const addStageBtn = document.getElementById('add-stage-btn');

    // Show alert helper
    const showAlert = (message, type = 'success') => {
      editorAlert.innerText = message;
      editorAlert.className = `alert alert-${type}`;
      editorAlert.style.display = 'flex';
      setTimeout(() => {
        editorAlert.style.display = 'none';
      }, 4000);
    };

    // Render left panel stages list
    const renderStagesList = () => {
      stagesListContainer.innerHTML = '';
      
      // 1. Render General Settings Link (Always present)
      const genSettingsItem = document.createElement('div');
      genSettingsItem.className = `stage-item ${activeStageKey === 'generalSettings' ? 'active' : ''}`;
      genSettingsItem.dataset.stageKey = 'generalSettings';
      genSettingsItem.innerHTML = `
        <div class="stage-item-info">
          <span class="stage-item-name">⚙️ Genel Ayarlar</span>
          <span class="stage-item-type">Oyun Formatı & HP</span>
        </div>
      `;
      genSettingsItem.addEventListener('click', () => selectStage('generalSettings'));
      stagesListContainer.appendChild(genSettingsItem);

      // Separator line
      const separator = document.createElement('div');
      separator.style.cssText = 'height: 1px; background: var(--color-border); margin: 8px 0;';
      stagesListContainer.appendChild(separator);

      if (!game.settings.stageOrder || game.settings.stageOrder.length === 0) {
        const emptyLabel = document.createElement('div');
        emptyLabel.style.cssText = 'font-size: 0.75rem; color: var(--color-text-muted); padding: 10px; text-align: center; border: 1px dashed var(--color-border); border-radius: var(--radius-md);';
        emptyLabel.innerText = 'Etap Eklenmedi';
        stagesListContainer.appendChild(emptyLabel);
        return;
      }
      
      game.settings.stageOrder.forEach((stageKey, index) => {
        const stageInfo = stageNames[stageKey];
        if (!stageInfo) return;

        const isActive = stageKey === activeStageKey;

        const item = document.createElement('div');
        item.className = `stage-item ${isActive ? 'active' : ''}`;
        item.dataset.stageKey = stageKey;

        item.innerHTML = `
          <div class="stage-item-info">
            <span class="stage-item-name">${stageInfo.icon} ${stageInfo.name}</span>
            <span class="stage-item-type">Etap #${index + 1}</span>
          </div>
          <div class="stage-item-actions">
            <!-- Up/Down Sorting Buttons -->
            ${index > 0 ? `<button class="stage-item-btn move-up" data-index="${index}">▲</button>` : ''}
            ${index < game.settings.stageOrder.length - 1 ? `<button class="stage-item-btn move-down" data-index="${index}">▼</button>` : ''}
            
            <!-- Delete Button -->
            <button class="stage-item-btn delete" data-stage-key="${stageKey}">&times;</button>
          </div>
        `;

        // Click item to select active stage
        item.addEventListener('click', (e) => {
          // If clicked action button, don't trigger select
          if (e.target.closest('.stage-item-btn')) return;
          selectStage(stageKey);
        });

        stagesListContainer.appendChild(item);
      });

      // Hook up reordering and deletion listeners
      const upBtns = stagesListContainer.querySelectorAll('.move-up');
      const downBtns = stagesListContainer.querySelectorAll('.move-down');
      const deleteBtns = stagesListContainer.querySelectorAll('.delete');

      upBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.index);
          swapStages(index, index - 1);
        });
      });

      downBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.index);
          swapStages(index, index + 1);
        });
      });

      deleteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const key = btn.dataset.stageKey;
          deleteStage(key);
        });
      });
    };

    // Swap positions of two stages in order list
    const swapStages = (idx1, idx2) => {
      const order = game.settings.stageOrder;
      const temp = order[idx1];
      order[idx1] = order[idx2];
      order[idx2] = temp;
      renderStagesList();
    };

    // Delete a selected optional stage
    const deleteStage = (stageKey) => {
      if (confirm('Bu etabı ve içindeki tüm soruları silmek istediğinize emin misiniz?')) {
        // Remove from order list
        game.settings.stageOrder = game.settings.stageOrder.filter(k => k !== stageKey);
        
        // Disable in stage stages structure
        if (game.stages[stageKey]) {
          game.stages[stageKey].enabled = false;
        }

        // If active stage was deleted, select first stage or general settings
        if (activeStageKey === stageKey) {
          activeStageKey = game.settings.stageOrder.length > 0 ? game.settings.stageOrder[0] : 'generalSettings';
        }

        renderStagesList();
        selectStage(activeStageKey);
      }
    };

    // Select a stage to view
    const selectStage = (stageKey) => {
      activeStageKey = stageKey;
      
      // Update sidebar visual active state
      const items = stagesListContainer.querySelectorAll('.stage-item');
      items.forEach(item => {
        if (item.dataset.stageKey === stageKey) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      });

      if (!stageKey) {
        selectStage('generalSettings');
        return;
      }

      if (stageKey === 'generalSettings') {
        activeStageTitle.innerText = '⚙️ Genel Ayarlar';
        activeStageTypeBadge.style.display = 'inline-block';
        activeStageTypeBadge.innerText = 'OYUN AYARLARI';
        activeStageTypeBadge.className = 'game-card-badge published';
        
        const formContainer = document.getElementById('active-stage-form-container');
        formContainer.innerHTML = `
          <div style="display: flex; flex-direction: column; gap: var(--spacing-md);">
            <div class="form-group">
              <label class="form-label">OYUN FORMATI</label>
              <select id="setting-player-format" class="form-input">
                <option value="2v2" ${game.settings.playerFormat === '2v2' ? 'selected' : ''}>2v2 (4 Oyuncu + 1 Host)</option>
                <option value="1v1" ${game.settings.playerFormat === '1v1' ? 'selected' : ''}>1v1 (2 Oyuncu + 1 Host)</option>
              </select>
              <span style="font-size: 0.7rem; color: var(--color-text-muted);">Lobide yarışacak oyuncu sayısını belirler.</span>
            </div>

            <div class="form-group">
              <label class="form-label">BAŞLANGIÇ PUANI (HP)</label>
              <input type="number" id="setting-starting-hp" class="form-input" value="${game.settings.startingHP || 300}" min="50" max="999" />
              <span style="font-size: 0.7rem; color: var(--color-text-muted);">Takımların oyuna başlayacağı can barı puanı.</span>
            </div>
          </div>
        `;

        document.getElementById('setting-player-format').addEventListener('change', (e) => {
          game.settings.playerFormat = e.target.value;
        });

        document.getElementById('setting-starting-hp').addEventListener('input', (e) => {
          game.settings.startingHP = parseInt(e.target.value) || 300;
        });

        return;
      }

      activeStageTypeBadge.style.display = 'inline-block';
      const info = stageNames[stageKey];
      activeStageTitle.innerText = `${info.icon} ${info.name}`;
      activeStageTypeBadge.innerText = 'OPSİYONEL ETAP';
      activeStageTypeBadge.className = 'game-card-badge draft';
      
      const formContainer = document.getElementById('active-stage-form-container');
      formContainer.innerHTML = '';

      const handleStageDataChange = (updatedStageData) => {
        game.stages[stageKey] = updatedStageData;
      };

      if (stageKey === 'multipleChoice') {
        renderMultipleChoiceForm(formContainer, game.stages[stageKey], handleStageDataChange);
      } else if (stageKey === 'imageGuess') {
        renderImageGuessForm(formContainer, game.stages[stageKey], handleStageDataChange);
      } else if (stageKey === 'soundGuess') {
        renderSoundGuessForm(formContainer, game.stages[stageKey], handleStageDataChange);
      } else if (stageKey === 'sayismaca') {
        renderSayismacaForm(formContainer, game.stages[stageKey], handleStageDataChange);
      } else if (stageKey === 'wordPuzzle') {
        renderWordPuzzleForm(formContainer, game.stages[stageKey], handleStageDataChange);
      } else if (stageKey === 'mapGuess') {
        renderMapGuessForm(formContainer, game.stages[stageKey], handleStageDataChange);
      } else if (stageKey === 'finalDuel') {
        renderFinalDuelForm(formContainer, game.stages[stageKey], handleStageDataChange);
      } else if (stageKey === 'classicQA') {
        renderClassicQAForm(formContainer, game.stages[stageKey], handleStageDataChange);
      }
    };

    // Add optional stage
    const addStage = (type) => {
      if (game.settings.stageOrder.includes(type)) {
        showAlert('Bu etap türü yarışmada zaten mevcut!', 'error');
        return;
      }

      // Add to stage order
      game.settings.stageOrder.push(type);
      
      // Initialize configuration in stages schema if not exists
      if (!game.stages[type]) {
        game.stages[type] = {
          enabled: true,
          questions: [],
          items: []
        };
      } else {
        game.stages[type].enabled = true;
      }

      renderStagesList();
      selectStage(type);
      showAlert(`${stageNames[type].name} etabı başarıyla eklendi.`, 'success');
    };

    // Save game action (draft or published)
    const saveGame = async (status = 'draft') => {
      const title = titleInput.value.trim();
      if (!title) {
        showAlert('Lütfen oyun adı girin!', 'error');
        return;
      }

      game.title = title;
      game.status = status;

      try {
        let savedGame;
        if (isEditMode) {
          savedGame = await apiCall(`/games/${gameId}`, 'PUT', game);
        } else {
          savedGame = await apiCall('/games', 'POST', game);
          // Redirect to edit url to preserve state
          isEditMode = true;
          gameId = savedGame._id;
          window.location.hash = `#editor?id=${gameId}`;
        }
        
        saveStatusMsg.innerText = status === 'published' ? 'Yayınlandı 🚀' : 'Kaydedildi ✅';
        saveStatusMsg.style.display = 'block';
        setTimeout(() => {
          saveStatusMsg.style.display = 'none';
        }, 3000);
      } catch (err) {
        showAlert(err.message || 'Oyun kaydedilemedi.', 'error');
      }
    };

    // Bind event listeners
    saveDraftBtn.addEventListener('click', () => saveGame('draft'));
    publishBtn.addEventListener('click', () => saveGame('published'));
    addStageBtn.addEventListener('click', () => openStageSelector(addStage));

    // Initialize UI
    renderStagesList();
    selectStage('generalSettings');
  },
  destroy: () => {
    console.log('Editor Screen destroyed');
  }
};

export default editorScreen;
