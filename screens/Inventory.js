import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  TextInput
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { EGG_COLORS, getColorById } from '../data/eggColors';
import { InventoryStorage, SpeedModeStorage } from '../data/storage';
import { getColors } from '../utils/themes';

const Inventory = () => {
  const [inventory, setInventory] = useState({});
  const [refreshing, setRefreshing] = useState(false);
  const [totalEggs, setTotalEggs] = useState(0);
  const [colors, setColors] = useState(getColors());
  const [speedMode, setSpeedMode] = useState(false);

  const loadInventory = async () => {
    try {
      // Load speed mode setting
      const isSpeedMode = await SpeedModeStorage.getSpeedMode();
      setSpeedMode(isSpeedMode);

      const currentInventory = await InventoryStorage.getInventory();
      setInventory(currentInventory);

      const total = Object.values(currentInventory).reduce((sum, count) => sum + count, 0);
      setTotalEggs(total);
    } catch (error) {
      Alert.alert('Error', 'Failed to load inventory');
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInventory();
      // Refresh colors when screen comes into focus
      setColors(getColors());
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadInventory();
    setRefreshing(false);
  };

  const showAdjustmentDialog = (colorId) => {
    const colorName = getColorById(colorId)?.name || 'eggs';
    const currentAmount = inventory[colorId] || 0;

    Alert.prompt(
      'Adjust Inventory',
      `Current: ${currentAmount} ${colorName.toLowerCase()}\n\nEnter adjustment amount:\n• Positive numbers to add\n• Negative numbers to remove\n\nNote: Collection is the recommended way to update inventory.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: (input) => {
            const change = parseInt(input) || 0;
            if (change === 0) {
              Alert.alert('Invalid Input', 'Please enter a valid number');
              return;
            }
            confirmAdjustment(colorId, change, colorName);
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const confirmAdjustment = async (colorId, change, colorName) => {
    try {
      const currentAmount = inventory[colorId] || 0;
      const newAmount = currentAmount + change;

      if (newAmount < 0) {
        Alert.alert('Invalid', `Cannot adjust by ${change}. Would result in negative inventory (${newAmount}).`);
        return;
      }

      const action = change > 0 ? 'add' : 'remove';
      const amount = Math.abs(change);

      Alert.alert(
        'Confirm Inventory Adjustment',
        `${action.toUpperCase()} ${amount} ${colorName.toLowerCase()}\n\nFrom: ${currentAmount} → To: ${newAmount}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Confirm',
            onPress: async () => {
              try {
                if (change > 0) {
                  await InventoryStorage.addEggs(colorId, change);
                } else {
                  await InventoryStorage.removeEggs(colorId, Math.abs(change));
                }
                await loadInventory();
              } catch (error) {
                Alert.alert('Error', 'Failed to update inventory');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update inventory');
    }
  };

  const showSpeedModeAdjustmentDialog = () => {
    Alert.prompt(
      'Adjust Total Inventory',
      `Current: ${totalEggs} eggs\n\nEnter adjustment amount:\n• Positive numbers to add\n• Negative numbers to remove\n\nNote: Collection is the recommended way to update inventory.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: (input) => {
            const change = parseInt(input) || 0;
            if (change === 0) {
              Alert.alert('Invalid Input', 'Please enter a valid number');
              return;
            }
            confirmSpeedModeAdjustment(change);
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const confirmSpeedModeAdjustment = async (change) => {
    try {
      const newTotal = totalEggs + change;

      if (newTotal < 0) {
        Alert.alert('Invalid', `Cannot adjust by ${change}. Would result in negative inventory (${newTotal}).`);
        return;
      }

      const action = change > 0 ? 'add' : 'remove';
      const amount = Math.abs(change);

      Alert.alert(
        'Confirm Inventory Adjustment',
        `${action.toUpperCase()} ${amount} egg${amount !== 1 ? 's' : ''}\n\nFrom: ${totalEggs} → To: ${newTotal}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Confirm',
            onPress: async () => {
              try {
                if (change > 0) {
                  await SpeedModeStorage.addTotalEggs(change);
                } else {
                  await InventoryStorage.removeEggs('generic', Math.abs(change));
                }
                await loadInventory();
              } catch (error) {
                Alert.alert('Error', 'Failed to update inventory');
              }
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to update inventory');
    }
  };

  const InventoryRow = ({ color }) => {
    const count = inventory[color.id] || 0;
    const percentage = totalEggs > 0 ? (count / totalEggs * 100) : 0;

    return (
      <View style={styles.tableRow}>
        <Text style={styles.colorNameCell}>{color.name}</Text>
        <Text style={styles.countCell}>{count}</Text>
        <Text style={styles.percentageCell}>{percentage.toFixed(1)}%</Text>
        <View style={styles.controlsCell}>
          <TouchableOpacity
            style={styles.adjustButton}
            onPress={() => showAdjustmentDialog(color.id)}
          >
            <Ionicons name="create-outline" size={18} color={colors.primary} />
            <Text style={styles.adjustButtonText}>Adjust</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const getSortedColors = () => {
    return EGG_COLORS
      .filter(color => (inventory[color.id] || 0) > 0) // Only show colors with inventory
      .sort((a, b) => {
        const countA = inventory[a.id] || 0;
        const countB = inventory[b.id] || 0;
        return countB - countA; // Sort by count descending
      });
  };

  const getInventoryStats = () => {
    const nonZeroColors = Object.entries(inventory).filter(([_, count]) => count > 0).length;
    const mostCommon = getSortedColors()[0];
    const mostCommonCount = inventory[mostCommon?.id] || 0;

    return {
      varietiesInStock: nonZeroColors,
      mostCommon: mostCommonCount > 0 ? mostCommon : null,
      mostCommonCount
    };
  };

  const stats = getInventoryStats();
  const styles = createStyles(colors);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {speedMode ? '🚀 Speed Mode Inventory' : 'Current Inventory'}
        </Text>
        <Text style={styles.totalCount}>{totalEggs} total eggs</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {totalEggs === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="basket-outline" size={64} color="#DDD" />
            <Text style={styles.emptyTitle}>No eggs in inventory</Text>
            <Text style={styles.emptySubtitle}>
              Start collecting eggs to see them here
            </Text>
          </View>
        ) : speedMode ? (
          // Speed Mode UI
          <View style={styles.speedModeContainer}>
            <View style={styles.speedModeDisplay}>
              <Ionicons name="egg" size={64} color={colors.primary} />
              <Text style={styles.speedModeTotalCount}>{totalEggs}</Text>
              <Text style={styles.speedModeLabel}>Total Eggs</Text>
            </View>

            <View style={styles.speedModeControls}>
              <TouchableOpacity
                style={styles.speedModeAdjustButton}
                onPress={showSpeedModeAdjustmentDialog}
              >
                <Ionicons name="create-outline" size={24} color={colors.primary} />
                <Text style={styles.speedModeAdjustButtonText}>Adjust Inventory</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Normal Mode UI
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={styles.headerCell}>Color</Text>
              <Text style={styles.headerCell}>Count</Text>
              <Text style={styles.headerCell}>%</Text>
              <Text style={styles.headerCell}>Actions</Text>
            </View>
            {getSortedColors().map((color) => (
              <InventoryRow key={color.id} color={color} />
            ))}
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {speedMode
              ? 'Pull down to refresh • Tap buttons to adjust quantities'
              : 'Pull down to refresh • Tap +/- to adjust quantities'
            }
          </Text>
        </View>
      </ScrollView>
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
  statsRow: {
    flexDirection: 'row',
    marginTop: 15,
    justifyContent: 'center',
  },
  statItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textLight,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  tableContainer: {
    backgroundColor: colors.surface,
    margin: 15,
    borderRadius: 10,
    shadowColor: colors.shadow,
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
    borderBottomColor: colors.border,
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
  countCell: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
  },
  percentageCell: {
    flex: 1,
    fontSize: 14,
    color: colors.textLight,
    textAlign: 'center',
  },
  controlsCell: {
    flex: 1.5,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  adjustButton: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  adjustButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: colors.textLight,
    textAlign: 'center',
    marginTop: 10,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: colors.textLight,
    fontSize: 14,
    textAlign: 'center',
  },
  speedModeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    flex: 1,
  },
  speedModeDisplay: {
    alignItems: 'center',
    marginBottom: 40,
  },
  speedModeTotalCount: {
    fontSize: 72,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 10,
  },
  speedModeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginTop: 5,
  },
  speedModeControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 15,
  },
  speedModeAdjustButton: {
    backgroundColor: colors.surface,
    borderRadius: 15,
    paddingHorizontal: 20,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  speedModeAdjustButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginLeft: 8,
  },
});

export default Inventory;