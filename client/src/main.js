import './css/main.css';
import './css/components.css';
import './css/auth.css';
import './css/dashboard.css';
import './css/editor.css';
import './css/game.css';

import { router } from './js/app.js';
import { loginScreen } from './js/screens/login.js';
import { registerScreen } from './js/screens/register.js';
import { dashboardScreen } from './js/screens/dashboard.js';
import { profileScreen } from './js/screens/profile.js';
import { publicLibraryScreen } from './js/screens/publicLibrary.js';
import { resultsScreen } from './js/screens/results.js';
import { editorScreen } from './js/editor/editor.js';
import { lobbyScreen } from './js/screens/lobby.js';
import { gameScreen } from './js/screens/game.js';

// Register routes
router.addRoute('#login', loginScreen);
router.addRoute('#register', registerScreen);
router.addRoute('#dashboard', dashboardScreen);
router.addRoute('#profile', profileScreen);
router.addRoute('#public-library', publicLibraryScreen);
router.addRoute('#results', resultsScreen);
router.addRoute('#editor', editorScreen);
router.addRoute('#lobby', lobbyScreen);
router.addRoute('#game', gameScreen);

// Initialize router when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  router.init();
});
