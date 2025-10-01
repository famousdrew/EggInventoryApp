import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys
const STORAGE_KEYS = {
  INVENTORY: 'egg_inventory',
  BOXED_EGGS: 'boxed_eggs',
  SALES_HISTORY: 'sales_history',
  DAILY_COLLECTIONS: 'daily_collections',
  SPEED_MODE: 'speed_mode',
  FLOCK_COUNTS: 'flock_head_counts',
  FEED_TRACKING: 'feed_tracking'
};

// Initialize empty inventory structure
const EMPTY_INVENTORY = {
  white: 0,
  cream: 0,
  light_brown: 0,
  medium_brown: 0,
  dark_brown: 0,
  chocolate: 0,
  light_blue: 0,
  blue: 0,
  green: 0,
  olive: 0,
  pink: 0,
  speckled: 0,
  duck: 0,
  quail: 0,
  turkey: 0,
  guinea: 0,
  generic: 0,
  generic_chicken: 0,
  generic_duck: 0,
  generic_quail: 0,
  generic_turkey: 0,
  generic_guinea: 0
};

// Inventory management functions
export const InventoryStorage = {
  // Get current loose egg inventory
  async getInventory() {
    try {
      const inventory = await AsyncStorage.getItem(STORAGE_KEYS.INVENTORY);
      return inventory ? JSON.parse(inventory) : { ...EMPTY_INVENTORY };
    } catch (error) {
      console.error('Error loading inventory:', error);
      return { ...EMPTY_INVENTORY };
    }
  },

  // Save inventory
  async saveInventory(inventory) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.INVENTORY, JSON.stringify(inventory));
      return true;
    } catch (error) {
      console.error('Error saving inventory:', error);
      return false;
    }
  },

  // Add eggs to inventory
  async addEggs(colorId, quantity) {
    try {
      const inventory = await this.getInventory();
      inventory[colorId] = (inventory[colorId] || 0) + quantity;
      await this.saveInventory(inventory);
      return inventory;
    } catch (error) {
      console.error('Error adding eggs:', error);
      return null;
    }
  },

  // Remove eggs from inventory (for boxing)
  async removeEggs(colorId, quantity) {
    try {
      const inventory = await this.getInventory();
      const currentAmount = inventory[colorId] || 0;
      if (currentAmount >= quantity) {
        inventory[colorId] = currentAmount - quantity;
        await this.saveInventory(inventory);
        return inventory;
      }
      return null; // Not enough eggs
    } catch (error) {
      console.error('Error removing eggs:', error);
      return null;
    }
  },

  // Get total egg count
  async getTotalEggs() {
    try {
      const inventory = await this.getInventory();
      return Object.values(inventory).reduce((total, count) => total + count, 0);
    } catch (error) {
      console.error('Error calculating total eggs:', error);
      return 0;
    }
  }
};

