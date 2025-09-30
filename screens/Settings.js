import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getColors, THEME_OPTIONS, setCurrentTheme } from '../utils/themes';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { emailSalesData } from '../utils/dataExport';
import { EGG_COLORS } from '../data/eggColors';
import { createBackup, emailBackup, shareBackup, restoreFromBackup } from '../utils/backupRestore';
import { SpeedModeStorage, FlockManagement } from '../data/storage';

const Settings = () => {
  const [selectedTheme, setSelectedTheme] = useState('ORANGE_DRIP');
  const [darkMode, setDarkMode] = useState(false);
  const [colors, setColors] = useState(getColors());
  const [halfDozenPrice, setHalfDozenPrice] = useState('3.00');
  const [dozenPrice, setDozenPrice] = useState('6.00');
  const [userEmail, setUserEmail] = useState('');
  const [prices, setPrices] = useState({
    chicken_6: '3.00',
    chicken_12: '6.00',
    quail_12: '8.00',
    duck_4: '4.00',
    duck_6: '6.00',
    duck_12: '12.00',
    turkey_4: '8.00',
    turkey_6: '12.00',
    guinea_4: '5.00',
    guinea_6: '7.50',
    guinea_12: '15.00'
  });
  const [enabledColors, setEnabledColors] = useState({});
  const [speedMode, setSpeedMode] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [confirmationKeyword, setConfirmationKeyword] = useState('');
  const [flockCounts, setFlockCounts] = useState({
    laying_hens: 0,
    ducks: 0,
    quail: 0,
    turkeys: 0,
    guinea_fowl: 0
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('selected_theme');
      const savedDarkMode = await AsyncStorage.getItem('dark_mode');
      const savedHalfDozenPrice = await AsyncStorage.getItem('half_dozen_price');
      const savedDozenPrice = await AsyncStorage.getItem('dozen_price');
      const savedUserEmail = await AsyncStorage.getItem('user_email');
      const savedEnabledColors = await AsyncStorage.getItem('enabled_colors');
      const savedSpeedMode = await SpeedModeStorage.getSpeedMode();
      const savedPrices = await AsyncStorage.getItem('species_prices');

      if (savedTheme) {
        setSelectedTheme(savedTheme);
      } else {
        setSelectedTheme('PINK_AUTUMN'); // Default fallback
      }
      if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));
      if (savedHalfDozenPrice) setHalfDozenPrice(savedHalfDozenPrice);
      if (savedDozenPrice) setDozenPrice(savedDozenPrice);
      if (savedUserEmail) setUserEmail(savedUserEmail);
      if (savedPrices) setPrices(JSON.parse(savedPrices));
      setSpeedMode(savedSpeedMode);

      // Load enabled colors or default to all enabled
      if (savedEnabledColors) {
        setEnabledColors(JSON.parse(savedEnabledColors));
      } else {
        // Default: enable all colors for new users
        const defaultEnabled = {};
        EGG_COLORS.forEach(color => {
          defaultEnabled[color.id] = true;
        });
        setEnabledColors(defaultEnabled);
      }

      // Load flock counts
      const savedFlockCounts = await FlockManagement.getFlockCounts();
      setFlockCounts(savedFlockCounts);

      // Apply loaded settings immediately
      if (savedTheme || savedDarkMode) {
        const themeKey = savedTheme || 'ORANGE_DRIP';
        const isDarkMode = savedDarkMode ? JSON.parse(savedDarkMode) : false;
        const newColors = setCurrentTheme(themeKey, isDarkMode);
        setColors(newColors);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveTheme = async (themeKey) => {
    try {
      if (!themeKey) {
        console.error('Invalid theme key:', themeKey);
        return;
      }

      await AsyncStorage.setItem('selected_theme', themeKey);
      setSelectedTheme(themeKey);

      // Apply theme immediately
      const newColors = setCurrentTheme(themeKey, darkMode);
      setColors(newColors);
    } catch (error) {
      console.error('Error saving theme:', error);
      Alert.alert('Error', 'Failed to save theme setting');
    }
  };

  const toggleDarkMode = async (value) => {
    try {
      await AsyncStorage.setItem('dark_mode', JSON.stringify(value));
      setDarkMode(value);

      // Apply dark mode immediately
      const newColors = setCurrentTheme(selectedTheme, value);
      setColors(newColors);
    } catch (error) {
      console.error('Error saving dark mode setting:', error);
    }
  };

  const savePricing = async (priceType, value) => {
    try {
      const storageKey = priceType === 'half_dozen' ? 'half_dozen_price' : 'dozen_price';
      await AsyncStorage.setItem(storageKey, value);

      if (priceType === 'half_dozen') {
        setHalfDozenPrice(value);
      } else {
        setDozenPrice(value);
      }
    } catch (error) {
      console.error('Error saving price setting:', error);
    }
  };

  const saveSpeciesPrice = async (priceKey, value) => {
    try {
      const newPrices = { ...prices, [priceKey]: value };
      setPrices(newPrices);
      await AsyncStorage.setItem('species_prices', JSON.stringify(newPrices));
    } catch (error) {
      console.error('Error saving species price:', error);
    }
  };

  const saveEmail = async (email) => {
    try {
      await AsyncStorage.setItem('user_email', email);
      setUserEmail(email);
    } catch (error) {
      console.error('Error saving email:', error);
    }
  };

  const toggleColorEnabled = async (colorId, enabled) => {
    try {
      const newEnabledColors = {
        ...enabledColors,
        [colorId]: enabled
      };

      setEnabledColors(newEnabledColors);
      await AsyncStorage.setItem('enabled_colors', JSON.stringify(newEnabledColors));
    } catch (error) {
      console.error('Error saving enabled colors:', error);
    }
  };

  const toggleSpeedMode = async (enabled) => {
    try {
      await SpeedModeStorage.setSpeedMode(enabled);
      setSpeedMode(enabled);

      if (!enabled) {
        Alert.alert(
          'Color Tracking Enabled',
          'You can now track individual egg colors for chickens! Use the Collection screen to log eggs by color.',
          [{ text: 'Got it!' }]
        );
      }
    } catch (error) {
      console.error('Error saving color tracking setting:', error);
      Alert.alert('Error', 'Failed to save color tracking setting');
    }
  };

  const updateFlockCount = async (species, value) => {
    try {
      const count = parseInt(value) || 0;
      const success = await FlockManagement.updateSpeciesCount(species, count);

      if (success) {
        setFlockCounts(prev => ({
          ...prev,
          [species]: count
        }));
      } else {
        Alert.alert('Error', 'Failed to save flock count');
      }
    } catch (error) {
      console.error('Error updating flock count:', error);
      Alert.alert('Error', 'Failed to update flock count');
    }
  };

  const handleExportData = async () => {
    if (userEmail && userEmail.trim() !== '') {
      // If email is saved, confirm and send
      Alert.alert(
        'Export Data',
        `Send data to ${userEmail}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: () => exportToEmail(userEmail)
          },
          {
            text: 'Use Different Email',
            onPress: () => promptForEmail()
          }
        ]
      );
    } else {
      // No email saved, inform user to set it up
      Alert.alert(
        'No Email Address',
        'Please set your email address in Settings to enable quick export.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Set Email Now',
            onPress: () => promptToSetEmail()
          },
          {
            text: 'Use Default Mail',
            onPress: () => exportWithDefaultMail()
          }
        ]
      );
    }
  };

  const promptToSetEmail = () => {
    Alert.prompt(
      'Set Your Email Address',
      'Enter your email address for quick data exports:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: (email) => {
            if (email && email.includes('@')) {
              saveEmail(email);
              Alert.alert('Email Saved', 'You can now use quick export!');
            } else {
              Alert.alert('Invalid Email', 'Please enter a valid email address');
            }
          }
        }
      ],
      'plain-text',
      '',
      'email-address'
    );
  };

  const exportWithDefaultMail = async () => {
    try {
      const result = await emailSalesData();
      if (result.status === 'sent') {
        Alert.alert('Success', 'Data exported successfully!');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to export data: ${error.message}`);
    }
  };

  const promptForEmail = () => {
    Alert.prompt(
      'Enter Email Address',
      'Enter the email address to send the export to:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: (email) => exportToEmail(email)
        }
      ],
      'plain-text',
      '',
      'email-address'
    );
  };

  const exportToEmail = async (email) => {
    if (!email || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    try {
      const result = await emailSalesData(email);
      if (result.status === 'sent') {
        Alert.alert('Success', 'Data exported successfully!');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to export data: ${error.message}`);
    }
  };

  const handleClearData = () => {
    // First confirmation with warning
    Alert.alert(
      '⚠️ Clear All Data',
      'This will permanently delete ALL your data including:\n\n• Egg inventory\n• Packaged boxes\n• Sales history\n• Collection records\n• Settings\n\nWARNING: Export your data first if you want to keep a backup!\n\nThis action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export Data First',
          onPress: handleExportData
        },
        {
          text: 'Continue to Delete',
          style: 'destructive',
          onPress: () => setShowClearDataModal(true)
        }
      ]
    );
  };

  const clearAllData = async () => {
    if (confirmationKeyword.toLowerCase() !== 'delete') {
      Alert.alert('Incorrect Keyword', 'Please type "DELETE" to confirm');
      return;
    }

    try {
      // Clear all AsyncStorage data
      const keysToRemove = [
        'egg_inventory',
        'boxed_eggs',
        'sales_history',
        'daily_collections',
        'selected_theme',
        'dark_mode',
        'half_dozen_price',
        'dozen_price',
        'user_email',
        'enabled_colors',
        'speed_mode',
        'flock_head_counts',
        'species_prices'
      ];

      await AsyncStorage.multiRemove(keysToRemove);

      // Reset local state to defaults
      setSelectedTheme('PINK_AUTUMN');
      setDarkMode(false);
      setHalfDozenPrice('3.00');
      setDozenPrice('6.00');
      setUserEmail('');
      setSpeedMode(false);
      setFlockCounts({
        laying_hens: 0,
        ducks: 0,
        quail: 0,
        turkeys: 0,
        guinea_fowl: 0
      });
      setPrices({
        chicken_6: '3.00',
        chicken_12: '6.00',
        quail_12: '8.00',
        duck_4: '4.00',
        duck_6: '6.00',
        duck_12: '12.00',
        turkey_4: '8.00',
        turkey_6: '12.00',
        guinea_4: '5.00',
        guinea_6: '7.50',
        guinea_12: '15.00'
      });

      // Reset enabled colors to all enabled
      const defaultEnabled = {};
      EGG_COLORS.forEach(color => {
        defaultEnabled[color.id] = true;
      });
      setEnabledColors(defaultEnabled);

      // Reset theme to default
      const defaultColors = setCurrentTheme('PINK_AUTUMN', false);
      setColors(defaultColors);

      setShowClearDataModal(false);
      setConfirmationKeyword('');

      Alert.alert(
        'Data Cleared',
        'All data has been permanently deleted. The app has been reset to its initial state.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error clearing data:', error);
      Alert.alert('Error', 'Failed to clear all data. Please try again.');
    }
  };

  const handleCreateBackup = async () => {
    try {
      Alert.alert(
        'Creating Backup',
        'Please wait while we create your backup...',
        [],
        { cancelable: false }
      );

      // Create backup
      const result = await createBackup();

      if (!result.success) {
        Alert.alert('Backup Failed', result.error);
        return;
      }

      // Show options for backup
      Alert.alert(
        'Backup Created!',
        `Your backup has been saved locally as:\n${result.filename}\n\nWhat would you like to do with it?`,
        [
          { text: 'Keep Local Only', style: 'cancel' },
          {
            text: 'Email Backup',
            onPress: () => handleEmailBackup(result.fileUri, result.filename)
          },
          {
            text: 'Share Backup',
            onPress: () => handleShareBackup(result.fileUri, result.filename)
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', `Failed to create backup: ${error.message}`);
    }
  };

  const handleEmailBackup = async (fileUri, filename) => {
    try {
      const result = await emailBackup(fileUri, filename, userEmail);
      if (result.status === 'sent') {
        Alert.alert('Success', 'Backup emailed successfully!');
      }
    } catch (error) {
      Alert.alert('Error', `Failed to email backup: ${error.message}`);
    }
  };

  const handleShareBackup = async (fileUri, filename) => {
    try {
      const result = await shareBackup(fileUri, filename);
      if (result.success) {
        Alert.alert('Success', 'Backup shared successfully!');
      } else {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to share backup: ${error.message}`);
    }
  };

  const handleRestoreBackup = async () => {
    Alert.alert(
      'Restore from Backup',
      'This will replace ALL current data with data from a backup file.\n\nWARNING: Current data will be permanently lost!\n\nMake sure to create a backup of current data first if needed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Backup First',
          onPress: handleCreateBackup
        },
        {
          text: 'Select Backup File',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await restoreFromBackup();

              if (result.cancelled) {
                return; // User cancelled
              }

              if (result.success) {
                Alert.alert(
                  'Restore Complete!',
                  result.message + '\n\nPlease restart the app to see all changes.',
                  [{ text: 'OK' }]
                );
                // Reload settings to reflect restored data
                loadSettings();
              } else {
                Alert.alert('Restore Failed', result.error);
              }
            } catch (error) {
              Alert.alert('Error', `Failed to restore backup: ${error.message}`);
            }
          }
        }
      ]
    );
  };

  const styles = createStyles(colors);

  const ThemeOption = ({ theme, themeKey }) => {
    const isSelected = selectedTheme === themeKey;

    return (
      <TouchableOpacity
        style={[styles.themeOption, isSelected && styles.selectedTheme]}
        onPress={() => saveTheme(themeKey)}
      >
        <View style={styles.themePreview}>
          <View style={[styles.colorSwatch, { backgroundColor: theme.primary }]} />
          <View style={[styles.colorSwatch, { backgroundColor: theme.secondary }]} />
          <View style={[styles.colorSwatch, { backgroundColor: theme.accent }]} />
        </View>

        <View style={styles.themeInfo}>
          <Text style={styles.themeName}>{theme.name}</Text>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>

        {/* App Appearance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎨 App Appearance</Text>

          {/* Dark Mode Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Dark Mode</Text>
              <Text style={styles.settingDescription}>
                Switch between light and dark themes
              </Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={darkMode ? colors.surface : colors.textLight}
            />
          </View>

          {/* Theme Selection */}
          <Text style={styles.subSectionTitle}>Color Themes</Text>
          {THEME_OPTIONS.map((theme, index) => {
            const themeKey = Object.keys({
              RUSTIC_FARM: 'RUSTIC_FARM',
              COASTAL_FARM: 'COASTAL_FARM',
              SUNSET_FARM: 'SUNSET_FARM',
              LAVENDER_FARM: 'LAVENDER_FARM',
              ORANGE_DRIP: 'ORANGE_DRIP',
              THISTLEWEED: 'THISTLEWEED',
              PINK_AUTUMN: 'PINK_AUTUMN'
            })[index];

            return (
              <ThemeOption
                key={themeKey}
                theme={theme}
                themeKey={themeKey}
              />
            );
          })}
        </View>

        {/* Flock Configuration Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🐔 Flock Configuration</Text>

          {/* Color Tracking Toggle */}
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Color Tracking</Text>
              <Text style={styles.settingDescription}>
                Track individual egg colors for chickens (off = simplified tracking by species only)
              </Text>
            </View>
            <Switch
              value={!speedMode}
              onValueChange={(value) => toggleSpeedMode(!value)}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={!speedMode ? colors.surface : colors.textLight}
            />
          </View>

          {/* Species Toggles */}
          <Text style={styles.subSectionTitle}>Active Species</Text>
          <Text style={styles.instructions}>
            Enable/disable species you track in your flock
          </Text>

          {['duck', 'quail', 'turkey', 'guinea'].map((species) => {
            const speciesInfo = {
              duck: { name: '🦆 Duck', colorId: 'duck' },
              quail: { name: '🐦 Quail', colorId: 'quail' },
              turkey: { name: '🦃 Turkey', colorId: 'turkey' },
              guinea: { name: '🦜 Guinea', colorId: 'guinea' }
            };
            return (
              <View key={species} style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Text style={styles.settingTitle}>{speciesInfo[species].name}</Text>
                </View>
                <Switch
                  value={enabledColors[speciesInfo[species].colorId] || false}
                  onValueChange={(value) => toggleColorEnabled(speciesInfo[species].colorId, value)}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor={enabledColors[speciesInfo[species].colorId] ? colors.surface : colors.textLight}
                />
              </View>
            );
          })}

          {/* Flock Head Counts */}
          <Text style={styles.subSectionTitle}>Flock Head Counts</Text>
          <Text style={styles.instructions}>
            Track the number of laying birds in your flock for efficiency calculations
          </Text>

          <View style={styles.flockCountGrid}>
            <View style={styles.flockCountItem}>
              <Text style={styles.flockCountLabel}>Laying Hens</Text>
              <TextInput
                style={styles.flockCountInput}
                value={flockCounts.laying_hens.toString()}
                onChangeText={(value) => updateFlockCount('laying_hens', value)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.flockCountItem}>
              <Text style={styles.flockCountLabel}>Ducks</Text>
              <TextInput
                style={styles.flockCountInput}
                value={flockCounts.ducks.toString()}
                onChangeText={(value) => updateFlockCount('ducks', value)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.flockCountItem}>
              <Text style={styles.flockCountLabel}>Quail</Text>
              <TextInput
                style={styles.flockCountInput}
                value={flockCounts.quail.toString()}
                onChangeText={(value) => updateFlockCount('quail', value)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.flockCountItem}>
              <Text style={styles.flockCountLabel}>Turkeys</Text>
              <TextInput
                style={styles.flockCountInput}
                value={flockCounts.turkeys.toString()}
                onChangeText={(value) => updateFlockCount('turkeys', value)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textLight}
              />
            </View>

            <View style={styles.flockCountItem}>
              <Text style={styles.flockCountLabel}>Guinea Fowl</Text>
              <TextInput
                style={styles.flockCountInput}
                value={flockCounts.guinea_fowl.toString()}
                onChangeText={(value) => updateFlockCount('guinea_fowl', value)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor={colors.textLight}
              />
            </View>
          </View>

          {!speedMode && (
            <>
              <Text style={styles.subSectionTitle}>Individual Egg Colors</Text>
              <Text style={styles.instructions}>
                Toggle on/off the egg colors your flock produces
              </Text>
            </>
          )}

          {!speedMode && EGG_COLORS.filter(color => !color.isGeneric).map((eggColor) => (
            <View key={eggColor.id} style={styles.colorToggleItem}>
              <View style={styles.colorToggleInfo}>
                <View style={styles.colorIndicator}>
                  <View
                    style={[
                      styles.colorSwatch,
                      { backgroundColor: eggColor.color },
                      eggColor.color === '#FFFFFF' && styles.whiteSwatchBorder
                    ]}
                  />
                  <Text style={styles.colorToggleName}>{eggColor.name}</Text>
                </View>
                <Text style={styles.colorToggleDescription}>
                  {eggColor.breeds?.join(', ') || 'Various breeds'}
                </Text>
              </View>
              <Switch
                value={enabledColors[eggColor.id] || false}
                onValueChange={(value) => toggleColorEnabled(eggColor.id, value)}
                trackColor={{ false: colors.border, true: colors.accent }}
                thumbColor={enabledColors[eggColor.id] ? colors.surface : colors.textLight}
              />
            </View>
          ))}

          {speedMode && (
            <View style={styles.speedModeInfo}>
              <Text style={styles.speedModeText}>
                ℹ️ Color Tracking is disabled. Egg collection is simplified to species tracking only.
              </Text>
            </View>
          )}
        </View>

        {/* Sales & Pricing Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💰 Sales & Pricing</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Email Address</Text>
              <Text style={styles.settingDescription}>
                Your email for data exports
              </Text>
            </View>
            <TextInput
              style={styles.emailInput}
              value={userEmail}
              onChangeText={setUserEmail}
              onBlur={() => saveEmail(userEmail)}
              keyboardType="email-address"
              placeholder="your@email.com"
              autoCapitalize="none"
            />
          </View>

          {/* Chicken Prices */}
          <Text style={styles.speciesHeader}>🐔 Chicken Eggs</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Half Dozen (6 eggs)</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceSymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={prices.chicken_6}
                onChangeText={(text) => {
                  const cleanText = text.replace(/[^0-9.]/g, '');
                  setPrices({ ...prices, chicken_6: cleanText });
                }}
                onBlur={() => saveSpeciesPrice('chicken_6', prices.chicken_6)}
                keyboardType="decimal-pad"
                placeholder="3.00"
              />
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Dozen (12 eggs)</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceSymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={prices.chicken_12}
                onChangeText={(text) => {
                  const cleanText = text.replace(/[^0-9.]/g, '');
                  setPrices({ ...prices, chicken_12: cleanText });
                }}
                onBlur={() => saveSpeciesPrice('chicken_12', prices.chicken_12)}
                keyboardType="decimal-pad"
                placeholder="6.00"
              />
            </View>
          </View>

          {/* Quail Prices */}
          <Text style={styles.speciesHeader}>🐦 Quail Eggs</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Dozen (12 eggs)</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceSymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={prices.quail_12}
                onChangeText={(text) => {
                  const cleanText = text.replace(/[^0-9.]/g, '');
                  setPrices({ ...prices, quail_12: cleanText });
                }}
                onBlur={() => saveSpeciesPrice('quail_12', prices.quail_12)}
                keyboardType="decimal-pad"
                placeholder="8.00"
              />
            </View>
          </View>

          {/* Duck Prices */}
          <Text style={styles.speciesHeader}>🦆 Duck Eggs</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>4 eggs</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceSymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={prices.duck_4}
                onChangeText={(text) => {
                  const cleanText = text.replace(/[^0-9.]/g, '');
                  setPrices({ ...prices, duck_4: cleanText });
                }}
                onBlur={() => saveSpeciesPrice('duck_4', prices.duck_4)}
                keyboardType="decimal-pad"
                placeholder="4.00"
              />
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Half Dozen (6 eggs)</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceSymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={prices.duck_6}
                onChangeText={(text) => {
                  const cleanText = text.replace(/[^0-9.]/g, '');
                  setPrices({ ...prices, duck_6: cleanText });
                }}
                onBlur={() => saveSpeciesPrice('duck_6', prices.duck_6)}
                keyboardType="decimal-pad"
                placeholder="6.00"
              />
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Dozen (12 eggs)</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceSymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={prices.duck_12}
                onChangeText={(text) => {
                  const cleanText = text.replace(/[^0-9.]/g, '');
                  setPrices({ ...prices, duck_12: cleanText });
                }}
                onBlur={() => saveSpeciesPrice('duck_12', prices.duck_12)}
                keyboardType="decimal-pad"
                placeholder="12.00"
              />
            </View>
          </View>

          {/* Turkey Prices */}
          <Text style={styles.speciesHeader}>🦃 Turkey Eggs</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>4 eggs</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceSymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={prices.turkey_4}
                onChangeText={(text) => {
                  const cleanText = text.replace(/[^0-9.]/g, '');
                  setPrices({ ...prices, turkey_4: cleanText });
                }}
                onBlur={() => saveSpeciesPrice('turkey_4', prices.turkey_4)}
                keyboardType="decimal-pad"
                placeholder="8.00"
              />
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Half Dozen (6 eggs)</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceSymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={prices.turkey_6}
                onChangeText={(text) => {
                  const cleanText = text.replace(/[^0-9.]/g, '');
                  setPrices({ ...prices, turkey_6: cleanText });
                }}
                onBlur={() => saveSpeciesPrice('turkey_6', prices.turkey_6)}
                keyboardType="decimal-pad"
                placeholder="12.00"
              />
            </View>
          </View>

          {/* Guinea Prices */}
          <Text style={styles.speciesHeader}>🦜 Guinea Eggs</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>4 eggs</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceSymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={prices.guinea_4}
                onChangeText={(text) => {
                  const cleanText = text.replace(/[^0-9.]/g, '');
                  setPrices({ ...prices, guinea_4: cleanText });
                }}
                onBlur={() => saveSpeciesPrice('guinea_4', prices.guinea_4)}
                keyboardType="decimal-pad"
                placeholder="5.00"
              />
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Half Dozen (6 eggs)</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceSymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={prices.guinea_6}
                onChangeText={(text) => {
                  const cleanText = text.replace(/[^0-9.]/g, '');
                  setPrices({ ...prices, guinea_6: cleanText });
                }}
                onBlur={() => saveSpeciesPrice('guinea_6', prices.guinea_6)}
                keyboardType="decimal-pad"
                placeholder="7.50"
              />
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Dozen (12 eggs)</Text>
            </View>
            <View style={styles.priceInputContainer}>
              <Text style={styles.priceSymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                value={prices.guinea_12}
                onChangeText={(text) => {
                  const cleanText = text.replace(/[^0-9.]/g, '');
                  setPrices({ ...prices, guinea_12: cleanText });
                }}
                onBlur={() => saveSpeciesPrice('guinea_12', prices.guinea_12)}
                keyboardType="decimal-pad"
                placeholder="15.00"
              />
            </View>
          </View>
        </View>

        {/* Data & Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Data & Storage</Text>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleExportData}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Export Data</Text>
              <Text style={styles.settingDescription}>
                Email your sales and inventory data as CSV
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleCreateBackup}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Create Backup</Text>
              <Text style={styles.settingDescription}>
                Save complete backup file for restore
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleRestoreBackup}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Restore from Backup</Text>
              <Text style={styles.settingDescription}>
                Replace all data with backup file
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleClearData}
          >
            <View style={styles.settingInfo}>
              <Text style={styles.settingTitle}>Clear All Data</Text>
              <Text style={styles.settingDescription}>
                Reset app to initial state
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
          </TouchableOpacity>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ℹ️ About</Text>

          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.aboutValue}>1.0.0</Text>
          </View>

          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>Created with</Text>
            <Text style={styles.aboutValue}>React Native & Claude Code</Text>
          </View>

          <View style={styles.aboutItem}>
            <Text style={styles.aboutLabel}>© 2025</Text>
            <Text style={styles.aboutValue}>Fiddlehead Farm, LLC</Text>
          </View>
        </View>

      </ScrollView>

      {/* Clear Data Confirmation Modal */}
      <Modal
        visible={showClearDataModal}
        transparent={true}
        animationType="slide"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Final Warning</Text>

            <Text style={styles.modalText}>
              You are about to permanently delete ALL your data. This action cannot be undone.
            </Text>

            <Text style={styles.modalText}>
              To confirm, please type <Text style={styles.keywordText}>DELETE</Text> below:
            </Text>

            <TextInput
              style={styles.confirmationInput}
              value={confirmationKeyword}
              onChangeText={setConfirmationKeyword}
              placeholder="Type DELETE to confirm"
              autoCapitalize="characters"
              autoCorrect={false}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => {
                  setShowClearDataModal(false);
                  setConfirmationKeyword('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalDeleteButton,
                  confirmationKeyword.toLowerCase() !== 'delete' && styles.disabledDeleteButton
                ]}
                onPress={clearAllData}
                disabled={confirmationKeyword.toLowerCase() !== 'delete'}
              >
                <Text style={[
                  styles.modalDeleteText,
                  confirmationKeyword.toLowerCase() !== 'delete' && styles.disabledDeleteText
                ]}>
                  Delete All Data
                </Text>
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
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: colors.surface,
    marginVertical: 5,
    paddingVertical: 20,
    paddingHorizontal: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 15,
  },
  subSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginTop: 20,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  settingDescription: {
    fontSize: 14,
    color: colors.textLight,
    marginTop: 2,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedTheme: {
    borderColor: colors.accent,
    backgroundColor: colors.secondary,
  },
  themePreview: {
    flexDirection: 'row',
    marginRight: 15,
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  themeInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  themeName: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  aboutLabel: {
    fontSize: 16,
    color: colors.text,
  },
  aboutValue: {
    fontSize: 16,
    color: colors.textLight,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    paddingHorizontal: 8,
    backgroundColor: colors.surface,
  },
  priceSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginRight: 4,
  },
  priceInput: {
    padding: 8,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    minWidth: 60,
    textAlign: 'right',
  },
  speciesHeader: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.primary,
    marginTop: 20,
    marginBottom: 10,
  },
  emailInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    padding: 8,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    minWidth: 160,
    textAlign: 'left',
  },
  instructions: {
    fontSize: 14,
    color: colors.textLight,
    marginBottom: 15,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  colorToggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  colorToggleInfo: {
    flex: 1,
  },
  colorIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  colorSwatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  whiteSwatchBorder: {
    borderColor: colors.textLight,
    borderWidth: 2,
  },
  colorToggleName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  colorToggleDescription: {
    fontSize: 13,
    color: colors.textLight,
    marginLeft: 30,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    padding: 25,
    borderRadius: 15,
    width: '90%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC3545',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 22,
  },
  keywordText: {
    fontWeight: 'bold',
    color: '#DC3545',
    fontSize: 18,
  },
  confirmationInput: {
    borderWidth: 2,
    borderColor: '#DC3545',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 25,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.background,
  },
  modalDeleteButton: {
    flex: 1,
    backgroundColor: '#DC3545',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 10,
  },
  disabledDeleteButton: {
    backgroundColor: '#CCC',
  },
  modalCancelText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  modalDeleteText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledDeleteText: {
    color: '#999',
  },
  speedModeInfo: {
    backgroundColor: colors.secondary,
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  speedModeText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  flockCountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 15,
  },
  flockCountItem: {
    width: '48%',
    marginBottom: 15,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  flockCountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 5,
  },
  flockCountInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 5,
    padding: 8,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
    textAlign: 'center',
  },
});

export default Settings;