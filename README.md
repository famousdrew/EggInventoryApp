# 🥚 Egg Inventory Mobile App

A React Native mobile app designed for chicken farmers to efficiently track egg collection, inventory, packaging, and sales.

## Features

### 🧺 Collection Screen
- **Quick-add functionality**: Tap color buttons to quickly add eggs to today's collection
- **12 egg color varieties**: White, Cream, Light Brown, Medium Brown, Dark Brown, Chocolate, Light Blue, Blue, Green, Olive, Pink, and Speckled
- **Custom quantities**: Long-press any color for custom quantity entry
- **Save to inventory**: One-tap to add collected eggs to your main inventory

### 📦 Inventory Management
- **Real-time tracking**: Live view of current egg inventory by color
- **Visual indicators**: Color-coded display with percentages and statistics
- **Manual adjustments**: Add or remove eggs directly from inventory
- **Pull-to-refresh**: Update inventory data

### 📦 Boxing & Packaging
- **Box builder**: Create custom egg boxes by selecting eggs from inventory
- **Availability tracking**: Shows how many eggs of each color are available
- **Flexible sizing**: Create boxes of any size (not limited to dozens)
- **Package history**: View all packaged boxes ready for sale

### 💰 Sales & Records
- **Sales tracking**: Record sales with customer names and prices
- **Revenue statistics**: Track total revenue, average prices, and sales volume
- **Sales history**: Complete record of all transactions
- **Customer records**: Keep track of who bought what and when

## Color Classifications

The app supports 12 standard chicken egg colors:

- **White**: Pure white eggs (Leghorn, Ancona, Hamburg)
- **Cream**: Light cream colored eggs (Buff Orpington, Cochin)
- **Light Brown**: Light brown eggs (Rhode Island Red, Plymouth Rock)
- **Medium Brown**: Medium brown eggs (New Hampshire, Australorp)
- **Dark Brown**: Dark brown eggs (Marans, Welsummer)
- **Chocolate**: Deep chocolate brown eggs (French Black Copper Marans)
- **Light Blue**: Light blue eggs (Ameraucana, Arkansas Blue)
- **Blue**: Medium blue eggs (Araucana, Cream Legbar)
- **Green**: Light green eggs (Easter Egger, Olive Egger)
- **Olive**: Olive green eggs (Olive Egger crosses)
- **Pink**: Pink tinted eggs (Light Sussex, Asil)
- **Speckled**: Brown eggs with dark speckles (Welsummer, Marans)

## Getting Started

### Prerequisites
- Node.js (version 14 or higher)
- Expo CLI installed globally: `npm install -g expo-cli`
- Expo Go app on your phone (iOS App Store or Google Play Store)

### Installation
1. Navigate to the project directory:
   ```bash
   cd EggInventoryApp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npx expo start
   ```

### Testing on Your Phone

#### Method 1: Expo Go (Recommended for Testing)
1. **Install Expo Go** on your phone from the App Store (iOS) or Google Play Store (Android)

2. **Ensure same WiFi**: Make sure your computer and phone are connected to the same WiFi network

3. **Start the app**: Run `npx expo start` in the project directory

4. **Scan QR code**:
   - **iOS**: Open the Camera app and point it at the QR code displayed in your terminal
   - **Android**: Open the Expo Go app and tap "Scan QR Code"

5. **Launch**: The app will load on your device through Expo Go

#### Method 2: Development Build (For Production)
For a production-ready app, you'll need to create development builds:

1. Install EAS CLI:
   ```bash
   npm install -g @expo/eas-cli
   ```

2. Configure EAS:
   ```bash
   eas build:configure
   ```

3. Create development builds:
   ```bash
   # For Android
   eas build --profile development --platform android

   # For iOS (requires Apple Developer account)
   eas build --profile development --platform ios
   ```

## App Usage Workflow

### Daily Egg Collection
1. Open the **Collection** tab
2. Tap the colored buttons for each egg you collect
3. Use long-press for adding multiple eggs of the same color
4. Tap "Save to Inventory" when done collecting

### Managing Inventory
1. View current inventory in the **Inventory** tab
2. See total eggs and distribution by color
3. Make manual adjustments if needed
4. Pull down to refresh data

### Packaging for Sale
1. Go to the **Boxing** tab
2. Build boxes by selecting eggs from your inventory
3. Create custom mixes based on what customers want
4. Package the box when ready

### Recording Sales
1. Navigate to the **Sales** tab
2. View boxes ready for sale
3. Tap "Mark as Sold" on any box
4. Enter customer name and sale price
5. View sales history and revenue statistics

## Technical Details

- **Framework**: React Native with Expo
- **Navigation**: React Navigation v7 with bottom tabs
- **Storage**: AsyncStorage for offline data persistence
- **Styling**: React Native StyleSheet with custom color themes
- **Icons**: Expo Vector Icons (Ionicons)

## Data Persistence

All data is stored locally on your device using AsyncStorage:
- Egg inventory counts
- Daily collection records
- Packaged boxes
- Sales history and customer records

Data persists between app sessions and works offline.

## Customization

### Adding New Egg Colors
To add new egg colors, edit `/data/eggColors.js`:

```javascript
{
  id: 'new_color',
  name: 'New Color',
  color: '#HEX_COLOR_CODE',
  description: 'Description of the egg color',
  breeds: ['Breed 1', 'Breed 2']
}
```

### Modifying Color Themes
App colors can be customized in each screen's StyleSheet:
- Primary: `#8B4513` (brown)
- Background: `#F5F5DC` (beige)
- Success: `#4CAF50` (green)

## Troubleshooting

### Common Issues

**QR Code won't scan:**
- Ensure both devices are on the same WiFi network
- Try restarting the Expo development server
- Check that your phone's camera has permission

**App won't load:**
- Clear Expo Go cache in app settings
- Restart the Metro bundler
- Check for any JavaScript errors in the terminal

**Data not saving:**
- Ensure the app has storage permissions
- Check device storage space
- Try clearing app data and starting fresh

### Support
For technical issues or questions about the app, check the terminal output for error messages and debugging information.

## Future Enhancements

Potential features for future versions:
- Cloud backup and sync
- Barcode scanning for egg cartons
- Advanced analytics and reporting
- Multi-farm management
- Export data to CSV/Excel
- Photo attachment for egg records
- Weather tracking correlation