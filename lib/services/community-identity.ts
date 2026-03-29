export function generateDisplayName(seed: string): string {
  const adjectives = [
    "Gentle", "Brave", "Quiet", "Radiant", "Steady", 
    "Strong", "Patient", "Kind", "Peaceful", "Joyful",
    "Warm", "Bright", "Wise", "Resilient", "Calm"
  ];
  
  const nouns = [
    "Mugumo", "Acacia", "Rain", "Savannah", "River", 
    "Blossom", "Mountain", "Breeze", "Sunrise", "Petal",
    "Sky", "Earth", "Leaf", "Bloom", "Shadow"
  ];

  // Simple deterministic hash from string
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const adjIndex = Math.abs(hash) % adjectives.length;
  const nounIndex = Math.abs(hash >> 5) % nouns.length;
  const extraIndex = Math.abs(hash >> 10) % 100; // Small number to make it unique-ish

  return `${adjectives[adjIndex]} ${nouns[nounIndex]} ${extraIndex > 50 ? "Care" : ""}`.trim();
}

export function generateAvatarSVG(seed: string): string {
  // Deterministic colors based on seed
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue1 = Math.abs(hash % 360);
  const hue2 = (hue1 + 40) % 360;
  
  // Womb-adjacent tones (warm pinks, roses, earth)
  // Override hue to stay in warm range if needed
  const warmHue = (Math.abs(hash % 60) + 330) % 360; // 330-360 or 0-30 (Pinks to Oranges)

  const svg = `
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="12" fill="hsl(${warmHue}, 70%, 95%)"/>
      <circle cx="20" cy="20" r="${10 + (Math.abs(hash >> 2) % 8)}" fill="hsl(${warmHue}, 60%, 85%)" fill-opacity="0.6"/>
      <path d="M${10 + (Math.abs(hash >> 4) % 10)} ${10 + (Math.abs(hash >> 6) % 10)} Q 20 ${Math.abs(hash >> 8) % 40} ${30 - (Math.abs(hash >> 10) % 10)} ${30 - (Math.abs(hash >> 12) % 10)}" stroke="hsl(${warmHue}, 50%, 70%)" stroke-width="2" stroke-linecap="round"/>
      <circle cx="${15 + (Math.abs(hash >> 14) % 10)}" cy="${15 + (Math.abs(hash >> 16) % 10)}" r="3" fill="hsl(${warmHue}, 80%, 75%)" fill-opacity="0.8"/>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}
