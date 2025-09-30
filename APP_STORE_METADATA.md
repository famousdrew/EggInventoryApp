# App Store Submission Metadata

## App Information

**App Name:** Egg Inventory

**Subtitle (30 characters max):** Track, package & sell eggs easily

**Bundle ID:** com.fiddleheadfarm.egginventoryapp

**Version:** 1.0.0

**SKU:** egginventoryapp001

**Primary Category:** Productivity

**Secondary Category:** Business

---

## App Description (4000 characters max)

Egg Inventory is a comprehensive farm management app designed specifically for small to medium-sized egg producers. Whether you raise chickens, ducks, quail, turkeys, or guinea fowl, this app streamlines your daily egg collection, packaging, and sales tracking.

**Key Features:**

🥚 **Flexible Collection Tracking**
- Quick count mode for fast daily logging
- Detailed color tracking for chicken eggs (white, cream, brown variations, blue, green, pink, speckled)
- Multi-species support (chicken, duck, quail, turkey, guinea fowl)
- Track your flock head counts by species

📦 **Smart Packaging System**
- Package eggs into cartons with customizable quantities
- Species-specific quick-pack options (6, 12, 18, 30 for chickens; 4, 6, 8, 12 for ducks; and more)
- Automatic carton creation from loose egg inventory
- Visual tracking of packaged cartons ready to sell

💰 **Sales Management**
- Record individual or bundled sales
- Customizable pricing per species and carton size
- Customer name tracking
- Automatic sales history and analytics
- Total revenue and average price tracking

📊 **Analytics & Insights**
- View total eggs in inventory
- Track packaged cartons ready for sale
- Monitor total revenue from sales
- See average price per carton
- Review complete sales history

🎨 **Beautiful Themes**
- 7 light themes: Rustic Farm, Coastal Farm, Sunset Farm, Lavender Farm, Orange Drip, Thistleweed, Pink Autumn
- 7 matching dark themes for comfortable viewing
- All themes optimized for readability

✨ **User-Friendly Design**
- Clean, intuitive interface designed for farm work
- Quick actions for daily tasks
- Minimal taps to record collections and sales
- Works completely offline - no internet required
- All data stored locally on your device

**Perfect for:**
- Backyard chicken keepers
- Small farm egg producers
- Farmers market vendors
- Multi-species flock owners
- Anyone selling farm-fresh eggs

**Privacy First:**
All your data stays on your device. No accounts required, no cloud sync, complete privacy.

---

## Keywords (100 characters max, comma-separated)

egg,farm,chicken,inventory,sales,track,flock,agriculture,poultry,homestead

---

## Support URL

https://github.com/auggie-got-fired/EggInventoryApp

---

## Marketing URL (Optional)

https://fiddleheadfarm.com

---

## Privacy Policy URL

https://fiddleheadfarm.com/privacy-policy

---

## App Review Information

**Contact Information:**
- First Name: [Your First Name]
- Last Name: [Your Last Name]
- Phone Number: [Your Phone]
- Email: [Your Email]

**Demo Account (if needed):**
- Username: N/A
- Password: N/A
(No account required - app works offline)

**Notes:**
This app is designed for egg producers to track their inventory and sales. All data is stored locally on the device using AsyncStorage. No server connection or account required.

---

## Age Rating

**Age Rating:** 4+
- No objectionable content
- Designed for all ages

---

## App Store Screenshots Required

You'll need to provide screenshots for:

### iPhone 6.7" (iPhone 14 Pro Max, 15 Pro Max)
- 1290 x 2796 pixels
- Minimum 2 screenshots, maximum 10

### iPhone 6.5" (iPhone 11 Pro Max, XS Max)
- 1242 x 2688 pixels
- Minimum 2 screenshots, maximum 10

**Suggested Screenshots:**
1. Collection screen showing egg tracking
2. Inventory overview with egg counts
3. Packaging screen with quick-pack options
4. Sales screen with cartons ready to sell
5. Analytics/History view
6. Settings screen showing theme options

---

## What's New (Version 1.0.0)

Initial release of Egg Inventory - your complete egg farm management solution!

Features include:
• Track egg collections by species and color
• Package eggs into cartons with flexible quantities
• Record and manage sales with customer tracking
• View comprehensive analytics and sales history
• Choose from 14 beautiful themes (7 light + 7 dark)
• Complete offline functionality
• Privacy-first design with local data storage

---

## Copyright

© 2025 Fiddlehead Farm, LLC

---

## Build Commands

### To build for iOS App Store:

```bash
# Install EAS CLI (if not already installed)
npm install -g eas-cli

# Login to Expo
eas login

# Update the project ID in app.json after running:
eas init

# Build for iOS production
eas build --platform ios --profile production

# Submit to App Store (after updating eas.json with your Apple IDs)
eas submit --platform ios --profile production
```

### Before Building:

1. Update `app.json`:
   - Set the correct `extra.eas.projectId` (get from `eas init`)

2. Update `eas.json` submit section with:
   - Your Apple ID email
   - Your App Store Connect App ID (from App Store Connect)
   - Your Apple Team ID (from Apple Developer account)

3. Ensure you have:
   - Active Apple Developer Program membership
   - Created app in App Store Connect
   - App icon at ./assets/icon.png (1024x1024px)

---

## Post-Build Checklist

- [ ] Upload build to App Store Connect via EAS or Transporter
- [ ] Add screenshots for all required device sizes
- [ ] Fill in app description, keywords, categories
- [ ] Set pricing (free recommended)
- [ ] Provide privacy policy URL
- [ ] Answer App Review questions
- [ ] Submit for review
- [ ] Monitor review status in App Store Connect