// Boxed eggs management
export const BoxedEggsStorage = {
  async getBoxedEggs() {
    try {
      const boxed = await AsyncStorage.getItem(STORAGE_KEYS.BOXED_EGGS);
      return boxed ? JSON.parse(boxed) : [];
    } catch (error) {
      console.error('Error loading boxed eggs:', error);
      return [];
    }
  },

  async addBoxedEggs(colorMix, dozen = 12) {
    try {
      const boxed = await this.getBoxedEggs();
      const newBox = {
        id: Date.now().toString(),
        colorMix,
        quantity: dozen,
        dateBoxed: new Date().toISOString(),
        sold: false
      };
      boxed.push(newBox);
      await AsyncStorage.setItem(STORAGE_KEYS.BOXED_EGGS, JSON.stringify(boxed));
      return newBox;
    } catch (error) {
      console.error('Error adding boxed eggs:', error);
      return null;
    }
  },

  async markAsSold(boxId, customer, price) {
    try {
      const boxed = await this.getBoxedEggs();
      const boxIndex = boxed.findIndex(box => box.id === boxId);
      if (boxIndex !== -1) {
        boxed[boxIndex].sold = true;
        boxed[boxIndex].soldDate = new Date().toISOString();
        boxed[boxIndex].customer = customer;
        boxed[boxIndex].price = price;
        await AsyncStorage.setItem(STORAGE_KEYS.BOXED_EGGS, JSON.stringify(boxed));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error marking as sold:', error);
      return false;
    }
  }
};

// Daily collections tracking
export const CollectionsStorage = {
  async addCollection(colorCounts, notes = '') {
    try {
      const collections = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_COLLECTIONS);
      const collectionsArray = collections ? JSON.parse(collections) : [];

      const newCollection = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        colorCounts,
        totalEggs: Object.values(colorCounts).reduce((sum, count) => sum + count, 0),
        notes: notes || ''
      };

      collectionsArray.push(newCollection);
      await AsyncStorage.setItem(STORAGE_KEYS.DAILY_COLLECTIONS, JSON.stringify(collectionsArray));
      return newCollection;
    } catch (error) {
      console.error('Error saving collection:', error);
      return null;
    }
  },

  async getCollections(days = 30) {
    try {
      const collections = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_COLLECTIONS);
      const collectionsArray = collections ? JSON.parse(collections) : [];

      // Return last N days
      return collectionsArray.slice(-days);
    } catch (error) {
      console.error('Error loading collections:', error);
      return [];
    }
  }
};

