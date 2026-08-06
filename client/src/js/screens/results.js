import { apiCall } from '../api';
import { currentUser } from '../auth';

export const resultsScreen = {
  render: async (container, queryParams) => {
    if (!currentUser) {
      window.location.hash = '#login';
      return;
    }

    const historyId = queryParams.id;
    if (!historyId) {
      container.innerHTML = `
        <div class="glass-card" style="max-width: 600px; margin: 3rem auto; text-align: center;">
          <h2 style="color: var(--color-error); font-family: var(--font-heading); margin-bottom: 10px;">Hata</h2>
          <p style="color: var(--color-text-muted); margin-bottom: 20px;">Oyun geçmişi ID bulunamadı.</p>
          <button class="btn btn-secondary" onclick="window.location.hash='#dashboard'">Ana Sayfaya Dön</button>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="text-align: center; margin: 2rem auto; max-width: 600px; padding: 20px; position: relative;">
        <!-- Canvas for Confetti -->
        <canvas id="confetti-canvas" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; pointer-events: none; z-index: 999;"></canvas>

        <div class="glass-card" style="border: 2px solid var(--color-accent-purple); padding: var(--spacing-xl); box-shadow: var(--shadow-neon-purple);">
          <div style="font-size: 4rem; margin-bottom: var(--spacing-md); filter: drop-shadow(0 0 10px var(--color-accent-purple));">🏆</div>
          
          <h1 class="text-gradient" id="results-winner-title" style="font-family: var(--font-heading); font-size: 2rem; margin-bottom: 5px; text-transform: uppercase;">
            YÜKLENİYOR...
          </h1>
          <p id="results-game-title" style="color: var(--color-text-muted); font-size: 0.85rem; letter-spacing: 1px; text-transform: uppercase; margin-bottom: var(--spacing-lg);">
            ...
          </p>

          <!-- Scores Comparison -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-lg); margin-bottom: var(--spacing-xl); text-align: left;">
            <!-- Team A -->
            <div style="border: 1px solid rgba(0, 180, 255, 0.2); background: rgba(0, 180, 255, 0.02); padding: 15px; border-radius: var(--radius-md);">
              <div style="font-family: var(--font-heading); font-size: 0.8rem; color: var(--color-accent-blue); font-weight: bold; margin-bottom: 5px;">🔵 MAVİ TAKIM</div>
              <div id="results-team-a-score" style="font-size: 1.8rem; font-family: var(--font-heading); font-weight: bold; color: #fff; margin-bottom: 10px;">0 HP</div>
              <div id="results-team-a-players" style="font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.4;"></div>
            </div>

            <!-- Team B -->
            <div style="border: 1px solid rgba(255, 51, 102, 0.2); background: rgba(255, 51, 102, 0.02); padding: 15px; border-radius: var(--radius-md);">
              <div style="font-family: var(--font-heading); font-size: 0.8rem; color: var(--color-error); font-weight: bold; margin-bottom: 5px;">🔴 KIRMIZI TAKIM</div>
              <div id="results-team-b-score" style="font-size: 1.8rem; font-family: var(--font-heading); font-weight: bold; color: #fff; margin-bottom: 10px;">0 HP</div>
              <div id="results-team-b-players" style="font-size: 0.75rem; color: var(--color-text-muted); line-height: 1.4;"></div>
            </div>
          </div>

          <button class="btn btn-primary" onclick="window.location.hash='#dashboard'" style="padding: 0.85rem 2.5rem; font-size: 0.95rem; background: linear-gradient(135deg, var(--color-accent-blue), var(--color-accent-purple)); box-shadow: var(--shadow-neon-blue);">
            ANA SAYFAYA DÖN
          </button>
        </div>
      </div>
    `;

    try {
      const history = await apiCall(`/games/history/${historyId}`);
      
      const gameTitleEl = document.getElementById('results-game-title');
      const winnerTitleEl = document.getElementById('results-winner-title');
      const teamAScoreEl = document.getElementById('results-team-a-score');
      const teamBScoreEl = document.getElementById('results-team-b-score');
      const teamAPlayersEl = document.getElementById('results-team-a-players');
      const teamBPlayersEl = document.getElementById('results-team-b-players');

      gameTitleEl.innerText = history.gameId?.title || 'Yarışma';
      
      const winner = history.result.winner;
      if (winner === 'A') {
        winnerTitleEl.innerText = '🔵 MAVİ TAKIM KAZANDI!';
        winnerTitleEl.style.color = 'var(--color-accent-blue)';
      } else if (winner === 'B') {
        winnerTitleEl.innerText = '🔴 KIRMIZI TAKIM KAZANDI!';
        winnerTitleEl.style.color = 'var(--color-error)';
      } else {
        winnerTitleEl.innerText = '🤝 BERABERE BİTTİ!';
        winnerTitleEl.style.color = 'var(--color-accent-purple)';
      }

      teamAScoreEl.innerText = `${history.result.scores.teamA} HP`;
      teamBScoreEl.innerText = `${history.result.scores.teamB} HP`;

      const playersA = history.players.filter(p => p.team === 'A').map(p => `@${p.username}`).join('<br>') || 'Oyuncu yok';
      const playersB = history.players.filter(p => p.team === 'B').map(p => `@${p.username}`).join('<br>') || 'Oyuncu yok';

      teamAPlayersEl.innerHTML = playersA;
      teamBPlayersEl.innerHTML = playersB;

      // Launch Confetti!
      startConfetti();
    } catch (err) {
      console.error(err);
      alert('Sonuçlar yüklenirken hata oluştu.');
      window.location.hash = '#dashboard';
    }
  },

  destroy: () => {
    console.log('Results Screen destroyed');
    stopConfetti();
  }
};

// Canvas Confetti Implementation
let confettiInterval = null;
let animationFrameId = null;

function startConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  const colors = ['#00f0ff', '#b537f2', '#ff3366', '#00ff88', '#ffcc00'];
  const confettiCount = 150;
  const confettiList = [];

  for (let i = 0; i < confettiCount; i++) {
    confettiList.push({
      x: Math.random() * width,
      y: Math.random() * height - height,
      size: Math.random() * 8 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      speed: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 4 - 2
    });
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    confettiList.forEach((c) => {
      c.y += c.speed;
      c.rotation += c.rotationSpeed;

      if (c.y > height) {
        c.y = -20;
        c.x = Math.random() * width;
      }

      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate((c.rotation * Math.PI) / 180);
      ctx.fillStyle = c.color;
      ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size);
      ctx.restore();
    });

    animationFrameId = requestAnimationFrame(draw);
  }

  draw();
}

function stopConfetti() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
}

export default resultsScreen;
