import React, { useState, useCallback, useRef } from 'react';
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
import { BoxedEggsStorage } from '../data/storage';
import { getColors } from '../utils/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { printBoxLabel } from '../utils/printing';

const Sales = () => {
  const scrollViewRef = useRef(null);
  const [colors, setColors] = useState(getColors());
  const [boxedEggs, setBoxedEggs] = useState([]);
  const [soldBoxes, setSoldBoxes] = useState([]);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedBox, setSelectedBox] = useState(null);
  const [selectedBoxes, setSelectedBoxes] = useState([]);
  const [customer, setCustomer] = useState('');
  const [price, setPrice] = useState('');

  const loadData = async () => {
    try {
      const allBoxes = await BoxedEggsStorage.getBoxedEggs();
      const unsold = allBoxes.filter(box => !box.sold);
      const sold = allBoxes.filter(box => box.sold);

      setBoxedEggs(unsold);
      setSoldBoxes(sold);
    } catch (error) {
      Alert.alert('Error', 'Failed to load data');
    }
  };

  const loadSavedPrices = async () => {
    try {
      const savedHalfDozenPrice = await AsyncStorage.getItem('half_dozen_price');
      const savedDozenPrice = await AsyncStorage.getItem('dozen_price');

      return {
        halfDozenPrice: savedHalfDozenPrice ? parseFloat(savedHalfDozenPrice) : 3.00,
        dozenPrice: savedDozenPrice ? parseFloat(savedDozenPrice) : 6.00
      };
    } catch (error) {
      console.error('Error loading saved prices:', error);
      // Return default prices if loading fails
      return {
        halfDozenPrice: 3.00,
        dozenPrice: 6.00
      };
    }
  };

  const calculateAutoPrice = async (boxes) => {
    const prices = await loadSavedPrices();

    if (!Array.isArray(boxes)) {
      // Single box
      const totalEggs = Object.values(boxes.colorMix).reduce((sum, count) => sum + count, 0);

      if (totalEggs === 6) {
        return prices.halfDozenPrice.toFixed(2);
      } else if (totalEggs === 12) {
        return prices.dozenPrice.toFixed(2);
      } else {
        // Calculate proportional price based on dozen price (price per egg * egg count)
        const pricePerEgg = prices.dozenPrice / 12;
        return (pricePerEgg * totalEggs).toFixed(2);
      }
    } else {
      // Multiple boxes
      let totalPrice = 0;

      for (const box of boxes) {
        const totalEggs = Object.values(box.colorMix).reduce((sum, count) => sum + count, 0);

        if (totalEggs === 6) {
          totalPrice += prices.halfDozenPrice;
        } else if (totalEggs === 12) {
          totalPrice += prices.dozenPrice;
        } else {
          // Calculate proportional price
          const pricePerEgg = prices.dozenPrice / 12;
          totalPrice += (pricePerEgg * totalEggs);
        }
      }

      return totalPrice.toFixed(2);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setColors(getColors());
      loadData();

      // Scroll to top whenever the tab is focused
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({ y: 0, animated: false });
      }
    }, [])
  );

  const toggleBoxSelection = (boxId) => {
    setSelectedBoxes(prev => {
      if (prev.includes(boxId)) {
        return prev.filter(id => id !== boxId);
      } else {
        return [...prev, boxId];
      }
    });
  };

  const openSaleModal = async (box = null) => {
    if (box) {
      // Single box sale
      setSelectedBox(box);
      setSelectedBoxes([]);

      // Auto-populate price for single box
      const autoPrice = await calculateAutoPrice(box);
      setPrice(autoPrice);
    } else {
      // Multiple box sale
      setSelectedBox(null);

      // Auto-populate price for multiple boxes
      const boxesToSell = boxedEggs.filter(boxItem => selectedBoxes.includes(boxItem.id));
      const autoPrice = await calculateAutoPrice(boxesToSell);
      setPrice(autoPrice);
    }
    setCustomer('');
    setShowSaleModal(true);
  };

  const openBundledSaleModal = () => {
    if (selectedBoxes.length === 0) {
      Alert.alert('No Selection', 'Please select boxes to sell');
      return;
    }
    openSaleModal();
  };

  const markAsSold = async () => {
    if (!customer.trim()) {
      Alert.alert('Error', 'Please enter customer name');
      return;
    }

    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    try {
      if (selectedBox) {
        // Single box sale
        await BoxedEggsStorage.markAsSold(selectedBox.id, customer.trim(), priceValue);
        Alert.alert(
          'Sale Recorded!',
          `Sold carton to ${customer.trim()} for $${priceValue.toFixed(2)}`
        );
      } else {
        // Multiple box sale
        const boxesToSell = boxedEggs.filter(box => selectedBoxes.includes(box.id));
        const totalEggs = boxesToSell.reduce((total, box) => {
          return total + Object.values(box.colorMix).reduce((sum, count) => sum + count, 0);
        }, 0);

        // Mark each box as sold with the same customer and proportional price
        const pricePerBox = priceValue / selectedBoxes.length;

        for (const boxId of selectedBoxes) {
          await BoxedEggsStorage.markAsSold(boxId, customer.trim(), pricePerBox);
        }

        Alert.alert(
          'Bundled Sale Recorded!',
          `Sold ${selectedBoxes.length} cartons (${totalEggs} eggs) to ${customer.trim()} for $${priceValue.toFixed(2)}`
        );
        setSelectedBoxes([]);
      }

      setShowSaleModal(false);
      loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to record sale');
    }
  };

  const getTotalRevenue = () => {
    return soldBoxes.reduce((total, box) => total + (box.price || 0), 0);
  };

  const getTotalEggsSold = () => {
    return soldBoxes.reduce((total, box) => {
      const eggCount = Object.values(box.colorMix).reduce((sum, count) => sum + count, 0);
      return total + eggCount;
    }, 0);
  };

  const getAveragePrice = () => {
    if (soldBoxes.length === 0) return 0;
    return getTotalRevenue() / soldBoxes.length;
  };

  const UnsoldBoxItem = ({ box }) => {
    const totalEggs = Object.values(box.colorMix).reduce((sum, count) => sum + count, 0);
    const colorCounts = Object.entries(box.colorMix)
      .filter(([_, count]) => count > 0)
      .map(([colorId, count]) => {
        const colorData = require('../data/eggColors').EGG_COLORS.find(c => c.id === colorId);
        return `${count} ${colorData?.name}`;
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

    const isSelected = selectedBoxes.includes(box.id);

    return (
      <View style={[styles.boxItem, isSelected && styles.selectedBoxItem]}>
        <View style={styles.boxHeader}>
          <View style={styles.boxTitleRow}>
            <TouchableOpacity
              style={styles.checkbox}
              onPress={() => toggleBoxSelection(box.id)}
            >
              <Ionicons
                name={isSelected ? "checkbox" : "square-outline"}
                size={24}
                color={isSelected ? colors.success : colors.text}
              />
            </TouchableOpacity>
            <Text style={styles.boxTitle}>{getSpeciesEmoji()} Carton #{box.id.slice(-4)}</Text>
          </View>
          <Text style={styles.boxCount}>{totalEggs} eggs</Text>
        </View>

        <Text style={styles.boxDate}>
          Packaged: {new Date(box.dateBoxed).toLocaleDateString()}
        </Text>

        <TouchableOpacity
          style={styles.sellButton}
          onPress={() => openSaleModal(box)}
        >
          <Ionicons name="cash" size={20} color={colors.textOnAccent} />
          <Text style={styles.sellButtonText}>Sell Individual</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const SoldBoxItem = ({ box }) => {
    const totalEggs = Object.values(box.colorMix).reduce((sum, count) => sum + count, 0);
    const colorCounts = Object.entries(box.colorMix)
      .filter(([_, count]) => count > 0)
      .map(([colorId, count]) => {
        const colorData = require('../data/eggColors').EGG_COLORS.find(c => c.id === colorId);
        if (colorId === 'generic') {
          return `${count} Mixed`;
        }
        return `${count} ${colorData?.name}`;
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

    const handleReprintLabel = async () => {
      await printBoxLabel(box);
    };

    return (
      <View style={styles.soldBoxItem}>
        <View style={styles.boxHeader}>
          <View style={styles.boxInfo}>
            <Text style={styles.boxTitle}>{getSpeciesEmoji()} Carton #{box.id.slice(-4)}</Text>
            <Text style={styles.salePrice}>${box.price?.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={styles.reprintButton}
            onPress={handleReprintLabel}
          >
            <Ionicons name="print" size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.saleInfo}>
          <Text style={styles.customer}>Customer: {box.customer}</Text>
          <Text style={styles.saleDate}>
            Sold: {new Date(box.soldDate).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Sales & Records</Text>

        <View style={styles.statsRow}>
          <View style={styles.mainStat}>
            <Text style={styles.mainStatValue}>{boxedEggs.length}</Text>
            <Text style={styles.mainStatLabel}>Ready to Sell</Text>
          </View>

          <View style={styles.secondaryStat}>
            <Text style={styles.secondaryStatValue}>${getTotalRevenue().toFixed(2)}</Text>
            <Text style={styles.secondaryStatLabel}>Total Revenue</Text>
          </View>
        </View>
      </View>

      <ScrollView ref={scrollViewRef} style={styles.scrollView}>
        <View style={styles.primarySection}>
          <Text style={styles.primarySectionTitle}>
            📦 Sell Cartons ({boxedEggs.length} available)
          </Text>

          {boxedEggs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>No cartons ready for sale</Text>
              <Text style={styles.emptySubtext}>Package some eggs first</Text>
            </View>
          ) : (
            <>
              {boxedEggs.map((box) => (
                <UnsoldBoxItem key={box.id} box={box} />
              ))}

              {selectedBoxes.length > 0 && (
                <TouchableOpacity
                  style={styles.sellSelectedButton}
                  onPress={openBundledSaleModal}
                >
                  <Ionicons name="cash" size={24} color={colors.textOnAccent} />
                  <Text style={styles.sellSelectedText}>
                    Sell Selected ({selectedBoxes.length} cartons)
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </View>

        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>
            📊 Sales History & Analytics
          </Text>

          <View style={styles.historyStats}>
            <View style={styles.historyStatItem}>
              <Text style={styles.historyStatValue}>{soldBoxes.length}</Text>
              <Text style={styles.historyStatLabel}>Cartons Sold</Text>
            </View>
            <View style={styles.historyStatItem}>
              <Text style={styles.historyStatValue}>{getTotalEggsSold()}</Text>
              <Text style={styles.historyStatLabel}>Eggs Sold</Text>
            </View>
            <View style={styles.historyStatItem}>
              <Text style={styles.historyStatValue}>${getAveragePrice().toFixed(2)}</Text>
              <Text style={styles.historyStatLabel}>Avg Price/Carton</Text>
            </View>
          </View>

          {soldBoxes.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={colors.border} />
              <Text style={styles.emptyText}>No sales recorded yet</Text>
            </View>
          ) : (
            <>
              <Text style={styles.recentSalesTitle}>Recent Sales</Text>
              {soldBoxes
                .sort((a, b) => new Date(b.soldDate) - new Date(a.soldDate))
                .map((box) => (
                  <SoldBoxItem key={box.id} box={box} />
                ))}
            </>
          )}
        </View>
      </ScrollView>

      {/* Sale Modal */}
      <Modal
        visible={showSaleModal}
        transparent={true}
        animationType="slide"
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {selectedBox ? 'Record Sale' : 'Record Bundled Sale'}
              </Text>

              {selectedBox ? (
                <Text style={styles.modalSubtitle}>
                  Carton #{selectedBox.id.slice(-4)} • {Object.values(selectedBox.colorMix).reduce((sum, count) => sum + count, 0)} eggs
                </Text>
              ) : (
                <Text style={styles.modalSubtitle}>
                  {selectedBoxes.length} cartons • {boxedEggs
                    .filter(box => selectedBoxes.includes(box.id))
                    .reduce((total, box) => total + Object.values(box.colorMix).reduce((sum, count) => sum + count, 0), 0)} eggs total
                </Text>
              )}

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Customer Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={customer}
                  onChangeText={setCustomer}
                  placeholder="Enter customer name"
                  placeholderTextColor={colors.textLight}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Sale Price ($)</Text>
                <TextInput
                  style={styles.textInput}
                  value={price}
                  onChangeText={setPrice}
                  placeholder="0.00"
                  placeholderTextColor={colors.textLight}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowSaleModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmButton}
                  onPress={markAsSold}
                >
                  <Text style={styles.modalConfirmText}>Record Sale</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.secondary,
  },
  header: {
    backgroundColor: colors.surface,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  mainStat: {
    backgroundColor: colors.success,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  mainStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.textOnAccent,
  },
  mainStatLabel: {
    fontSize: 14,
    color: colors.textOnAccent,
    marginTop: 5,
    fontWeight: '600',
  },
  secondaryStat: {
    backgroundColor: colors.surface,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    borderWidth: 2,
    borderColor: colors.border,
  },
  secondaryStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  secondaryStatLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 5,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 15,
  },
  primarySection: {
    padding: 15,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  primarySectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.success,
    marginBottom: 15,
  },
  historySection: {
    padding: 15,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  historySectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  historyStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  historyStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  historyStatLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 5,
    textAlign: 'center',
  },
  recentSalesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 10,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  boxItem: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 2,
  },
  selectedBoxItem: {
    borderWidth: 2,
    borderColor: colors.success,
    backgroundColor: colors.secondary,
  },
  boxTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    marginRight: 10,
  },
  soldBoxItem: {
    backgroundColor: colors.background,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  boxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  boxInfo: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  reprintButton: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boxCount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  salePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.success,
  },
  boxDate: {
    fontSize: 12,
    color: colors.textLight,
    marginBottom: 5,
  },
  saleInfo: {
    marginBottom: 8,
  },
  customer: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  saleDate: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  boxContents: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 12,
  },
  sellButton: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  sellButtonText: {
    color: colors.textOnAccent,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  sellSelectedButton: {
    backgroundColor: colors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sellSelectedText: {
    color: colors.textOnAccent,
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 10,
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    marginTop: 5,
    color: colors.textLight,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  scrollContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: colors.surface,
    padding: 25,
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: colors.background,
    color: colors.text,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalCancelButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: colors.success,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  modalCancelText: {
    color: colors.textLight,
    fontSize: 16,
    fontWeight: '600',
  },
  modalConfirmText: {
    color: colors.textOnAccent,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default Sales;