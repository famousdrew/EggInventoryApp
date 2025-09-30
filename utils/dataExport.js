import * as MailComposer from 'expo-mail-composer';
import { BoxedEggsStorage, InventoryStorage } from '../data/storage';
import { EGG_COLORS, getColorById } from '../data/eggColors';

// Generate CSV content for sales data
export const generateSalesCSV = async () => {
  try {
    const boxedEggs = await BoxedEggsStorage.getBoxedEggs();
    const soldBoxes = boxedEggs.filter(box => box.sold);

    // CSV headers
    let csvContent = 'Date,Customer,Egg Colors,Total Eggs,Price\n';

    // Add each sale as a row
    soldBoxes.forEach(box => {
      const date = new Date(box.soldDate).toLocaleDateString();
      const customer = box.customer || 'Unknown';

      // Build color breakdown string
      const colorBreakdown = [];
      Object.entries(box.colorMix).forEach(([colorId, quantity]) => {
        if (quantity > 0) {
          const colorName = getColorById(colorId)?.name || colorId;
          colorBreakdown.push(`${colorName}: ${quantity}`);
        }
      });
      const colorsText = colorBreakdown.join('; ');

      const totalEggs = box.totalEggs;
      const price = `$${box.price.toFixed(2)}`;

      // Escape commas in text fields by wrapping in quotes
      const escapedCustomer = customer.includes(',') ? `"${customer}"` : customer;
      const escapedColors = colorsText.includes(',') ? `"${colorsText}"` : colorsText;

      csvContent += `${date},${escapedCustomer},${escapedColors},${totalEggs},${price}\n`;
    });

    return csvContent;
  } catch (error) {
    console.error('Error generating sales CSV:', error);
    throw error;
  }
};

// Generate CSV content for inventory data
export const generateInventoryCSV = async () => {
  try {
    const inventory = await InventoryStorage.getInventory();

    // CSV headers
    let csvContent = 'Egg Color,Current Stock\n';

    // Add each color as a row
    EGG_COLORS.forEach(color => {
      const stock = inventory[color.id] || 0;
      if (stock > 0) {
        csvContent += `${color.name},${stock}\n`;
      }
    });

    return csvContent;
  } catch (error) {
    console.error('Error generating inventory CSV:', error);
    throw error;
  }
};

// Send email with sales data
export const emailSalesData = async (emailAddress = null) => {
  try {
    // Check if mail composer is available
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      throw new Error('Email is not available on this device');
    }

    // Generate CSV data
    const salesCSV = await generateSalesCSV();
    const inventoryCSV = await generateInventoryCSV();

    // Create email body with summary
    const emailBody = `
Egg Inventory Data Export
========================

This email contains your egg sales and inventory data exported from your Egg Inventory App.

Attachments:
- Sales Data: Complete record of all egg sales
- Current Inventory: Current stock levels

Generated on: ${new Date().toLocaleDateString()}

Best regards,
Your Egg Inventory App
`;

    // Compose email
    const mailOptions = {
      subject: `Egg Sales Data Export - ${new Date().toLocaleDateString()}`,
      body: emailBody,
      isHtml: false,
    };

    // Add recipient if provided
    if (emailAddress) {
      mailOptions.recipients = [emailAddress];
    }

    // Note: expo-mail-composer doesn't support attachments directly
    // Instead, we'll include the CSV data in the email body
    const combinedBody = emailBody + '\n\n--- SALES DATA (CSV FORMAT) ---\n' + salesCSV + '\n\n--- INVENTORY DATA (CSV FORMAT) ---\n' + inventoryCSV;

    mailOptions.body = combinedBody;

    // Open mail composer
    const result = await MailComposer.composeAsync(mailOptions);

    return result;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};