// Speed Mode management
export const SpeedModeStorage = {
  // Get speed mode setting
  async getSpeedMode() {
    try {
      const speedMode = await AsyncStorage.getItem(STORAGE_KEYS.SPEED_MODE);
      return speedMode ? JSON.parse(speedMode) : true;
    } catch (error) {
      console.error('Error loading speed mode setting:', error);
      return true;
    }
  },

  // Save speed mode setting
  async setSpeedMode(enabled) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SPEED_MODE, JSON.stringify(enabled));
      return true;
    } catch (error) {
      console.error('Error saving speed mode setting:', error);
      return false;
    }
  },

  // Helper: Add total eggs (for speed mode collections)
  async addTotalEggs(quantity) {
    try {
      const isSpeedMode = await this.getSpeedMode();
      if (isSpeedMode) {
        // In speed mode, add to generic eggs
        return await InventoryStorage.addEggs('generic', quantity);
      } else {
        // In normal mode, this function shouldn't be called
        console.warn('addTotalEggs called when not in speed mode');
        return null;
      }
    } catch (error) {
      console.error('Error adding total eggs:', error);
      return null;
    }
  },

  // Helper: Add chicken eggs (for dual-species speed mode)
  async addChickenEggs(quantity) {
    try {
      const isSpeedMode = await this.getSpeedMode();
      if (isSpeedMode) {
        return await InventoryStorage.addEggs('generic_chicken', quantity);
      } else {
        console.warn('addChickenEggs called when not in speed mode');
        return null;
      }
    } catch (error) {
      console.error('Error adding chicken eggs:', error);
      return null;
    }
  },

  // Helper: Add duck eggs (for dual-species speed mode)
  async addDuckEggs(quantity) {
    try {
      const isSpeedMode = await this.getSpeedMode();
      if (isSpeedMode) {
        return await InventoryStorage.addEggs('generic_duck', quantity);
      } else {
        console.warn('addDuckEggs called when not in speed mode');
        return null;
      }
    } catch (error) {
      console.error('Error adding duck eggs:', error);
      return null;
    }
  },

  // Helper: Add quail eggs (for multi-species speed mode)
  async addQuailEggs(quantity) {
    try {
      const isSpeedMode = await this.getSpeedMode();
      if (isSpeedMode) {
        return await InventoryStorage.addEggs('generic_quail', quantity);
      } else {
        console.warn('addQuailEggs called when not in speed mode');
        return null;
      }
    } catch (error) {
      console.error('Error adding quail eggs:', error);
      return null;
    }
  },

  // Helper: Add turkey eggs (for multi-species speed mode)
  async addTurkeyEggs(quantity) {
    try {
      const isSpeedMode = await this.getSpeedMode();
      if (isSpeedMode) {
        return await InventoryStorage.addEggs('generic_turkey', quantity);
      } else {
        console.warn('addTurkeyEggs called when not in speed mode');
        return null;
      }
    } catch (error) {
      console.error('Error adding turkey eggs:', error);
      return null;
    }
  },

  // Helper: Add guinea eggs (for multi-species speed mode)
  async addGuineaEggs(quantity) {
    try {
      const isSpeedMode = await this.getSpeedMode();
      if (isSpeedMode) {
        return await InventoryStorage.addEggs('generic_guinea', quantity);
      } else {
        console.warn('addGuineaEggs called when not in speed mode');
        return null;
      }
    } catch (error) {
      console.error('Error adding guinea eggs:', error);
      return null;
    }
  },

  // Helper: Remove eggs for boxing in speed mode
  async removeEggsForBoxing(quantity) {
    try {
      const isSpeedMode = await this.getSpeedMode();
      if (isSpeedMode) {
        // In speed mode, remove from generic eggs
        return await InventoryStorage.removeEggs('generic', quantity);
      } else {
        console.warn('removeEggsForBoxing called when not in speed mode');
        return null;
      }
    } catch (error) {
      console.error('Error removing eggs for boxing:', error);
      return null;
    }
  },

  // Helper: Create boxes of 12 from total egg count
  async packAllEggs() {
    try {
      const isSpeedMode = await this.getSpeedMode();
      if (!isSpeedMode) {
        console.warn('packAllEggs called when not in speed mode');
        return { boxes: 0, remaining: 0 };
      }

      const currentInventory = await InventoryStorage.getInventory();
      const chickenEggs = currentInventory.generic_chicken || 0;
      const duckEggs = currentInventory.generic_duck || 0;
      const genericEggs = currentInventory.generic || 0;

      // Check if we have duck eggs enabled (dual-species mode)
      const hasDuckEggs = chickenEggs > 0 || duckEggs > 0;

      if (hasDuckEggs) {
        // Dual-species mode: pack chicken and duck separately
        const chickenBoxes = Math.floor(chickenEggs / 12);
        const duckBoxes = Math.floor(duckEggs / 12);
        const chickenRemaining = chickenEggs % 12;
        const duckRemaining = duckEggs % 12;

        let totalBoxes = 0;

        // Pack chicken eggs
        if (chickenBoxes > 0) {
          const chickenEggsToBox = chickenBoxes * 12;
          await InventoryStorage.removeEggs('generic_chicken', chickenEggsToBox);

          for (let i = 0; i < chickenBoxes; i++) {
            await BoxedEggsStorage.addBoxedEggs(
              { generic_chicken: 12 },
              12
            );
          }
          totalBoxes += chickenBoxes;
        }

        // Pack duck eggs
        if (duckBoxes > 0) {
          const duckEggsToBox = duckBoxes * 12;
          await InventoryStorage.removeEggs('generic_duck', duckEggsToBox);

          for (let i = 0; i < duckBoxes; i++) {
            await BoxedEggsStorage.addBoxedEggs(
              { generic_duck: 12 },
              12
            );
          }
          totalBoxes += duckBoxes;
        }

        return {
          boxes: totalBoxes,
          remaining: chickenRemaining + duckRemaining,
          chickenBoxes,
          duckBoxes,
          chickenRemaining,
          duckRemaining
        };
      } else {
        // Single-species mode: original logic
        const totalEggs = genericEggs;
        const boxCount = Math.floor(totalEggs / 12);
        const remaining = totalEggs % 12;

        if (boxCount > 0) {
          const eggsToBox = boxCount * 12;
          await InventoryStorage.removeEggs('generic', eggsToBox);

          for (let i = 0; i < boxCount; i++) {
            await BoxedEggsStorage.addBoxedEggs(
              { generic: 12 },
              12
            );
          }
        }

        return { boxes: boxCount, remaining };
      }
    } catch (error) {
      console.error('Error packing all eggs:', error);
      return { boxes: 0, remaining: 0 };
    }
  }
};

