const Game = require('../models/Game');
const GameHistory = require('../models/GameHistory');

// Active lobbies map: code -> lobby data
const lobbies = new Map();

// Helper to generate unique 6-digit lobby code
function generateLobbyCode() {
  let code;
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (lobbies.has(code));
  return code;
}

function registerSocketEvents(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // ───── 1. HOST: CREATE LOBBY ─────
    socket.on('host:create', async ({ gameId, user }) => {
      try {
        if (!gameId || !user) {
          socket.emit('error', { message: 'Geçersiz parametreler' });
          return;
        }

        const game = await Game.findById(gameId);
        if (!game) {
          socket.emit('error', { message: 'Oyun şablonu bulunamadı' });
          return;
        }

        const lobbyCode = generateLobbyCode();
        
        const newLobby = {
          lobbyCode,
          gameId: game._id,
          gameTitle: game.title,
          settings: {
            startingHP: game.settings.startingHP || 300,
            playerFormat: game.settings.playerFormat || '2v2',
            stageOrder: game.settings.stageOrder || []
          },
          stages: game.stages,
          host: {
            socketId: socket.id,
            userId: user._id,
            username: user.username,
            avatar: user.avatar
          },
          status: 'waiting', // waiting, playing, finished
          players: [], // items: { socketId, userId, username, avatar, team, isReady }
          gameState: {
            activeStageIndex: 0,
            teamA_HP: game.settings.startingHP || 300,
            teamB_HP: game.settings.startingHP || 300,
            stageScores: {} // key: stageKey, value: scores state
          }
        };

        lobbies.set(lobbyCode, newLobby);
        socket.join(`room:${lobbyCode}`);
        
        console.log(`🏰 Lobby created: ${lobbyCode} by Host ${user.username}`);
        socket.emit('host:created', newLobby);
      } catch (err) {
        console.error(err);
        socket.emit('error', { message: 'Lobi oluşturulurken hata oluştu' });
      }
    });

    // ───── 2. PLAYER: JOIN LOBBY ─────
    socket.on('player:join', ({ lobbyCode, user }) => {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby) {
        socket.emit('error', { message: 'Lobi bulunamadı' });
        return;
      }

      // Check if user is the Host reconnecting
      if (lobby.host.userId === user._id) {
        lobby.host.socketId = socket.id;
        socket.join(`room:${lobbyCode}`);
        socket.emit('host:created', lobby);
        return;
      }

      // Check if user is already in lobby (prevent double joins / support reconnect)
      const existing = lobby.players.find(p => p.userId === user._id);
      if (existing) {
        existing.socketId = socket.id; // update socket id
        socket.join(`room:${lobbyCode}`);
        socket.emit('player:joined', lobby);
        io.to(`room:${lobbyCode}`).emit('lobby:updated', lobby);
        return;
      }

      if (lobby.status !== 'waiting') {
        socket.emit('error', { message: 'Oyun zaten başlamış' });
        return;
      }

      // Check max player limit
      const maxPlayers = lobby.settings.playerFormat === '1v1' ? 2 : 4;
      if (lobby.players.length >= maxPlayers) {
        socket.emit('error', { message: 'Lobi dolu' });
        return;
      }

      // Balance default team assignment
      const teamACount = lobby.players.filter(p => p.team === 'A').length;
      const teamBCount = lobby.players.filter(p => p.team === 'B').length;
      const assignedTeam = teamACount <= teamBCount ? 'A' : 'B';

      const newPlayer = {
        socketId: socket.id,
        userId: user._id,
        username: user.username,
        avatar: user.avatar,
        team: assignedTeam,
        isReady: false
      };

      lobby.players.push(newPlayer);
      socket.join(`room:${lobbyCode}`);

      console.log(`👤 Player ${user.username} joined lobby ${lobbyCode}`);
      socket.emit('player:joined', lobby);
      io.to(`room:${lobbyCode}`).emit('lobby:updated', lobby);
    });

    // ───── 3. PLAYER: SELECT TEAM ─────
    socket.on('player:select-team', ({ lobbyCode, team }) => {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby) return;

      const player = lobby.players.find(p => p.socketId === socket.id);
      if (!player) return;

      // Check if team size exceeds format limits
      const maxPerTeam = lobby.settings.playerFormat === '1v1' ? 1 : 2;
      const currentTeamSize = lobby.players.filter(p => p.team === team).length;

      if (player.team !== team && currentTeamSize >= maxPerTeam) {
        socket.emit('error', { message: `Takım dolu (Maksimum ${maxPerTeam} oyuncu)` });
        return;
      }

      player.team = team;
      io.to(`room:${lobbyCode}`).emit('lobby:updated', lobby);
    });

    // ───── 4. PLAYER: TOGGLE READY ─────
    socket.on('player:ready', ({ lobbyCode, isReady }) => {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby) return;

      const player = lobby.players.find(p => p.socketId === socket.id);
      if (!player) return;

      player.isReady = isReady;
      io.to(`room:${lobbyCode}`).emit('lobby:updated', lobby);
    });

    // ───── 5. HOST: START GAME ─────
    socket.on('host:start-game', ({ lobbyCode }) => {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby) return;

      if (lobby.host.socketId !== socket.id) {
        socket.emit('error', { message: 'Sadece kurucu oyunu başlatabilir' });
        return;
      }

      const requiredPlayers = lobby.settings.playerFormat === '1v1' ? 2 : 4;
      if (lobby.players.length < requiredPlayers) {
        socket.emit('error', { message: `Yetersiz oyuncu sayısı (${requiredPlayers} oyuncu gereklidir)` });
        return;
      }

      const allReady = lobby.players.every(p => p.isReady);
      if (!allReady) {
        socket.emit('error', { message: 'Tüm oyuncuların hazır olması gerekmektedir' });
        return;
      }

      lobby.status = 'playing';
      console.log(`🚀 Game started in lobby ${lobbyCode}!`);
      
      // Initialize live game state variables
      lobby.gameState.activeStageIndex = 0;
      lobby.gameState.currentQuestionIndex = 0;
      lobby.gameState.selectedOptionIndex = null;
      lobby.gameState.isBuzzerActive = false;
      lobby.gameState.buzzedPlayer = null;
      lobby.gameState.failedTeams = [];
      lobby.gameState.isGameOver = false;
      lobby.gameState.winnerTeam = null;

      io.to(`room:${lobbyCode}`).emit('game:started', lobby);
    });

    // ───── 5A. GAME ENGINE: BUZZ ─────
    socket.on('game:buzz', ({ lobbyCode }) => {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby || lobby.status !== 'playing' || lobby.gameState.isGameOver) return;

      const player = lobby.players.find(p => p.socketId === socket.id);
      if (!player) return;

      // Check if buzzer is active and not already buzzed
      if (!lobby.gameState.isBuzzerActive || lobby.gameState.buzzedPlayer) return;

      // Check if team has already failed this turn
      if (lobby.gameState.failedTeams.includes(player.team)) {
        socket.emit('error', { message: 'Takımınız bu tur yanlış cevap verdi!' });
        return;
      }

      // Lock buzzer and assign buzzed player
      lobby.gameState.isBuzzerActive = false;
      lobby.gameState.selectedOptionIndex = null; // Clear chosen option on new buzz
      lobby.gameState.buzzedPlayer = {
        userId: player.userId,
        username: player.username,
        avatar: player.avatar,
        team: player.team
      };

      console.log(`🛎️ Buzz! Player ${player.username} from Team ${player.team} buzzed in lobby ${lobbyCode}`);
      io.to(`room:${lobbyCode}`).emit('game:buzzed', {
        buzzedPlayer: lobby.gameState.buzzedPlayer,
        isBuzzerActive: lobby.gameState.isBuzzerActive
      });
    });

    // ───── 5AA. GAME ENGINE: SELECT OPTION ─────
    socket.on('game:select-option', ({ lobbyCode, optionIndex }) => {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby || lobby.status !== 'playing' || lobby.gameState.isGameOver) return;

      const player = lobby.players.find(p => p.socketId === socket.id);
      if (!player) return;

      // Verify this is the player who currently has the buzz
      if (!lobby.gameState.buzzedPlayer || lobby.gameState.buzzedPlayer.userId !== player.userId) return;

      lobby.gameState.selectedOptionIndex = optionIndex;
      console.log(`📝 Option ${optionIndex} selected by player ${player.username} in lobby ${lobbyCode}`);
      io.to(`room:${lobbyCode}`).emit('game:option-selected', {
        selectedOptionIndex: optionIndex
      });
    });

    // ───── 5AB. HOST: CONTROL NEXT QUESTION ─────
    socket.on('host:next-question', ({ lobbyCode }) => {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby || lobby.status !== 'playing') return;

      if (lobby.host.socketId !== socket.id) return;

      lobby.gameState.currentQuestionIndex++;
      lobby.gameState.selectedOptionIndex = null;
      lobby.gameState.buzzedPlayer = null;
      lobby.gameState.failedTeams = [];
      lobby.gameState.isBuzzerActive = false;

      io.to(`room:${lobbyCode}`).emit('game:question-changed', {
        currentQuestionIndex: lobby.gameState.currentQuestionIndex,
        gameState: lobby.gameState
      });
    });

    // ───── 5B. HOST: CONTROL BUZZER ─────
    socket.on('host:set-buzzer-active', ({ lobbyCode, active }) => {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby || lobby.status !== 'playing') return;

      if (lobby.host.socketId !== socket.id) return;

      lobby.gameState.isBuzzerActive = active;
      if (active) {
        lobby.gameState.buzzedPlayer = null;
      }

      io.to(`room:${lobbyCode}`).emit('game:buzzer-state', {
        isBuzzerActive: lobby.gameState.isBuzzerActive,
        buzzedPlayer: lobby.gameState.buzzedPlayer,
        failedTeams: lobby.gameState.failedTeams
      });
    });

    // ───── 5C. HOST: GRADE ANSWER (APPLY DAMAGE) ─────
    socket.on('host:submit-answer', ({ lobbyCode, isCorrect, damageValue }) => {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby || lobby.status !== 'playing' || lobby.gameState.isGameOver) return;

      if (lobby.host.socketId !== socket.id) return;

      const buzzed = lobby.gameState.buzzedPlayer;
      if (!buzzed) return;

      const damage = parseInt(damageValue) || 10;

      if (isCorrect) {
        // Correct answer: Damage target is the opponent team
        const targetTeam = buzzed.team === 'A' ? 'B' : 'A';
        if (targetTeam === 'A') {
          lobby.gameState.teamA_HP = Math.max(0, lobby.gameState.teamA_HP - damage);
        } else {
          lobby.gameState.teamB_HP = Math.max(0, lobby.gameState.teamB_HP - damage);
        }

        // Clear buzzed state
        lobby.gameState.buzzedPlayer = null;
        lobby.gameState.failedTeams = [];
        lobby.gameState.isBuzzerActive = false;

        // Check game over
        if (lobby.gameState.teamA_HP === 0 || lobby.gameState.teamB_HP === 0) {
          lobby.gameState.isGameOver = true;
          lobby.gameState.winnerTeam = lobby.gameState.teamA_HP === 0 ? 'B' : 'A';
        }
      } else {
        // Incorrect answer: Lock player's team from buzzing again for this question/turn
        if (!lobby.gameState.failedTeams.includes(buzzed.team)) {
          lobby.gameState.failedTeams.push(buzzed.team);
        }
        lobby.gameState.buzzedPlayer = null;
        
        // If both teams failed (or single contestant failed in 1v1 turn), reset/keep buzzer locked
        const maxPerTeam = lobby.settings.playerFormat === '1v1' ? 1 : 2;
        // In 1v1, if one team fails, other team can still buzz, or host can decide.
        // Let's unlock buzzer so the other team can buzz in if they haven't failed.
        const otherTeam = buzzed.team === 'A' ? 'B' : 'A';
        if (!lobby.gameState.failedTeams.includes(otherTeam)) {
          lobby.gameState.isBuzzerActive = true;
        } else {
          lobby.gameState.isBuzzerActive = false;
        }
      }

      io.to(`room:${lobbyCode}`).emit('game:state-updated', lobby.gameState);
    });

    // ───── 5D. HOST: MANUAL SCORE OVERRIDE ─────
    socket.on('host:override-hp', ({ lobbyCode, team, change }) => {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby || lobby.status !== 'playing') return;

      if (lobby.host.socketId !== socket.id) return;

      const hpDiff = parseInt(change) || 0;
      if (team === 'A') {
        lobby.gameState.teamA_HP = Math.min(lobby.settings.startingHP, Math.max(0, lobby.gameState.teamA_HP + hpDiff));
      } else if (team === 'B') {
        lobby.gameState.teamB_HP = Math.min(lobby.settings.startingHP, Math.max(0, lobby.gameState.teamB_HP + hpDiff));
      }

      // Sync GameOver state based on HP
      if (lobby.gameState.teamA_HP === 0 || lobby.gameState.teamB_HP === 0) {
        lobby.gameState.isGameOver = true;
        lobby.gameState.winnerTeam = lobby.gameState.teamA_HP === 0 ? 'B' : 'A';
      } else {
        lobby.gameState.isGameOver = false;
        lobby.gameState.winnerTeam = null;
      }

      io.to(`room:${lobbyCode}`).emit('game:state-updated', lobby.gameState);
    });

    // ───── 5E. HOST: OVERRIDE CONTINUATION ─────
    socket.on('host:override-continue', ({ lobbyCode }) => {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby || lobby.status !== 'playing') return;

      if (lobby.host.socketId !== socket.id) return;

      lobby.gameState.isGameOver = false;
      lobby.gameState.winnerTeam = null;
      
      // Revive dead team with 10 HP to allow continuation
      if (lobby.gameState.teamA_HP === 0) lobby.gameState.teamA_HP = 10;
      if (lobby.gameState.teamB_HP === 0) lobby.gameState.teamB_HP = 10;

      io.to(`room:${lobbyCode}`).emit('game:state-updated', lobby.gameState);
    });

    // ───── 5F. HOST: SHIFT NEXT STAGE / FINISH GAME ─────
    socket.on('host:next-stage', async ({ lobbyCode }) => {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby || lobby.status !== 'playing') return;

      if (lobby.host.socketId !== socket.id) return;

      lobby.gameState.activeStageIndex++;
      lobby.gameState.currentQuestionIndex = 0;
      lobby.gameState.selectedOptionIndex = null;

      // Clear state for new stage
      lobby.gameState.buzzedPlayer = null;
      lobby.gameState.failedTeams = [];
      lobby.gameState.isBuzzerActive = false;

      // If activeIndex exceeds stageOrder length, trigger game finish
      if (lobby.gameState.activeStageIndex >= lobby.settings.stageOrder.length) {
        await finishAndSaveGame(lobbyCode);
      } else {
        io.to(`room:${lobbyCode}`).emit('game:stage-changed', {
          activeStageIndex: lobby.gameState.activeStageIndex,
          gameState: lobby.gameState
        });
      }
    });

    // Helper: Finish game and save details in MongoDB
    async function finishAndSaveGame(lobbyCode) {
      const lobby = lobbies.get(lobbyCode);
      if (!lobby) return;

      try {
        // Calculate winner
        let winner = 'A'; // Team A defaults
        if (lobby.gameState.teamB_HP > lobby.gameState.teamA_HP) {
          winner = 'B';
        } else if (lobby.gameState.teamB_HP === lobby.gameState.teamA_HP) {
          winner = 'Draw';
        }

        // Map contestants format
        const historyPlayers = lobby.players.map(p => ({
          userId: p.userId,
          username: p.username,
          team: p.team
        }));

        // Save GameHistory to DB (automatically gets purged in 7 days via TTL index)
        const history = await GameHistory.create({
          gameId: lobby.gameId,
          players: historyPlayers,
          result: {
            winner,
            scores: {
              teamA: lobby.gameState.teamA_HP,
              teamB: lobby.gameState.teamB_HP
            }
          }
        });

        console.log(`💾 Saved GameHistory: ${history._id} (Lobby ${lobbyCode})`);
        
        io.to(`room:${lobbyCode}`).emit('game:finished', {
          historyId: history._id,
          result: history.result,
          gameTitle: lobby.gameTitle
        });

        // Delete lobby from memory
        lobbies.delete(lobbyCode);
      } catch (err) {
        console.error('Error saving game history:', err);
        io.to(`room:${lobbyCode}`).emit('error', { message: 'Oyun geçmişi kaydedilirken hata oluştu' });
      }
    }

    // ───── 6. SYSTEM: DISCONNECT ─────
    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);

      // Check if disconnected client was host or player
      for (const [code, lobby] of lobbies.entries()) {
        if (lobby.host.socketId === socket.id) {
          console.log(`💥 Host left. Destroying lobby ${code}`);
          io.to(`room:${code}`).emit('lobby:destroyed', { message: 'Kurucu lobi odasından ayrıldı' });
          lobbies.delete(code);
        } else {
          const playerIdx = lobby.players.findIndex(p => p.socketId === socket.id);
          if (playerIdx !== -1) {
            const player = lobby.players[playerIdx];
            console.log(`👤 Player ${player.username} left lobby ${code}`);
            lobby.players.splice(playerIdx, 1);
            
            // Notify other room members
            io.to(`room:${code}`).emit('lobby:updated', lobby);
          }
        }
      }
    });

  });
}

module.exports = {
  registerSocketEvents,
  lobbies
};
