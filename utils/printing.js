import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

// Generate HTML for a box label
export const generateBoxLabelHTML = (box) => {
  const boxId = box.id.slice(-4); // Last 4 characters of ID
  const totalEggs = Object.values(box.colorMix).reduce((sum, count) => sum + count, 0);
  const datePackaged = new Date(box.dateBoxed).toLocaleDateString();

  // Generate egg mix description
  const eggMix = Object.entries(box.colorMix)
    .filter(([_, count]) => count > 0)
    .map(([colorId, count]) => {
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
      // Capitalize first letter of color name
      const colorName = colorId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `${count} ${colorName}`;
    })
    .join(', ');

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Box Label #${boxId}</title>
        <style>
          @page {
            size: 3in 2in;
            margin: 0.05in;
          }

          body {
            font-family: 'Arial Black', Arial, sans-serif;
            margin: 0;
            padding: 4px;
            background: white;
            color: black;
            font-size: 14px;
            line-height: 1.1;
            font-weight: bold;
          }

          .label-container {
            width: 100%;
            height: 100%;
            border: 3px solid #000;
            padding: 6px;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }

          .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 2px;
            margin-bottom: 3px;
          }

          .box-number {
            font-size: 32px;
            font-weight: 900;
            margin: 0;
            letter-spacing: 1px;
          }

          .farm-name {
            font-size: 11px;
            margin: 1px 0 0 0;
            color: #000;
            font-weight: bold;
          }

          .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: center;
            text-align: center;
          }

          .egg-count {
            font-size: 28px;
            font-weight: 900;
            text-align: center;
            margin: 2px 0;
            letter-spacing: 1px;
          }

          .egg-mix {
            font-size: 12px;
            text-align: center;
            color: #000;
            margin: 2px 0;
            word-wrap: break-word;
            font-weight: bold;
            line-height: 1.0;
          }

          .footer {
            border-top: 2px solid #000;
            padding-top: 2px;
            font-size: 10px;
            color: #000;
            text-align: center;
            font-weight: bold;
          }

          .date {
            margin: 0;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="label-container">
          <div class="header">
            <h1 class="box-number">BOX #${boxId}</h1>
            <p class="farm-name">Fresh Farm Eggs</p>
          </div>

          <div class="content">
            <div class="egg-count">${totalEggs} EGGS</div>
            <div class="egg-mix">${eggMix}</div>
          </div>

          <div class="footer">
            <p class="date">Packed: ${datePackaged}</p>
          </div>
        </div>
      </body>
    </html>
  `;
};

// Print a single box label
export const printBoxLabel = async (box) => {
  try {
    const html = generateBoxLabelHTML(box);

    await Print.printAsync({
      html,
      width: 216, // 3 inches at 72 DPI
      height: 144, // 2 inches at 72 DPI
      orientation: Print.Orientation.landscape,
      margins: {
        left: 0.05,
        top: 0.05,
        right: 0.05,
        bottom: 0.05,
      },
    });
  } catch (error) {
    console.error('Error printing box label:', error);
    Alert.alert('Print Error', 'Failed to print label. Please try again.');
  }
};

// Print multiple box labels
export const printMultipleBoxLabels = async (boxes) => {
  try {
    if (!boxes || boxes.length === 0) {
      Alert.alert('No Boxes', 'No boxes selected for printing.');
      return;
    }

    // Generate HTML for all boxes
    const allLabelsHTML = boxes.map(box => {
      const labelHTML = generateBoxLabelHTML(box);
      // Extract just the label content from the full HTML
      const labelContent = labelHTML.match(/<div class="label-container">.*?<\/div>/s)[0];
      return `
        <div style="page-break-after: always; width: 3in; height: 2in; margin: 0.05in;">
          ${labelContent}
        </div>
      `;
    }).join('');

    const multipleLabelsHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Box Labels</title>
          <style>
            ${generateBoxLabelHTML(boxes[0]).match(/<style>(.*?)<\/style>/s)[1]}

            .multi-label-container {
              display: flex;
              flex-direction: column;
            }

            @page {
              size: 3in 2in;
              margin: 0.05in;
            }
          </style>
        </head>
        <body>
          <div class="multi-label-container">
            ${allLabelsHTML}
          </div>
        </body>
      </html>
    `;

    await Print.printAsync({
      html: multipleLabelsHTML,
      width: 216, // 3 inches at 72 DPI
      height: 144, // 2 inches at 72 DPI
      orientation: Print.Orientation.landscape,
      margins: {
        left: 0.05,
        top: 0.05,
        right: 0.05,
        bottom: 0.05,
      },
    });
  } catch (error) {
    console.error('Error printing multiple box labels:', error);
    Alert.alert('Print Error', 'Failed to print labels. Please try again.');
  }
};