// Flock Management functions
export const FlockManagement = {
  // Get head counts for all species
  async getFlockCounts() {
    try {
      const flockCounts = await AsyncStorage.getItem(STORAGE_KEYS.FLOCK_COUNTS);
      return flockCounts ? JSON.parse(flockCounts) : {
        laying_hens: 0,
        ducks: 0,
        quail: 0,
        turkeys: 0,
        guinea_fowl: 0
      };
    } catch (error) {
      console.error('Error loading flock counts:', error);
      return {
        laying_hens: 0,
        ducks: 0,
        quail: 0,
        turkeys: 0,
        guinea_fowl: 0
      };
    }
  },

  // Save head counts
  async saveFlockCounts(counts) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FLOCK_COUNTS, JSON.stringify(counts));
      return true;
    } catch (error) {
      console.error('Error saving flock counts:', error);
      return false;
    }
  },

  // Update a specific species count
  async updateSpeciesCount(species, count) {
    try {
      const currentCounts = await this.getFlockCounts();
      currentCounts[species] = Math.max(0, parseInt(count) || 0);
      return await this.saveFlockCounts(currentCounts);
    } catch (error) {
      console.error('Error updating species count:', error);
      return false;
    }
  },

  // Get total bird count
  async getTotalBirdCount() {
    try {
      const counts = await this.getFlockCounts();
      return Object.values(counts).reduce((sum, count) => sum + count, 0);
    } catch (error) {
      console.error('Error calculating total bird count:', error);
      return 0;
    }
  }
};

// Feed Tracking functions
export const FeedTracking = {
  // Get feed tracking settings
  async getFeedSettings() {
    try {
      const settings = await AsyncStorage.getItem(STORAGE_KEYS.FEED_TRACKING);
      return settings ? JSON.parse(settings) : {
        costPerBag: 0,
        daysPerBag: 0,
        enabled: false
      };
    } catch (error) {
      console.error('Error loading feed settings:', error);
      return {
        costPerBag: 0,
        daysPerBag: 0,
        enabled: false
      };
    }
  },

  // Save feed tracking settings
  async saveFeedSettings(settings) {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.FEED_TRACKING, JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('Error saving feed settings:', error);
      return false;
    }
  },

  // Calculate daily feed cost
  async getDailyFeedCost() {
    try {
      const settings = await this.getFeedSettings();
      if (!settings.enabled || settings.daysPerBag === 0) {
        return 0;
      }
      return settings.costPerBag / settings.daysPerBag;
    } catch (error) {
      console.error('Error calculating daily feed cost:', error);
      return 0;
    }
  },

  // Calculate cost per egg (requires flock count and daily egg average)
  async getCostPerEgg(averageEggsPerDay) {
    try {
      const dailyCost = await this.getDailyFeedCost();
      if (averageEggsPerDay === 0) {
        return 0;
      }
      return dailyCost / averageEggsPerDay;
    } catch (error) {
      console.error('Error calculating cost per egg:', error);
      return 0;
    }
  },

  // Get profitability metrics
  async getProfitabilityMetrics(totalEggsSold, totalRevenue, daysTracked) {
    try {
      const settings = await this.getFeedSettings();
      if (!settings.enabled) {
        return null;
      }

      const dailyCost = await this.getDailyFeedCost();
      const totalFeedCost = dailyCost * daysTracked;
      const profit = totalRevenue - totalFeedCost;
      const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      const avgEggsPerDay = daysTracked > 0 ? totalEggsSold / daysTracked : 0;
      const costPerEgg = await this.getCostPerEgg(avgEggsPerDay);

      return {
        totalFeedCost,
        profit,
        profitMargin,
        costPerEgg,
        dailyCost
      };
    } catch (error) {
      console.error('Error calculating profitability:', error);
      return null;
    }
  }
};