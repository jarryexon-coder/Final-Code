// services/playerNameUtils.js - NEW FILE
/**
 * Normalize player names for NBA API lookup
 */
function normalizePlayerName(name) {
  if (!name || typeof name !== 'string') return '';
  
  // Remove everything in parentheses
  let normalized = name.replace(/\s*\([^)]*\)/g, '');
  
  // Remove team abbreviations and special markers
  normalized = normalized.replace(/\s*[-–]\s*[A-Z]{2,4}$/g, '');
  normalized = normalized.replace(/\s*[A-Z]{2,4}$/g, '');
  
  // Handle special characters
  normalized = normalized
    .replace(/č/g, 'c').replace(/ć/g, 'c')
    .replace(/š/g, 's').replace(/ž/g, 'z')
    .toLowerCase()
    .trim();
  
  // Handle common variations
  const variations = {
    'tim hardaway jr': 'tim hardaway jr',
    'lebron james': 'lebron james',
    'karl-anthony towns': 'karl-anthony towns',
    'og anunoby': 'og anunoby',
    'jrue holiday': 'jrue holiday',
    'c.j. mccollum': 'cj mccollum',
    'jonas valanciunas': 'jonas valanciunas',
    'nikola jokic': 'nikola jokic',
    'luka doncic': 'luka doncic'
  };
  
  return variations[normalized] || normalized;
}

/**
 * Find player by multiple strategies
 */
function findPlayerStrategies(players, normalizedName) {
  const strategies = [
    // Strategy 1: Exact full name match
    players.find(p => {
      const fullName = `${p.firstName.toLowerCase()} ${p.lastName.toLowerCase()}`;
      return fullName === normalizedName;
    }),
    
    // Strategy 2: Handle Jr., III, etc
    players.find(p => {
      const searchName = normalizedName.replace(/\./g, '').replace(/\s+/g, ' ');
      const playerName = `${p.firstName.toLowerCase()} ${p.lastName.toLowerCase()}`
        .replace(/\./g, '').replace(/\s+/g, ' ');
      return playerName === searchName;
    }),
    
    // Strategy 3: Last name + first initial
    players.find(p => {
      const nameParts = normalizedName.split(' ');
      return p.lastName.toLowerCase() === nameParts[nameParts.length - 1] &&
             p.firstName[0].toLowerCase() === normalizedName[0].toLowerCase();
    }),
    
    // Strategy 4: Contains in either name
    players.find(p => {
      const nameParts = normalizedName.split(' ');
      return nameParts.some(part => 
        p.firstName.toLowerCase().includes(part) ||
        p.lastName.toLowerCase().includes(part)
      );
    })
  ];
  
  return strategies.find(p => p);
}

module.exports = { normalizePlayerName, findPlayerStrategies };
