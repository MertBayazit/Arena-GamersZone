const avatars = {
  avatar_01: {
    name: 'Neo Blue',
    color: '#00f0ff',
    svg: (size) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#0c1033" stroke="#00f0ff" stroke-width="3"/>
      <rect x="35" y="45" width="30" height="25" rx="5" fill="#00f0ff" opacity="0.3"/>
      <circle cx="40" cy="55" r="5" fill="#00f0ff"/>
      <circle cx="60" cy="55" r="5" fill="#00f0ff"/>
      <path d="M 45 72 Q 50 78 55 72" stroke="#00f0ff" stroke-width="3" fill="none"/>
      <path d="M 20 40 L 30 45" stroke="#00f0ff" stroke-width="4"/>
      <path d="M 80 40 L 70 45" stroke="#00f0ff" stroke-width="4"/>
    </svg>`
  },
  avatar_02: {
    name: 'Cyber Purple',
    color: '#b537f2',
    svg: (size) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#0c1033" stroke="#b537f2" stroke-width="3"/>
      <path d="M 30 35 L 70 35 L 65 65 L 35 65 Z" fill="#b537f2" opacity="0.4"/>
      <circle cx="42" cy="48" r="6" fill="#b537f2"/>
      <circle cx="58" cy="48" r="6" fill="#b537f2"/>
      <path d="M 38 58 Q 50 50 62 58" stroke="#b537f2" stroke-width="3" fill="none"/>
    </svg>`
  },
  avatar_03: {
    name: 'Toxic Ninja',
    color: '#00ff88',
    svg: (size) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#0c1033" stroke="#00ff88" stroke-width="3"/>
      <rect x="25" y="42" width="50" height="16" fill="#00ff88" opacity="0.8"/>
      <circle cx="40" cy="50" r="4" fill="#0c1033"/>
      <circle cx="60" cy="50" r="4" fill="#0c1033"/>
      <path d="M 35 70 C 45 65 55 65 65 70" stroke="#00ff88" stroke-width="3" fill="none"/>
    </svg>`
  },
  avatar_04: {
    name: 'Star Pink',
    color: '#ff2d75',
    svg: (size) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#0c1033" stroke="#ff2d75" stroke-width="3"/>
      <polygon points="50,18 58,35 77,38 63,51 66,70 50,61 34,70 37,51 23,38 42,35" fill="#ff2d75" opacity="0.4"/>
      <circle cx="42" cy="45" r="5" fill="#ffffff"/>
      <circle cx="58" cy="45" r="5" fill="#ffffff"/>
      <path d="M 45 58 H 55" stroke="#ffffff" stroke-width="3"/>
    </svg>`
  },
  avatar_05: {
    name: 'Gold Mech',
    color: '#ffb700',
    svg: (size) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#0c1033" stroke="#ffb700" stroke-width="3"/>
      <line x1="50" y1="10" x2="50" y2="30" stroke="#ffb700" stroke-width="4"/>
      <circle cx="50" cy="15" r="4" fill="#ffb700"/>
      <rect x="32" y="36" width="36" height="36" rx="6" fill="#ffb700" opacity="0.3"/>
      <rect x="38" y="44" width="8" height="8" rx="2" fill="#ffb700"/>
      <rect x="54" y="44" width="8" height="8" rx="2" fill="#ffb700"/>
      <path d="M 42 62 H 58" stroke="#ffb700" stroke-width="3"/>
    </svg>`
  },
  avatar_06: {
    name: 'Fire Alien',
    color: '#ff3366',
    svg: (size) => `<svg width="${size}" height="${size}" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="#0c1033" stroke="#ff3366" stroke-width="3"/>
      <ellipse cx="50" cy="48" rx="25" ry="18" fill="#ff3366" opacity="0.3"/>
      <ellipse cx="40" cy="46" rx="5" ry="9" fill="#ff3366"/>
      <ellipse cx="60" cy="46" rx="5" ry="9" fill="#ff3366"/>
      <circle cx="50" cy="32" r="3" fill="#ff3366"/>
      <path d="M 46 64 Q 50 68 54 64" stroke="#ff3366" stroke-width="3" fill="none"/>
    </svg>`
  }
};

export function getAvatarSVG(value, size = 80) {
  const avatar = avatars[value] || avatars.avatar_01;
  return avatar.svg(size);
}

export function getAvatarList() {
  return Object.keys(avatars).map(key => ({
    key,
    name: avatars[key].name,
    color: avatars[key].color
  }));
}
