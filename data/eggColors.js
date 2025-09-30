// Standardized egg color definitions for chicken breeds
export const EGG_COLORS = [
  {
    id: 'white',
    name: 'White',
    color: '#FFFFFF',
    description: 'Pure white eggs',
    breeds: ['Leghorn', 'Ancona', 'Hamburg']
  },
  {
    id: 'cream',
    name: 'Cream',
    color: '#FFF8DC',
    description: 'Light cream colored eggs',
    breeds: ['Buff Orpington', 'Cochin']
  },
  {
    id: 'light_brown',
    name: 'L.Brown',
    color: '#DEB887',
    description: 'Light brown eggs',
    breeds: ['Rhode Island Red', 'Plymouth Rock']
  },
  {
    id: 'medium_brown',
    name: 'M.Brown',
    color: '#CD853F',
    description: 'Medium brown eggs',
    breeds: ['New Hampshire', 'Australorp']
  },
  {
    id: 'dark_brown',
    name: 'D.Brown',
    color: '#8B4513',
    description: 'Dark brown eggs',
    breeds: ['Marans', 'Welsummer']
  },
  {
    id: 'chocolate',
    name: 'Choc',
    color: '#654321',
    description: 'Deep chocolate brown eggs',
    breeds: ['French Black Copper Marans']
  },
  {
    id: 'light_blue',
    name: 'L.Blue',
    color: '#ADD8E6',
    description: 'Light blue eggs',
    breeds: ['Ameraucana', 'Arkansas Blue']
  },
  {
    id: 'blue',
    name: 'Blue',
    color: '#4169E1',
    description: 'Medium blue eggs',
    breeds: ['Araucana', 'Cream Legbar']
  },
  {
    id: 'green',
    name: 'Green',
    color: '#90EE90',
    description: 'Light green eggs',
    breeds: ['Easter Egger', 'Olive Egger']
  },
  {
    id: 'olive',
    name: 'Olive',
    color: '#556B2F',
    description: 'Olive green eggs',
    breeds: ['Olive Egger', 'Black Copper Marans cross']
  },
  {
    id: 'pink',
    name: 'Pink',
    color: '#FFB6C1',
    description: 'Pink tinted eggs',
    breeds: ['Light Sussex', 'Asil']
  },
  {
    id: 'speckled',
    name: 'Speckled',
    color: '#DEB887',
    description: 'Brown eggs with dark speckles',
    breeds: ['Welsummer', 'Marans'],
    pattern: 'speckled'
  },
  {
    id: 'duck',
    name: 'Duck',
    color: '#E6E6FA',
    description: 'Duck eggs',
    breeds: ['Pekin', 'Mallard', 'Khaki Campbell', 'Welsh Harlequin']
  },
  {
    id: 'quail',
    name: 'Quail',
    color: '#D2B48C',
    description: 'Quail eggs',
    breeds: ['Coturnix', 'Bobwhite', 'Jumbo Brown']
  },
  {
    id: 'turkey',
    name: 'Turkey',
    color: '#F4A460',
    description: 'Turkey eggs',
    breeds: ['Broad Breasted Bronze', 'Heritage Bronze', 'Bourbon Red']
  },
  {
    id: 'guinea',
    name: 'Guinea',
    color: '#CD853F',
    description: 'Guinea fowl eggs',
    breeds: ['Pearl', 'White', 'Lavender']
  },
  {
    id: 'generic',
    name: 'Mixed',
    color: '#D3D3D3',
    description: 'Mixed/uncategorized eggs (from speed mode)',
    breeds: ['Various'],
    isGeneric: true
  },
  {
    id: 'generic_chicken',
    name: 'Chicken (Mixed)',
    color: '#E8E8E8',
    description: 'Mixed chicken eggs (from speed mode)',
    breeds: ['Various chicken breeds'],
    isGeneric: true,
    species: 'chicken'
  },
  {
    id: 'generic_duck',
    name: 'Duck (Mixed)',
    color: '#DDE6FA',
    description: 'Mixed duck eggs (from speed mode)',
    breeds: ['Various duck breeds'],
    isGeneric: true,
    species: 'duck'
  },
  {
    id: 'generic_quail',
    name: 'Quail (Mixed)',
    color: '#E6D7B8',
    description: 'Mixed quail eggs (from speed mode)',
    breeds: ['Various quail breeds'],
    isGeneric: true,
    species: 'quail'
  },
  {
    id: 'generic_turkey',
    name: 'Turkey (Mixed)',
    color: '#F7C78A',
    description: 'Mixed turkey eggs (from speed mode)',
    breeds: ['Various turkey breeds'],
    isGeneric: true,
    species: 'turkey'
  },
  {
    id: 'generic_guinea',
    name: 'Guinea (Mixed)',
    color: '#DEB887',
    description: 'Mixed guinea eggs (from speed mode)',
    breeds: ['Various guinea breeds'],
    isGeneric: true,
    species: 'guinea'
  }
];

// Quick access arrays for UI components
export const getColorById = (id) => EGG_COLORS.find(color => color.id === id);
export const getColorNames = () => EGG_COLORS.map(color => color.name);
export const getColorOptions = () => EGG_COLORS.map(color => ({
  label: color.name,
  value: color.id,
  color: color.color
}));

// Helper function to get enabled colors from storage
export const getEnabledColors = async () => {
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const savedEnabledColors = await AsyncStorage.default.getItem('enabled_colors');

    if (savedEnabledColors) {
      return JSON.parse(savedEnabledColors);
    } else {
      // Default: all colors enabled
      const defaultEnabled = {};
      EGG_COLORS.forEach(color => {
        defaultEnabled[color.id] = true;
      });
      return defaultEnabled;
    }
  } catch (error) {
    console.error('Error loading enabled colors:', error);
    // Fallback: all colors enabled
    const defaultEnabled = {};
    EGG_COLORS.forEach(color => {
      defaultEnabled[color.id] = true;
    });
    return defaultEnabled;
  }
};

// Helper function to get filtered egg colors based on enabled settings
export const getFilteredEggColors = async () => {
  try {
    const enabledColors = await getEnabledColors();
    return EGG_COLORS.filter(color => enabledColors[color.id]);
  } catch (error) {
    console.error('Error filtering egg colors:', error);
    return EGG_COLORS; // Fallback to all colors
  }
};