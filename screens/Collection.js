import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { EGG_COLORS, getFilteredEggColors } from '../data/eggColors';
import { InventoryStorage, CollectionsStorage, SpeedModeStorage } from '../data/storage';
import { getColors } from '../utils/themes';

const Collection = () => {
  const navigation = useNavigation();
  const [colors, setColors] = useState(getColors());
  const [currentCollection, setCurrentCollection] = useState({});
  const [totalToday, setTotalToday] = useState(0);
  const [quickAddMode, setQuickAddMode] = useState(true);
  const [selectedColor, setSelectedColor] = useState(null);
  const [customQuantity, setCustomQuantity] = useState('');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [enabledColors, setEnabledColors] = useState([]);
  const [speedMode, setSpeedMode] = useState(false);
  const [totalEggs, setTotalEggs] = useState(0);
  const [isDuckEnabled, setIsDuckEnabled] = useState(false);
  const [chickenCount, setChickenCount] = useState(0);
  const [duckCount, setDuckCount] = useState(0);
  const [quailCount, setQuailCount] = useState(0);
  const [turkeyCount, setTurkeyCount] = useState(0);
  const [guineaCount, setGuineaCount] = useState(0);
  const [enabledSpecies, setEnabledSpecies] = useState([]);
  const [collectionNotes, setCollectionNotes] = useState('');

  useEffect(() => {
    // Initialize collection when enabled colors change
    if (enabledColors.length > 0) {
      const initialCollection = {};
      enabledColors.forEach(color => {
        initialCollection[color.id] = 0;
      });
      setCurrentCollection(initialCollection);
    }
  }, [enabledColors]);

  useEffect(() => {
    // Calculate total eggs collected today
    const total = Object.values(currentCollection).reduce((sum, count) => sum + count, 0);
    setTotalToday(total);
  }, [currentCollection]);

  useFocusEffect(
    React.useCallback(() => {
      // Refresh colors when screen comes into focus
      setColors(getColors());

      // Load speed mode and enabled colors
      loadSettings();
    }, [])
  );

  const loadSettings = async () => {
    try {
      // Load speed mode setting
      const isSpeedMode = await SpeedModeStorage.getSpeedMode();
      setSpeedMode(isSpeedMode);

      if (!isSpeedMode) {
        // Load enabled colors for normal mode
        const filteredColors = await getFilteredEggColors();
        setEnabledColors(filteredColors);
      } else {
        // In speed mode, reset all counters
        setTotalEggs(0);
        setChickenCount(0);
        setDuckCount(0);
        setQuailCount(0);
        setTurkeyCount(0);
        setGuineaCount(0);

        // Check which species are enabled for multi-species mode
        const filteredColors = await getFilteredEggColors();
        const speciesList = [];
        if (filteredColors.some(color => color.id === 'duck')) speciesList.push('duck');
        if (filteredColors.some(color => color.id === 'quail')) speciesList.push('quail');
        if (filteredColors.some(color => color.id === 'turkey')) speciesList.push('turkey');
        if (filteredColors.some(color => color.id === 'guinea')) speciesList.push('guinea');

        setEnabledSpecies(speciesList);
        // Set duck enabled for backward compatibility (will refactor this)
        setIsDuckEnabled(speciesList.length > 0);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setEnabledColors(EGG_COLORS); // Fallback to all colors
      setSpeedMode(false);
    }
  };

  const quickAddEgg = (colorId) => {
    setCurrentCollection(prev => ({
      ...prev,
      [colorId]: (prev[colorId] || 0) + 1
    }));
  };

  const removeEgg = (colorId) => {
    setCurrentCollection(prev => ({
      ...prev,
      [colorId]: Math.max(0, (prev[colorId] || 0) - 1)
    }));
  };

  // Speed mode functions
  const addEggSpeedMode = () => {
    setTotalEggs(prev => prev + 1);
  };

  const removeEggSpeedMode = () => {
    setTotalEggs(prev => Math.max(0, prev - 1));
  };

  const openCustomAddSpeedMode = () => {
    setCustomQuantity('');
    setShowCustomModal(true);
  };

  const addCustomQuantitySpeedMode = () => {
    const quantity = parseInt(customQuantity);
    if (quantity > 0) {
      setTotalEggs(prev => prev + quantity);
    }
    setShowCustomModal(false);
  };

  // Dual-species speed mode functions
  const addChickenEgg = () => {
    setChickenCount(prev => prev + 1);
  };

  const removeChickenEgg = () => {
    setChickenCount(prev => Math.max(0, prev - 1));
  };

  const addDuckEgg = () => {
    setDuckCount(prev => prev + 1);
  };

  const removeDuckEgg = () => {
    setDuckCount(prev => Math.max(0, prev - 1));
  };

  const addQuailEgg = () => {
    setQuailCount(prev => prev + 1);
  };

  const removeQuailEgg = () => {
    setQuailCount(prev => Math.max(0, prev - 1));
  };

  const addTurkeyEgg = () => {
    setTurkeyCount(prev => prev + 1);
  };

  const removeTurkeyEgg = () => {
    setTurkeyCount(prev => Math.max(0, prev - 1));
  };

  const addGuineaEgg = () => {
    setGuineaCount(prev => prev + 1);
  };

  const removeGuineaEgg = () => {
    setGuineaCount(prev => Math.max(0, prev - 1));
  };

  const openCustomAddChicken = () => {
    setSelectedColor('chicken');
    setCustomQuantity('');
    setShowCustomModal(true);
  };

  const openCustomAddDuck = () => {
    setSelectedColor('duck');
    setCustomQuantity('');
    setShowCustomModal(true);
  };

  const openCustomAddQuail = () => {
    setSelectedColor('quail');
    setCustomQuantity('');
    setShowCustomModal(true);
  };

  const openCustomAddTurkey = () => {
    setSelectedColor('turkey');
    setCustomQuantity('');
    setShowCustomModal(true);
  };

  const openCustomAddGuinea = () => {
    setSelectedColor('guinea');
    setCustomQuantity('');
    setShowCustomModal(true);
  };

  const addCustomQuantityDualSpecies = () => {
    const quantity = parseInt(customQuantity);
    if (quantity > 0) {
      if (selectedColor === 'chicken') {
        setChickenCount(prev => prev + quantity);
      } else if (selectedColor === 'duck') {
        setDuckCount(prev => prev + quantity);
      } else if (selectedColor === 'quail') {
        setQuailCount(prev => prev + quantity);
      } else if (selectedColor === 'turkey') {
        setTurkeyCount(prev => prev + quantity);
      } else if (selectedColor === 'guinea') {
        setGuineaCount(prev => prev + quantity);
      }
    }
    setShowCustomModal(false);
  };

  const openCustomAdd = (colorId) => {
    setSelectedColor(colorId);
    setCustomQuantity('');
    setShowCustomModal(true);
  };

  const addCustomQuantity = () => {
    const quantity = parseInt(customQuantity);
    if (quantity > 0) {
      setCurrentCollection(prev => ({
        ...prev,
        [selectedColor]: (prev[selectedColor] || 0) + quantity
      }));
    }
    setShowCustomModal(false);
  };

  const saveCollectionToInventory = async () => {
    try {
      if (speedMode) {
        if (enabledSpecies.length > 0) {
          // Multi-species speed mode: save each species separately
          const totalCollected = getTotalSpeciesCount();
          if (totalCollected > 0) {
            const collectionData = { total: totalCollected };
            const summaryParts = [];

            // Save chicken eggs
            if (chickenCount > 0) {
              await SpeedModeStorage.addChickenEggs(chickenCount);
              collectionData.chicken = chickenCount;
              summaryParts.push(`${chickenCount} chicken`);
            }

            // Save other species
            for (const species of enabledSpecies) {
              const count = getSpeciesCount(species);
              if (count > 0) {
                switch (species) {
                  case 'duck':
                    await SpeedModeStorage.addDuckEggs(count);
                    break;
                  case 'quail':
                    await SpeedModeStorage.addQuailEggs(count);
                    break;
                  case 'turkey':
                    await SpeedModeStorage.addTurkeyEggs(count);
                    break;
                  case 'guinea':
                    await SpeedModeStorage.addGuineaEggs(count);
                    break;
                }
                collectionData[species] = count;
                summaryParts.push(`${count} ${species}`);
              }
            }

            await CollectionsStorage.addCollection(collectionData, collectionNotes);

            const summaryText = summaryParts.join(', ') + ' eggs';

            Alert.alert(
              'Collection Saved!',
              `Added ${summaryText} to inventory`,
              [
                {
                  text: 'Collect More',
                  onPress: () => {
                    setChickenCount(0);
                    setDuckCount(0);
                    setQuailCount(0);
                    setTurkeyCount(0);
                    setGuineaCount(0);
                    setCollectionNotes('');
                  }
                },
                {
                  text: 'Done',
                  onPress: () => {
                    setChickenCount(0);
                    setDuckCount(0);
                    setQuailCount(0);
                    setTurkeyCount(0);
                    setGuineaCount(0);
                    setCollectionNotes('');
                    navigation.navigate('Boxing');
                  }
                }
              ]
            );
          }
        } else {
          // Single-species speed mode: save total eggs
          if (totalEggs > 0) {
            await SpeedModeStorage.addTotalEggs(totalEggs);
            await CollectionsStorage.addCollection({ total: totalEggs }, collectionNotes);

            Alert.alert(
              'Collection Saved!',
              `Added ${totalEggs} eggs to inventory`,
              [
                {
                  text: 'Collect More',
                  onPress: () => {
                    setTotalEggs(0);
                    setCollectionNotes('');
                  }
                },
                {
                  text: 'Done',
                  onPress: () => {
                    setTotalEggs(0);
                    setCollectionNotes('');
                    navigation.navigate('Boxing');
                  }
                }
              ]
            );
          }
        }
      } else {
        // Normal mode: save by color
        await CollectionsStorage.addCollection(currentCollection, collectionNotes);

        // Add eggs to main inventory
        for (const [colorId, quantity] of Object.entries(currentCollection)) {
          if (quantity > 0) {
            await InventoryStorage.addEggs(colorId, quantity);
          }
        }

        Alert.alert(
          'Collection Saved!',
          `Added ${totalToday} eggs to inventory`,
          [
            {
              text: 'Collect More',
              onPress: () => {
                const resetCollection = {};
                enabledColors.forEach(color => {
                  resetCollection[color.id] = 0;
                });
                setCurrentCollection(resetCollection);
                setCollectionNotes('');
              }
            },
            {
              text: 'Done',
              onPress: () => {
                const resetCollection = {};
                enabledColors.forEach(color => {
                  resetCollection[color.id] = 0;
                });
                setCurrentCollection(resetCollection);
                setCollectionNotes('');
                navigation.navigate('Boxing');
              }
            }
          ]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save collection');
    }
  };

  // Helper function to determine if a color is light and needs dark text
  const isLightColor = (hexColor) => {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Convert to RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    // Return true if light (needs dark text)
    return luminance > 0.6;
  };

  const ColorButton = ({ color }) => {
    const count = currentCollection[color.id] || 0;
    const needsDarkText = isLightColor(color.color);

    return (
      <View style={styles.colorButtonContainer}>
        <TouchableOpacity
          style={[
            styles.colorButton,
            { backgroundColor: color.color },
            color.color === '#FFFFFF' && styles.whiteButtonBorder
          ]}
          onPress={() => quickAddEgg(color.id)}
          onLongPress={() => openCustomAdd(color.id)}
        >
          <Text style={[
            styles.colorButtonText,
            needsDarkText && styles.lightButtonText
          ]}>
            {count}
          </Text>
        </TouchableOpacity>

        <Text style={styles.colorName}>{color.name}</Text>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => removeEgg(color.id)}
          >
            <Ionicons name="remove" size={16} color="#8B4513" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.addButton]}
            onPress={() => quickAddEgg(color.id)}
          >
            <Ionicons name="add" size={16} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // Helper function to get species count
  const getSpeciesCount = (species) => {
    switch (species) {
      case 'duck': return duckCount;
      case 'quail': return quailCount;
      case 'turkey': return turkeyCount;
      case 'guinea': return guineaCount;
      default: return 0;
    }
  };

  // Helper function to get total count across all species
  const getTotalSpeciesCount = () => {
    return chickenCount + duckCount + quailCount + turkeyCount + guineaCount;
  };

  // Helper function to get species add function
  const getSpeciesAddFunction = (species) => {
    switch (species) {
      case 'duck': return addDuckEgg;
      case 'quail': return addQuailEgg;
      case 'turkey': return addTurkeyEgg;
      case 'guinea': return addGuineaEgg;
      default: return () => {};
    }
  };

  // Helper function to get species custom add function
  const getSpeciesCustomAddFunction = (species) => {
    switch (species) {
      case 'duck': return openCustomAddDuck;
      case 'quail': return openCustomAddQuail;
      case 'turkey': return openCustomAddTurkey;
      case 'guinea': return openCustomAddGuinea;
      default: return () => {};
    }
  };

  // Helper function to get species colors
  const getSpeciesColor = (species) => {
    switch (species) {
      case 'duck': return colors.secondary;
      case 'quail': return colors.accent;
      case 'turkey': return colors.textLight;
      case 'guinea': return colors.border;
      default: return colors.primary;
    }
  };

  // Render species buttons dynamically
  const renderSpeciesButtons = () => {
    const allSpecies = ['chicken', ...enabledSpecies];

    return (
      <View style={styles.multiSpeciesContainer}>
        <View style={styles.speciesGrid}>
          {allSpecies.map((species) => {
            const count = species === 'chicken' ? chickenCount : getSpeciesCount(species);
            const addFunction = species === 'chicken' ? addChickenEgg : getSpeciesAddFunction(species);
            const customAddFunction = species === 'chicken' ? openCustomAddChicken : getSpeciesCustomAddFunction(species);
            const bgColor = species === 'chicken' ? colors.primary : getSpeciesColor(species);

            return (
              <TouchableOpacity
                key={species}
                style={[styles.speciesButton, { backgroundColor: bgColor }]}
                onPress={addFunction}
                onLongPress={customAddFunction}
              >
                <Ionicons name="egg" size={28} color="white" />
                <Text style={styles.speciesCount}>{count}</Text>
                <Text style={styles.speciesLabel}>{species.toUpperCase()}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {speedMode ? (
          enabledSpecies.length > 0 ? (
            // Multi-Species Speed Mode UI
            <>
              <Text style={styles.instructions}>
                🚀 Speed Mode • Tap to add eggs • Long press for custom quantity
              </Text>

              {renderSpeciesButtons()}

              {getTotalSpeciesCount() > 0 && (
                <>
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>📝 Daily Notes (optional)</Text>
                    <TextInput
                      style={styles.notesInput}
                      value={collectionNotes}
                      onChangeText={setCollectionNotes}
                      placeholder="Weather, flock health, special observations..."
                      placeholderTextColor={colors.textLight}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveCollectionToInventory}
                  >
                    <Ionicons name="save" size={24} color="white" />
                    <Text style={styles.saveButtonText}>
                      Collect {getTotalSpeciesCount()} eggs
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </>
          ) : (
            // Single-Species Speed Mode UI
            <>
              <Text style={styles.instructions}>
                🚀 Speed Mode • Tap to add eggs • Long press for custom quantity
              </Text>

              <View style={styles.speedModeContainer}>
                <TouchableOpacity
                  style={styles.speedModeButton}
                  onPress={addEggSpeedMode}
                  onLongPress={openCustomAddSpeedMode}
                >
                  <Ionicons name="egg" size={48} color="white" />
                  <Text style={styles.speedModeCount}>{totalEggs}</Text>
                  <Text style={styles.speedModeLabel}>EGGS</Text>
                </TouchableOpacity>

                <View style={styles.speedModeControls}>
                  <TouchableOpacity
                    style={styles.speedModeControlButton}
                    onPress={removeEggSpeedMode}
                  >
                    <Ionicons name="remove" size={24} color={colors.primary} />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.speedModeControlButton, styles.addButton]}
                    onPress={addEggSpeedMode}
                  >
                    <Ionicons name="add" size={24} color="white" />
                  </TouchableOpacity>
                </View>
              </View>

              {totalEggs > 0 && (
                <>
                  <View style={styles.notesContainer}>
                    <Text style={styles.notesLabel}>📝 Daily Notes (optional)</Text>
                    <TextInput
                      style={styles.notesInput}
                      value={collectionNotes}
                      onChangeText={setCollectionNotes}
                      placeholder="Weather, flock health, special observations..."
                      placeholderTextColor={colors.textLight}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.saveButton}
                    onPress={saveCollectionToInventory}
                >
                  <Ionicons name="save" size={24} color="white" />
                  <Text style={styles.saveButtonText}>
                    Collect {totalEggs} eggs
                  </Text>
                </TouchableOpacity>
                </>
              )}
            </>
          )
        ) : (
          // Normal Mode UI
          <>
            <Text style={styles.instructions}>
              Tap colors to add eggs • Long press for custom quantity
            </Text>

            <View style={styles.colorGrid}>
              {enabledColors.map((color) => (
                <ColorButton key={color.id} color={color} />
              ))}
            </View>

            {totalToday > 0 && (
              <>
                <View style={styles.notesContainer}>
                  <Text style={styles.notesLabel}>📝 Daily Notes (optional)</Text>
                  <TextInput
                    style={styles.notesInput}
                    value={collectionNotes}
                    onChangeText={setCollectionNotes}
                    placeholder="Weather, flock health, special observations..."
                    placeholderTextColor={colors.textLight}
                    multiline
                    numberOfLines={3}
                  />
                </View>
                <TouchableOpacity
                  style={styles.saveButton}
                  onPress={saveCollectionToInventory}
                >
                  <Ionicons name="save" size={24} color="white" />
                  <Text style={styles.saveButtonText}>
                    Collect {totalToday} eggs
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Custom Quantity Modal */}
      <Modal
        visible={showCustomModal}
        transparent={true}
        animationType="slide"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {speedMode
                ? 'Add Eggs'
                : `Add ${selectedColor ? EGG_COLORS.find(c => c.id === selectedColor)?.name : ''} Eggs`
              }
            </Text>

            <TextInput
              style={styles.quantityInput}
              value={customQuantity}
              onChangeText={setCustomQuantity}
              placeholder="Enter quantity"
              keyboardType="number-pad"
              autoFocus={true}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowCustomModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={
                  speedMode
                    ? isDuckEnabled
                      ? addCustomQuantityDualSpecies
                      : addCustomQuantitySpeedMode
                    : addCustomQuantity
                }
              >
                <Text style={styles.modalConfirmText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: 'white',
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#DDD',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#8B4513',
  },
  totalCount: {
    fontSize: 18,
    color: '#8B4513',
    marginTop: 5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  instructions: {
    textAlign: 'center',
    color: colors.textLight,
    marginBottom: 20,
    fontSize: 16,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorButtonContainer: {
    width: '23%',
    marginBottom: 20,
    alignItems: 'center',
  },
  colorButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  whiteButtonBorder: {
    borderWidth: 2,
    borderColor: '#DDD',
  },
  colorButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  lightButtonText: {
    color: '#333333',
  },
  colorName: {
    fontSize: 12,
    textAlign: 'center',
    color: colors.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  actionButton: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  addButton: {
    backgroundColor: colors.primary,
  },
  saveButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#8B4513',
  },
  quantityInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 5,
    padding: 10,
    width: '100%',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginLeft: 10,
  },
  modalCancelText: {
    color: '#666',
    fontSize: 16,
  },
  modalConfirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  speedModeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 40,
  },
  speedModeButton: {
    backgroundColor: colors.primary,
    borderRadius: 100,
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    marginBottom: 30,
  },
  speedModeCount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
  },
  speedModeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginTop: 5,
  },
  speedModeControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
  },
  speedModeControlButton: {
    backgroundColor: colors.surface,
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dualSpeciesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 20,
  },
  speciesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 30,
  },
  speciesButton: {
    borderRadius: 80,
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  speciesCount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 5,
  },
  speciesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
    marginTop: 2,
  },
  dualSpeciesControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  speciesControlGroup: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  multiSpeciesContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 20,
  },
  speciesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    maxWidth: '100%',
  },
  notesContainer: {
    marginTop: 20,
    marginBottom: 10,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  notesInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
});

export default Collection;