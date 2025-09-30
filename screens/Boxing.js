import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from '@react-navigation/native';
import { EGG_COLORS, getColorById } from '../data/eggColors';
import { InventoryStorage, BoxedEggsStorage, SpeedModeStorage } from '../data/storage';
import { getColors } from '../utils/themes';
import { printBoxLabel, printToBluetoothThermalPrinter } from '../utils/printing';

const Boxing = () => {
  const [inventory, setInventory] = useState({});
  const [currentBox, setCurrentBox] = useState({});
  const [boxedEggs, setBoxedEggs] = useState([]);
  const [totalInBox, setTotalInBox] = useState(0);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [selectedColor, setSelectedColor] = useState(null);
  const [customQuantity, setCustomQuantity] = useState('');
  const [colors, setColors] = useState(getColors());
  const [speedMode, setSpeedMode] = useState(false);
  const [totalEggs, setTotalEggs] = useState(0);
  const [targetPackSize, setTargetPackSize] = useState('12');
  const [speciesInventory, setSpeciesInventory] = useState({
    chicken: 0,
    duck: 0,
    quail: 0,
    turkey: 0,
    guinea: 0
  });

  const loadData = async () => {
    try {
      // Load speed mode setting
      const isSpeedMode = await SpeedModeStorage.getSpeedMode();
      setSpeedMode(isSpeedMode);

      const currentInventory = await InventoryStorage.getInventory();
      setInventory(currentInventory);

      // Calculate total eggs for speed mode
      const total = Object.values(currentInventory).reduce((sum, count) => sum + count, 0);
      setTotalEggs(total);

      // Calculate species-specific inventory for speed mode
      if (isSpeedMode) {
        setSpeciesInventory({
          chicken: currentInventory.generic_chicken || 0,
          duck: currentInventory.generic_duck || 0,
          quail: currentInventory.generic_quail || 0,
          turkey: currentInventory.generic_turkey || 0,
          guinea: currentInventory.generic_guinea || 0
        });
      }

      const boxed = await BoxedEggsStorage.getBoxedEggs();
      setBoxedEggs(boxed.filter(box => !box.sold));

      // Initialize empty box
      const emptyBox = {};
      EGG_COLORS.forEach(color => {
        emptyBox[color.id] = 0;
      });
      setCurrentBox(emptyBox);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
      // Refresh colors when screen comes into focus
      setColors(getColors());
    }, [])
  );

  React.useEffect(() => {
    const total = Object.values(currentBox).reduce((sum, count) => sum + count, 0);
    setTotalInBox(total);
  }, [currentBox]);

  const addToBox = (colorId, quantity = 1) => {
    const available = inventory[colorId] || 0;
    const currentInBox = currentBox[colorId] || 0;
    const remainingAvailable = available - currentInBox;

    if (remainingAvailable >= quantity) {
      setCurrentBox(prev => ({
        ...prev,
        [colorId]: currentInBox + quantity
      }));
    } else {
      const colorName = getColorById(colorId)?.name;
      if (remainingAvailable === 0) {
        Alert.alert(
          'No More Available',
          `All ${available} ${colorName} eggs are already in the box`
        );
      } else {
        Alert.alert(
          'Not Enough Eggs',
          `Only ${remainingAvailable} more ${colorName} eggs can be added (${available} total, ${currentInBox} already in box)`
        );
      }
    }
  };

  const removeFromBox = (colorId, quantity = 1) => {
    const currentInBox = currentBox[colorId] || 0;
    if (currentInBox >= quantity) {
      setCurrentBox(prev => ({
        ...prev,
        [colorId]: Math.max(0, currentInBox - quantity)
      }));
    }
  };

  const openCustomAdd = (colorId) => {
    setSelectedColor(colorId);
    setCustomQuantity('');
    setShowCustomModal(true);
  };

  const addCustomQuantity = () => {
    const quantity = parseInt(customQuantity);
    if (quantity > 0) {
      addToBox(selectedColor, quantity);
    }
    setShowCustomModal(false);
  };

  // Get pack size suggestions based on current box contents
  const getPackSizeSuggestions = () => {
    const speciesInBox = [];
    for (const [colorId, quantity] of Object.entries(currentBox)) {
      if (quantity > 0) {
        const color = getColorById(colorId);
        if (color && color.species && !speciesInBox.includes(color.species)) {
          speciesInBox.push(color.species);
        }
      }
    }

    // Default suggestions
    let suggestions = [4, 6, 8, 12, 18];

    // Species-specific suggestions
    if (speciesInBox.length === 1) {
      const species = speciesInBox[0];
      switch (species) {
        case 'duck':
          suggestions = [4, 6, 8, 12];
          break;
        case 'quail':
          suggestions = [12, 18, 24];
          break;
        case 'turkey':
          suggestions = [4, 6, 8];
          break;
        case 'guinea':
          suggestions = [6, 8, 12];
          break;
        case 'chicken':
        default:
          suggestions = [6, 12, 18, 30];
          break;
      }
    }

    return suggestions;
  };

  // Set pack size and auto-fill to target
  const setPackSizeAndFill = (size) => {
    setTargetPackSize(size.toString());
    autoFillToTarget(size);
  };

  // Auto-fill current box to reach target pack size
  const autoFillToTarget = (targetSize) => {
    const target = targetSize || parseInt(targetPackSize) || 12;
    const available = Object.entries(inventory).filter(([_, count]) => count > 0);

    if (available.length === 0) {
      Alert.alert('No Eggs', 'No eggs available in inventory');
      return;
    }

    const newBox = { ...currentBox };
    let currentTotal = totalInBox;

    // Fill proportionally from available colors
    while (currentTotal < target) {
      let added = false;
      for (const [colorId, availableCount] of available) {
        if (currentTotal >= target) break;
        if (availableCount > (newBox[colorId] || 0)) {
          newBox[colorId] = (newBox[colorId] || 0) + 1;
          currentTotal++;
          added = true;
        }
      }
      if (!added) break; // No more eggs available
    }

    setCurrentBox(newBox);
  };

  const packageBox = async () => {
    if (totalInBox === 0) {
      Alert.alert('Empty Carton', 'Add some eggs to the carton first');
      return;
    }

    // Basic validation - must have at least 1 egg and not exceed reasonable limits
    if (totalInBox < 1 || totalInBox > 30) {
      Alert.alert(
        'Invalid Carton Size',
        `Cartons must contain between 1 and 30 eggs. Current carton has ${totalInBox} eggs.`,
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Remove eggs from inventory
      for (const [colorId, quantity] of Object.entries(currentBox)) {
        if (quantity > 0) {
          await InventoryStorage.removeEggs(colorId, quantity);
        }
      }

      // Add to boxed eggs
      await BoxedEggsStorage.addBoxedEggs(currentBox, totalInBox);

      Alert.alert(
        'Carton Packaged!',
        `Created carton with ${totalInBox} eggs`,
        [
          {
            text: 'Create Another',
            onPress: () => {
              const emptyBox = {};
              EGG_COLORS.forEach(color => {
                emptyBox[color.id] = 0;
              });
              setCurrentBox(emptyBox);
              loadData();
            }
          },
          {
            text: 'Done',
            onPress: () => {
              const emptyBox = {};
              EGG_COLORS.forEach(color => {
                emptyBox[color.id] = 0;
              });
              setCurrentBox(emptyBox);
              loadData();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to package box');
    }
  };

  const clearBox = () => {
    if (totalInBox > 0) {
      Alert.alert(
        'Clear Carton',
        'Are you sure you want to clear the current carton?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear',
            onPress: () => {
              const emptyBox = {};
              EGG_COLORS.forEach(color => {
                emptyBox[color.id] = 0;
              });
              setCurrentBox(emptyBox);
            }
          }
        ]
      );
    }
  };

  // Get species-specific pack size defaults
  const getSpeciesPackSizes = (species) => {
    switch (species) {
      case 'chicken':
        return [6, 12, 18, 30];
      case 'duck':
        return [4, 6, 8, 12];
      case 'quail':
        return [12, 18, 24];
      case 'turkey':
        return [4, 6, 8];
      case 'guinea':
        return [6, 8, 12];
      default:
        return [6, 12, 18];
    }
  };

  // Quick pack by species
  const quickPackBySpecies = async (species, packSize) => {
    const speciesKey = `generic_${species}`;
    const availableEggs = speciesInventory[species] || 0;

    if (availableEggs < packSize) {
      Alert.alert(
        'Not Enough Eggs',
        `You need at least ${packSize} ${species} eggs to pack. You have ${availableEggs}.`
      );
      return;
    }

    const boxCount = Math.floor(availableEggs / packSize);
    const remaining = availableEggs % packSize;

    Alert.alert(
      `Pack ${species.charAt(0).toUpperCase() + species.slice(1)} Eggs`,
      `Pack ${boxCount} carton${boxCount !== 1 ? 's' : ''} of ${packSize} eggs?\n\n${remaining} eggs will remain unpacked.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: `Pack ${boxCount} Carton${boxCount !== 1 ? 's' : ''}`,
          onPress: async () => {
            try {
              const eggsToBox = boxCount * packSize;
              await InventoryStorage.removeEggs(speciesKey, eggsToBox);

              for (let i = 0; i < boxCount; i++) {
                const colorMix = {};
                colorMix[speciesKey] = packSize;
                await BoxedEggsStorage.addBoxedEggs(colorMix, packSize);
              }

              Alert.alert(
                'Success!',
                `Created ${boxCount} carton${boxCount !== 1 ? 's' : ''} of ${packSize} ${species} eggs. ${remaining} eggs remain unpacked.`,
                [{ text: 'OK', onPress: () => loadData() }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to pack eggs');
            }
          }
        }
      ]
    );
  };

  const showSpeedModePackDialog = () => {
    Alert.prompt(
      'Pack All Eggs - Custom Size',
      `You have ${totalEggs} eggs total.\n\nEnter carton size (1-30 eggs per carton):`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pack All',
          onPress: (input) => {
            const boxSize = parseInt(input) || 12;
            if (boxSize < 1 || boxSize > 30) {
              Alert.alert('Invalid Size', 'Carton size must be between 1 and 30 eggs');
              return;
            }
            packAllEggsWithSize(boxSize);
          },
        },
      ],
      'plain-text',
      '12',
      'numeric'
    );
  };

  const packAllEggsWithSize = async (boxSize) => {
    if (totalEggs < boxSize) {
      Alert.alert(
        'Not Enough Eggs',
        `You need at least ${boxSize} eggs to pack. You currently have ${totalEggs} eggs.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const boxCount = Math.floor(totalEggs / boxSize);
    const remaining = totalEggs % boxSize;

    Alert.alert(
      'Confirm Pack All',
      `This will create ${boxCount} cartons of ${boxSize} eggs each, leaving ${remaining} eggs unpacked.\n\nAre you sure you want to continue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pack All',
          onPress: async () => {
            try {
              const result = await SpeedModeStorage.packAllEggs();

              Alert.alert(
                'Success!',
                `Created ${boxCount} cartons of ${boxSize} eggs each. ${remaining} eggs remain unpacked.`,
                [{ text: 'OK', onPress: () => loadData() }]
              );
            } catch (error) {
              Alert.alert('Error', 'Failed to pack eggs');
            }
          },
        },
      ]
    );
  };

  const BoxingRow = ({ color }) => {
    const available = inventory[color.id] || 0;
    const inBox = currentBox[color.id] || 0;
    const remainingAvailable = available - inBox;

    return (
      <View style={styles.tableRow}>
        <Text style={styles.colorNameCell}>{color.name}</Text>
        <Text style={styles.availableCell}>{available}</Text>
        <Text style={styles.inBoxCell}>{inBox}</Text>
        <View style={styles.controlsCell}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => removeFromBox(color.id)}
            disabled={inBox === 0}
          >
            <Ionicons name="remove" size={18} color={inBox === 0 ? '#DDD' : colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.adjustButton, styles.addButton]}
            onPress={() => addToBox(color.id)}
            onLongPress={() => openCustomAdd(color.id)}
            disabled={remainingAvailable === 0}
          >
            <Ionicons name="add" size={18} color={remainingAvailable === 0 ? '#DDD' : 'white'} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const BoxedEggItem = ({ box }) => {
    const totalEggs = Object.values(box.colorMix).reduce((sum, count) => sum + count, 0);
    const colorCounts = Object.entries(box.colorMix)
      .filter(([_, count]) => count > 0)
      .map(([colorId, count]) => {
        const color = getColorById(colorId);
        if (colorId === 'generic') {
          return `${count} Mixed`;
        } else if (colorId === 'generic_chicken') {
          return `${count} Chicken`;
        } else if (colorId === 'generic_duck') {
          return `${count} Duck`;
        } else if (colorId === 'generic_quail') {
          return `${count} Quail`;
        } else if (colorId === 'generic_turkey') {
          return `${count} Turkey`;
        } else if (colorId === 'generic_guinea') {
          return `${count} Guinea`;
        }
        return `${count} ${color?.name}`;
      });

    // Determine species emoji based on carton contents
    const getSpeciesEmoji = () => {
      const colorIds = Object.keys(box.colorMix).filter(id => box.colorMix[id] > 0);
      if (colorIds.includes('generic_chicken')) return '🐔';
      if (colorIds.includes('generic_duck') || colorIds.includes('duck')) return '🦆';
      if (colorIds.includes('generic_quail') || colorIds.includes('quail')) return '🐦';
      if (colorIds.includes('generic_turkey') || colorIds.includes('turkey')) return '🦃';
      if (colorIds.includes('generic_guinea') || colorIds.includes('guinea')) return '🦜';
      return '🥚'; // Default for mixed or chicken eggs
    };

    const handlePrintLabel = async () => {
      // Show print options
      Alert.alert(
        'Print Label',
        'Choose your printing method:',
        [
          {
            text: 'Regular Printer',
            onPress: async () => await printBoxLabel(box)
          },
          {
            text: 'Bluetooth Thermal Printer',
            onPress: async () => await printToBluetoothThermalPrinter(box)
          },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    };

    return (
      <View style={styles.boxedItem}>
        <View style={styles.boxedHeader}>
          <View style={styles.boxedInfo}>
            <Text style={styles.boxedTitle}>{getSpeciesEmoji()} Carton #{box.id.slice(-4)}</Text>
            <Text style={styles.boxedCount}>{totalEggs} eggs</Text>
          </View>
          <TouchableOpacity
            style={styles.printButton}
            onPress={handlePrintLabel}
          >
            <Ionicons name="print" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.boxedDate}>
          Packaged: {new Date(box.dateBoxed).toLocaleDateString()}
        </Text>
        <Text style={styles.boxedContents}>
          {colorCounts.join(', ')}
        </Text>
      </View>
    );
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {speedMode ? '🚀 Speed Mode Packaging' : 'Package Eggs'}
        </Text>
        {speedMode && (
          <Text style={styles.totalCount}>
            Total: {totalEggs} eggs
          </Text>
        )}
      </View>

      <ScrollView style={styles.scrollView}>
        {speedMode ? (
          // Speed Mode UI - Pack by Species
          <View style={styles.section}>
            {/* Species Pack Cards */}
            {Object.entries(speciesInventory)
              .filter(([_, count]) => count > 0)
              .map(([species, count]) => (
                <View key={species} style={styles.speciesPackCard}>
                  <View style={styles.speciesPackHeader}>
                    <Text style={styles.speciesPackTitle}>
                      {species.charAt(0).toUpperCase() + species.slice(1)} Eggs
                    </Text>
                    <Text style={styles.speciesPackCount}>{count} available</Text>
                  </View>

                  <View style={styles.packSizeButtons}>
                    {getSpeciesPackSizes(species).map((size) => {
                      const boxCount = Math.floor(count / size);
                      const isDisabled = boxCount < 1;

                      return (
                        <TouchableOpacity
                          key={size}
                          style={[
                            styles.packSizeButton,
                            isDisabled && styles.disabledPackButton
                          ]}
                          onPress={() => quickPackBySpecies(species, size)}
                          disabled={isDisabled}
                        >
                          <Text style={[
                            styles.packSizeButtonText,
                            isDisabled && styles.disabledPackButtonText
                          ]}>
                            {size}
                          </Text>
                          <Text style={[
                            styles.packSizeBoxCount,
                            isDisabled && styles.disabledPackButtonText
                          ]}>
                            {boxCount} {boxCount === 1 ? 'carton' : 'cartons'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}

            {totalEggs === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="cube-outline" size={64} color={colors.border} />
                <Text style={styles.emptyText}>No eggs available to pack</Text>
                <Text style={styles.emptySubtext}>Collect some eggs first</Text>
              </View>
            )}
          </View>
        ) : (
          // Normal Mode UI
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Build Your Carton</Text>
              <Text style={styles.instructions}>
                Tap + to add eggs • Long press for custom quantity • Choose your pack size
              </Text>
            </View>

            {/* Pack Size Selection */}
            <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pack Size</Text>
            <Text style={styles.instructions}>
              Current: {totalInBox} eggs • Target: {targetPackSize} eggs
            </Text>

            {/* Quick Pack Buttons */}
            <View style={styles.quickPackContainer}>
              {getPackSizeSuggestions().map((size) => (
                <TouchableOpacity
                  key={size}
                  style={[
                    styles.quickPackButton,
                    parseInt(targetPackSize) === size && styles.quickPackButtonSelected
                  ]}
                  onPress={() => setPackSizeAndFill(size)}
                >
                  <Text style={[
                    styles.quickPackButtonText,
                    parseInt(targetPackSize) === size && styles.quickPackButtonTextSelected
                  ]}>
                    {size}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Custom Pack Size Input */}
            <View style={styles.customPackContainer}>
              <Text style={styles.customPackLabel}>Custom size:</Text>
              <TextInput
                style={styles.customPackInput}
                value={targetPackSize}
                onChangeText={setTargetPackSize}
                keyboardType="numeric"
                placeholder="12"
                placeholderTextColor={colors.textLight}
              />
              <TouchableOpacity
                style={styles.autoFillButton}
                onPress={() => autoFillToTarget()}
              >
                <Ionicons name="flash" size={16} color={colors.primary} />
                <Text style={styles.autoFillButtonText}>Auto Fill</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.headerCell, { flex: 2 }]}>Color</Text>
              <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>Avail</Text>
              <Text style={[styles.headerCell, { flex: 1, textAlign: 'center' }]}>In Carton</Text>
              <Text style={[styles.headerCell, { flex: 1.5, textAlign: 'center' }]}>Actions</Text>
            </View>
            {EGG_COLORS
              .filter(color => (inventory[color.id] || 0) > 0)
              .map((color) => (
                <BoxingRow key={color.id} color={color} />
              ))}
          </View>

          <View style={styles.boxActions}>
            <TouchableOpacity
              style={styles.clearButton}
              onPress={clearBox}
              disabled={totalInBox === 0}
            >
              <Ionicons name="trash-outline" size={20} color={totalInBox === 0 ? '#DDD' : '#666'} />
              <Text style={[styles.clearButtonText, totalInBox === 0 && styles.disabledText]}>
                Clear Carton
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.packageButton,
                (totalInBox === 0 || totalInBox > 30) && styles.disabledButton
              ]}
              onPress={packageBox}
              disabled={totalInBox === 0 || totalInBox > 30}
            >
              <Ionicons
                name="cube"
                size={20}
                color={(totalInBox === 0 || totalInBox > 30) ? '#DDD' : 'white'}
              />
              <Text style={[
                styles.packageButtonText,
                (totalInBox === 0 || totalInBox > 30) && styles.disabledText
              ]}>
                Package Carton
              </Text>
            </TouchableOpacity>
          </View>
          </>
        )}

        {/* Packaged Boxes Section (for both modes) */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Ready to Sell ({boxedEggs.length})</Text>
          </View>

          {boxedEggs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color="#DDD" />
              <Text style={styles.emptyText}>Nothing ready to sell yet</Text>
            </View>
          ) : (
            boxedEggs.map((box) => (
              <BoxedEggItem key={box.id} box={box} />
            ))
          )}
        </View>
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
              Add {selectedColor ? getColorById(selectedColor)?.name : ''} Eggs
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
                onPress={addCustomQuantity}
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
    backgroundColor: colors.surface,
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  totalCount: {
    fontSize: 18,
    color: colors.text,
    marginTop: 5,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  instructions: {
    color: colors.textLight,
    marginBottom: 15,
    textAlign: 'center',
  },
  tableContainer: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: colors.secondary,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'center',
  },
  headerCell: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.text,
  },
  colorNameCell: {
    flex: 2,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  availableCell: {
    flex: 1,
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
  },
  inBoxCell: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  controlsCell: {
    flex: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  adjustButton: {
    backgroundColor: colors.secondary,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 2,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  addButton: {
    backgroundColor: '#8B4513',
    borderColor: colors.primary,
  },
  boxActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  clearButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  clearButtonText: {
    marginLeft: 8,
    color: colors.textLight,
    fontWeight: '600',
  },
  packageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#8B4513',
    borderRadius: 8,
    marginLeft: 10,
  },
  packageButtonText: {
    marginLeft: 8,
    color: 'white',
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: '#DDD',
  },
  disabledText: {
    color: '#DDD',
  },
  boxedItem: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  boxedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  boxedInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boxedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  boxedCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  printButton: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  boxedDate: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 5,
  },
  boxedContents: {
    fontSize: 14,
    color: '#333',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    color: colors.textLight,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    padding: 20,
    borderRadius: 10,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
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
    backgroundColor: '#8B4513',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginLeft: 10,
  },
  modalCancelText: {
    color: colors.textLight,
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
    padding: 40,
    marginTop: 20,
  },
  speedModeDisplay: {
    alignItems: 'center',
    marginBottom: 40,
  },
  speedModeTotalEggs: {
    fontSize: 64,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 10,
  },
  speedModeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 5,
    marginBottom: 10,
  },
  speedModeBoxInfo: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.accent,
    marginTop: 10,
  },
  speedModeRemainder: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 5,
  },
  packAllButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    minWidth: 200,
  },
  packAllButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  // Pack size selection styles
  quickPackContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginVertical: 10,
    gap: 8,
  },
  quickPackButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  quickPackButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickPackButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  quickPackButtonTextSelected: {
    color: colors.textOnPrimary,
  },
  customPackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    gap: 10,
  },
  customPackLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  customPackInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    textAlign: 'center',
    minWidth: 60,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  autoFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 4,
  },
  autoFillButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  // Species pack card styles
  speciesPackCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  speciesPackHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  speciesPackTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  speciesPackCount: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  packSizeButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 10,
  },
  packSizeButton: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    minWidth: 70,
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
  disabledPackButton: {
    backgroundColor: colors.border,
    opacity: 0.5,
  },
  packSizeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.textOnPrimary,
    marginBottom: 4,
  },
  packSizeBoxCount: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textOnPrimary,
  },
  disabledPackButtonText: {
    color: colors.textLight,
  },
});

export default Boxing;