// Print to PDF for saving/sharing
export const printBoxLabelToPDF = async (box) => {
  try {
    const html = generateBoxLabelHTML(box);

    const { uri } = await Print.printToFileAsync({
      html,
      width: 216, // 3 inches at 72 DPI
      height: 144, // 2 inches at 72 DPI
      orientation: Print.Orientation.landscape,
      margins: {
        left: 0.05,
        top: 0.05,
        right: 0.05,
        bottom: 0.05,
      },
    });

    return uri;
  } catch (error) {
    console.error('Error creating PDF:', error);
    Alert.alert('PDF Error', 'Failed to create PDF. Please try again.');
    return null;
  }
};

// Select printer (iOS only)
export const selectPrinter = async () => {
  try {
    if (Print.selectPrinterAsync) {
      const printer = await Print.selectPrinterAsync();
      return printer;
    } else {
      Alert.alert(
        'Printer Selection',
        'Printer selection is only available on iOS. On Android, you can select the printer in the print dialog.'
      );
      return null;
    }
  } catch (error) {
    console.error('Error selecting printer:', error);
    Alert.alert('Error', 'Failed to select printer.');
    return null;
  }
};

// Alternative printing method for Bluetooth thermal printers
export const printToBluetoothThermalPrinter = async (box) => {
  try {
    // Generate PDF version of the label
    const html = generateBoxLabelHTML(box);
    const { uri } = await Print.printToFileAsync({
      html,
      width: 216, // 3 inches at 72 DPI
      height: 144, // 2 inches at 72 DPI
      orientation: Print.Orientation.landscape,
      margins: {
        left: 0.05,
        top: 0.05,
        right: 0.05,
        bottom: 0.05,
      },
    });

    // Show options for Bluetooth printing
    Alert.alert(
      'Bluetooth Thermal Printer',
      'Your label PDF is ready. Choose your printing method:',
      [
        {
          text: 'Save to Files',
          onPress: async () => {
            try {
              await saveToDownloads(uri, `box-${box.id.slice(-4)}-label.pdf`);
            } catch (error) {
              Alert.alert('Error', 'Failed to save file');
            }
          }
        },
        {
          text: 'Share to Print App',
          onPress: async () => {
            try {
              await Sharing.shareAsync(uri, {
                mimeType: 'application/pdf',
                dialogTitle: 'Print with Bluetooth Printer App'
              });
            } catch (error) {
              Alert.alert('Error', 'Failed to share file');
            }
          }
        },
        {
          text: 'Regular Print Dialog',
          onPress: async () => {
            await printBoxLabel(box);
          }
        },
        { text: 'Cancel', style: 'cancel' }
      ]
    );

  } catch (error) {
    console.error('Error preparing Bluetooth thermal print:', error);
    Alert.alert('Error', 'Failed to prepare label for Bluetooth printer');
  }
};

// Save file to device downloads/documents folder
const saveToDownloads = async (uri, filename) => {
  try {
    if (Platform.OS === 'android') {
      // Request permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant storage permissions to save files');
        return;
      }

      // Save to downloads
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('EggApp Labels', asset, false);

      Alert.alert(
        'Saved!',
        `Label saved to device storage as "${filename}"\n\nFor Bluetooth printing:\n1. Open RawBT app\n2. Connect to your thermal printer\n3. The label will auto-print when detected`,
        [{ text: 'OK' }]
      );
    } else {
      // iOS - save to Files app
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle: 'Save Label to Files'
      });
    }
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

// Generate thermal printer compatible format
export const generateThermalPrinterLabel = (box) => {
  const boxId = box.id.slice(-4);
  const totalEggs = Object.values(box.colorMix).reduce((sum, count) => sum + count, 0);
  const datePackaged = new Date(box.dateBoxed).toLocaleDateString();

  // Generate simplified text format for thermal printers
  const eggMix = Object.entries(box.colorMix)
    .filter(([_, count]) => count > 0)
    .map(([colorId, count]) => {
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
      const colorName = colorId.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      return `${count} ${colorName}`;
    })
    .join(', ');

  // Simple text format that thermal printers can handle
  return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
     FRESH FARM EGGS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

BOX #${boxId}

${totalEggs} EGGS

${eggMix}

Packed: ${datePackaged}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `;
};