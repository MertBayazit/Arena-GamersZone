import { apiCall } from './api';

export let currentUser = null;

export function setCurrentUser(user) {
  currentUser = user;
}

// Fetch current user from server using JWT token
export async function getMe() {
  const token = localStorage.getItem('token');
  if (!token) {
    currentUser = null;
    return null;
  }

  // Check if it is a guest token
  if (token.startsWith('guest_')) {
    try {
      const parts = token.split(':');
      const guestId = parts[0];
      const username = decodeURIComponent(parts[1] || 'Misafir');
      currentUser = {
        _id: guestId,
        username: username,
        avatar: {
          type: 'preset',
          value: 'avatar_01'
        },
        isGuest: true
      };
      return currentUser;
    } catch (e) {
      logout();
      return null;
    }
  }

  try {
    const user = await apiCall('/auth/me');
    currentUser = user;
    return user;
  } catch (error) {
    console.error('getMe failed:', error.message);
    logout();
    return null;
  }
}

// Log in as guest
export function loginAsGuest(username) {
  const guestId = 'guest_' + Math.random().toString(36).substring(2, 9);
  const token = `${guestId}:${encodeURIComponent(username)}`;
  localStorage.setItem('token', token);
  currentUser = {
    _id: guestId,
    username: username,
    avatar: {
      type: 'preset',
      value: 'avatar_01'
    },
    isGuest: true
  };
  return currentUser;
}

// Log in
export async function login(loginIdentifier, password, rememberMe) {
  try {
    const data = await apiCall('/auth/login', 'POST', {
      loginIdentifier,
      password,
      rememberMe
    });

    localStorage.setItem('token', data.token);
    currentUser = {
      _id: data._id,
      username: data.username,
      email: data.email,
      avatar: data.avatar
    };
    return currentUser;
  } catch (error) {
    throw error;
  }
}

// Register
export async function register(username, email, password) {
  try {
    const data = await apiCall('/auth/register', 'POST', {
      username,
      email,
      password
    });

    localStorage.setItem('token', data.token);
    currentUser = {
      _id: data._id,
      username: data.username,
      email: data.email,
      avatar: data.avatar
    };
    return currentUser;
  } catch (error) {
    throw error;
  }
}

// Log out
export function logout() {
  localStorage.removeItem('token');
  currentUser = null;
  window.location.hash = '#login';
}
