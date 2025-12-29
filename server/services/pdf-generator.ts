/**
 * PDF Generator Service
 * Generates PDF documents from meal plan data using pdfkit
 */

// Dynamic import to avoid font loading issues during module initialization
// pdfkit tries to load font files during import, which fails in Next.js build
let PDFDocument: any;
import type { MealPlanData } from '@shared/types';
import { log } from '@/lib/api-helpers';
import path from 'path';
import fs from 'fs';

interface GeneratePDFOptions {
  planData: MealPlanData;
  planType: 'daily' | 'weekly' | 'monthly';
  createdAt: string;
  isFreeTier: boolean;
}

/**
 * Theme color constants matching the SaaS dark theme
 */
const THEME_COLORS = {
  background: '#000000',
  primary: '#7CB342', // Electric Lime Green (HSL: 84 80% 50%)
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3', // Light grey (HSL: 0 0% 70%)
  cardBackground: '#1A1A1A', // Dark grey (HSL: 240 10% 8% approximation)
  border: '#7CB342', // Primary green
  accent: '#FF6B4A', // Coral/orange (HSL: 16 90% 65% approximation)
  darkGrey: '#0D0D0D', // Very dark grey for gradients
  divider: '#7CB342', // Primary green for dividers
};

/**
 * Page layout constants for uniform formatting
 */
const PAGE_LAYOUT = {
  margin: 50,
  topMargin: 60,
  bottomMargin: 60,
  cardPadding: 15,
  sectionSpacing: 25,
  mealSpacing: 20,
  minContentHeight: 100, // Minimum space needed before forcing page break
};

/**
 * Sanitize text to prevent encoding issues and remove invalid characters
 */
function sanitizeText(text: any): string {
  if (!text) return '';
  
  // Convert to string
  let sanitized = String(text);
  
  // Remove null bytes and control characters (except newlines and tabs)
  sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
  
  // Remove any characters that might cause encoding issues
  // Keep only printable ASCII, common Unicode ranges, and newlines
  sanitized = sanitized.replace(/[^\x20-\x7E\n\r\t\u00A0-\uFFFF]/g, '');
  
  // Normalize whitespace (but preserve intentional line breaks)
  sanitized = sanitized.replace(/[ \t]+/g, ' '); // Multiple spaces/tabs to single space
  sanitized = sanitized.replace(/\r\n/g, '\n'); // Normalize line endings
  sanitized = sanitized.replace(/\r/g, '\n'); // Convert \r to \n
  
  // Trim each line
  sanitized = sanitized.split('\n').map(line => line.trim()).join('\n');
  
  // Remove excessive blank lines (more than 2 consecutive)
  sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
  
  return sanitized.trim();
}

/**
 * Check if we need a page break and add one if needed
 * Only creates a page if there's actually content to add
 */
function checkPageBreak(doc: any, requiredHeight: number, currentY: number, isFreeTier: boolean = false): number {
  const pageHeight = doc.page.height;
  const bottomMargin = PAGE_LAYOUT.bottomMargin;
  const availableHeight = pageHeight - currentY - bottomMargin;
  
  // Only create page break if we truly don't have enough space
  // Add a small buffer to prevent unnecessary page breaks
  if (availableHeight < (requiredHeight + 20)) {
    // Add new page - background and watermark are automatically added via 'pageAdded' event
    doc.addPage();
    return PAGE_LAYOUT.topMargin;
  }
  
  return currentY;
}

/**
 * Add static background pattern to page
 * Creates a dark gradient with subtle geometric pattern overlay
 * MUST be called on every page to ensure black background
 */
function addBackgroundPattern(doc: any) {
  try {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    
    // CRITICAL: Set black background FIRST - this ensures page is never white
    doc.rect(0, 0, pageWidth, pageHeight)
       .fillColor(THEME_COLORS.background)
       .fill();
    
    // Add subtle grid pattern in primary green at low opacity
    doc.save();
    doc.opacity(0.05);
    doc.strokeColor(THEME_COLORS.primary);
    doc.lineWidth(0.5);
    
    // Draw subtle grid lines
    const gridSpacing = 50;
    for (let x = 0; x < pageWidth; x += gridSpacing) {
      doc.moveTo(x, 0)
         .lineTo(x, pageHeight)
         .stroke();
    }
    for (let y = 0; y < pageHeight; y += gridSpacing) {
      doc.moveTo(0, y)
         .lineTo(pageWidth, y)
         .stroke();
    }
    
    // Add subtle diagonal pattern
    doc.opacity(0.03);
    for (let i = -pageHeight; i < pageWidth + pageHeight; i += 100) {
      doc.moveTo(i, 0)
         .lineTo(i + pageHeight, pageHeight)
         .stroke();
    }
    
    doc.restore();
    doc.opacity(1.0);
  } catch (error: any) {
    console.warn('Warning: Could not add background pattern:', error.message);
    // Fallback to solid black background - CRITICAL to prevent white pages
    try {
      doc.rect(0, 0, doc.page.width, doc.page.height)
         .fillColor(THEME_COLORS.background)
         .fill();
    } catch (fillError: any) {
      // Last resort - try alternative method
      console.error('Failed to set background color:', fillError.message);
    }
  }
}

/**
 * Generate a PDF buffer from meal plan data
 */
export async function generateMealPlanPDF(options: GeneratePDFOptions): Promise<Buffer> {
  const { planData, planType, createdAt, isFreeTier } = options;

  // Dynamically import pdfkit to avoid font loading issues
  if (!PDFDocument) {
    try {
      // Set pdfkit font path to node_modules location before importing
      // This ensures pdfkit can find font files even in Next.js build
      const pdfkitDataPath = path.resolve(process.cwd(), 'node_modules/pdfkit/js/data');
      const buildDataPath = path.resolve(process.cwd(), '.next/server/vendor-chunks/data');
      
      // If build path doesn't exist but pdfkit path does, create symlink or copy
      if (fs.existsSync(pdfkitDataPath) && !fs.existsSync(buildDataPath)) {
        try {
          // Create directory if it doesn't exist
          const buildDir = path.dirname(buildDataPath);
          if (!fs.existsSync(buildDir)) {
            fs.mkdirSync(buildDir, { recursive: true });
          }
          // Create symlink to pdfkit font files
          if (!fs.existsSync(buildDataPath)) {
            fs.symlinkSync(pdfkitDataPath, buildDataPath, 'dir');
          }
        } catch (symlinkError: any) {
          // If symlink fails (e.g., on Windows), try copying files
          if (!fs.existsSync(buildDataPath)) {
            const { execSync } = require('child_process');
            try {
              execSync(`cp -r "${pdfkitDataPath}" "${buildDataPath}"`, { stdio: 'ignore' });
            } catch (copyError: any) {
              // Font copy failed, but continue - pdfkit may still work with fallback fonts
              log(`Warning: Could not copy pdfkit font files: ${copyError.message}`, 'pdf-generator');
            }
          }
        }
      }
      
      const pdfkitModule = await import('pdfkit');
      PDFDocument = pdfkitModule.default || pdfkitModule;
    } catch (importError: any) {
      throw new Error(`Failed to import pdfkit: ${importError.message}`);
    }
  }

  return new Promise((resolve, reject) => {
    let doc: any;
    try {
      // Create PDFDocument - wrap constructor in try-catch to handle font loading errors
      try {
        doc = new PDFDocument({
          size: 'A4',
          margins: { top: 50, bottom: 50, left: 50, right: 50 },
          autoFirstPage: true,
        });
        log('PDFDocument created successfully (using default font)', 'pdf-generator');
      } catch (constructorError: any) {
        // If constructor fails due to font loading, this is a pdfkit/Next.js compatibility issue
        if (constructorError.message?.includes('.afm') || constructorError.message?.includes('Helvetica') || (constructorError.message?.includes('ENOENT') && constructorError.message?.includes('font'))) {
          reject(new Error(`PDF generation failed: pdfkit cannot load required font files in the Next.js build environment. This is a known compatibility issue. Error: ${constructorError.message}`));
          return;
        }
        throw constructorError;
      }

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(buffers);
        resolve(pdfBuffer);
      });
      doc.on('error', (error: Error) => {
        console.error('PDF generation error:', error);
        reject(new Error(`Failed to generate PDF: ${error.message}`));
      });

      // CRITICAL: Set up automatic background on every new page
      // This ensures ALL pages (including auto-created ones) have black background
      doc.on('pageAdded', () => {
        addBackgroundPattern(doc);
        if (isFreeTier) {
          addWatermark(doc);
        }
      });

      // CRITICAL: Ensure first page has background applied
      // The constructor sets the first page, but we need to ensure background is applied
      // before any content is added
      addBackgroundPattern(doc);
      
      // Add watermark if free tier (before other content)
      if (isFreeTier) {
        addWatermark(doc);
      }

      // Cover page
      addCoverPage(doc, planData, planType, createdAt);

      // Daily plans
      if (planData.days && Array.isArray(planData.days) && planData.days.length > 0) {
        planData.days.forEach((day, index) => {
          // Only add new page if there's actual content
          if (day && typeof day === 'object') {
            doc.addPage();
            // Background and watermark are automatically added via 'pageAdded' event
            addDayPlan(doc, day, index + 1, isFreeTier);
          }
        });
      }

      // Grocery list
      if (planData.groceryList && Object.keys(planData.groceryList).length > 0) {
        // Check if we need a new page for grocery list
        // If last day page has enough space, continue on same page
        const hasDays = planData.days && Array.isArray(planData.days) && planData.days.length > 0;
        if (hasDays) {
          doc.addPage();
          // Background and watermark are automatically added via 'pageAdded' event
        }
        addGroceryList(doc, planData.groceryList, isFreeTier);
      }

      doc.end();
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      // Provide more specific error messages
      if (error.message?.includes('font') || error.message?.includes('.afm') || error.message?.includes('ENOENT')) {
        reject(new Error(`PDF font error: Please ensure only standard fonts are used. ${error.message}`));
      } else {
        reject(new Error(`Failed to generate PDF: ${error.message}`));
      }
    }
  });
}

/**
 * Add watermark to page (styled with primary green)
 */
function addWatermark(doc: any) {
  try {
    doc.save();
    doc.rotate(-45, { origin: [300, 400] });
    doc.opacity(0.12); // Slightly more visible on dark background
    // Don't set font - use pdfkit default to avoid font file loading
    doc.fontSize(52)
       .fillColor(THEME_COLORS.primary) // Use primary green color
       .text('TAILOREDMEALPLAN.COM - FREE VERSION', 0, 0, {
         align: 'center',
         width: 800,
       });
    doc.restore();
    doc.opacity(1.0);
  } catch (error: any) {
    console.warn('Warning: Could not add watermark:', error.message);
    doc.restore();
    doc.opacity(1.0);
  }
}

/**
 * Add cover page (redesigned with dark theme)
 */
function addCoverPage(
  doc: any,
  planData: MealPlanData,
  planType: string,
  createdAt: string
) {
  const planTypeLabel = planType.charAt(0).toUpperCase() + planType.slice(1);
  const createdDate = new Date(createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  let yPos = 80;

  // Brand header section
  doc.fontSize(24)
     .fillColor(THEME_COLORS.primary)
     .text('TAILOREDMEALPLAN.COM', 50, yPos, { align: 'center' });
  
  yPos += 40;

  // Plan type badge
  const badgeWidth = 150;
  const badgeHeight = 35;
  const badgeX = (doc.page.width - badgeWidth) / 2;
  doc.rect(badgeX, yPos, badgeWidth, badgeHeight)
     .fill(THEME_COLORS.primary);
  doc.fontSize(16)
     .fillColor(THEME_COLORS.background)
     .text(`${planTypeLabel.toUpperCase()} PLAN`, badgeX, yPos + 10, {
       width: badgeWidth,
       align: 'center',
     });

  yPos += badgeHeight + 30;

  // Generated date
  doc.fontSize(12)
     .fillColor(THEME_COLORS.textSecondary)
     .text(`Generated on ${createdDate}`, 50, yPos, { align: 'center' });

  yPos += 50;

  // Main title
  doc.fontSize(36)
     .fillColor(THEME_COLORS.textPrimary)
     .text('YOUR PERSONALIZED', 50, yPos, { align: 'center' });
  
  yPos += 40;
  
  doc.fontSize(36)
     .fillColor(THEME_COLORS.textPrimary)
     .text('MEAL PLAN', 50, yPos, { align: 'center' });

  yPos += 60;

  // Overview section
  if (planData.overview && typeof planData.overview === 'object') {
    const { overview } = planData;

    // Section header
    doc.fontSize(22)
       .fillColor(THEME_COLORS.textPrimary)
       .text('NUTRITION OVERVIEW', PAGE_LAYOUT.margin, yPos, { align: 'center' });

    yPos += 50;

    // Stats boxes - grid layout
    const boxWidth = 110;
    const boxHeight = 90;
    const spacing = 15;
    const totalWidth = (boxWidth * 4) + (spacing * 3);
    let xPos = (doc.page.width - totalWidth) / 2;

    // Daily Calories
    doc.rect(xPos, yPos, boxWidth, boxHeight)
       .fillAndStroke(THEME_COLORS.cardBackground, THEME_COLORS.border);
    doc.fontSize(11)
       .fillColor(THEME_COLORS.textSecondary)
       .text('Daily Calories', xPos + 8, yPos + 12, { width: boxWidth - 16, align: 'center' });
    doc.fontSize(28)
       .fillColor(THEME_COLORS.primary)
       .text(String(overview.dailyCalories || 'N/A'), xPos + 8, yPos + 35, {
         width: boxWidth - 16,
         align: 'center',
       });

    xPos += boxWidth + spacing;

    // Protein
    if (overview.macros?.protein) {
      doc.rect(xPos, yPos, boxWidth, boxHeight)
         .fillAndStroke(THEME_COLORS.cardBackground, THEME_COLORS.border);
      doc.fontSize(11)
         .fillColor(THEME_COLORS.textSecondary)
         .text('Protein', xPos + 8, yPos + 12, { width: boxWidth - 16, align: 'center' });
      doc.fontSize(28)
         .fillColor(THEME_COLORS.primary)
         .text(`${overview.macros.protein}g`, xPos + 8, yPos + 35, {
           width: boxWidth - 16,
           align: 'center',
         });
      xPos += boxWidth + spacing;
    }

    // Carbs
    if (overview.macros?.carbs) {
      doc.rect(xPos, yPos, boxWidth, boxHeight)
         .fillAndStroke(THEME_COLORS.cardBackground, THEME_COLORS.border);
      doc.fontSize(11)
         .fillColor(THEME_COLORS.textSecondary)
         .text('Carbs', xPos + 8, yPos + 12, { width: boxWidth - 16, align: 'center' });
      doc.fontSize(28)
         .fillColor(THEME_COLORS.primary)
         .text(`${overview.macros.carbs}g`, xPos + 8, yPos + 35, {
           width: boxWidth - 16,
           align: 'center',
         });
      xPos += boxWidth + spacing;
    }

    // Fat
    if (overview.macros?.fat) {
      doc.rect(xPos, yPos, boxWidth, boxHeight)
         .fillAndStroke(THEME_COLORS.cardBackground, THEME_COLORS.border);
      doc.fontSize(11)
         .fillColor(THEME_COLORS.textSecondary)
         .text('Fat', xPos + 8, yPos + 12, { width: boxWidth - 16, align: 'center' });
      doc.fontSize(28)
         .fillColor(THEME_COLORS.primary)
         .text(`${overview.macros.fat}g`, xPos + 8, yPos + 35, {
           width: boxWidth - 16,
           align: 'center',
         });
    }

    if (overview.duration) {
      yPos += boxHeight + 30;
      doc.fontSize(12)
         .fillColor(THEME_COLORS.textSecondary)
         .text(
           `Plan Duration: ${overview.duration} ${overview.duration === 1 ? 'day' : 'days'}`,
           50,
           yPos,
           { align: 'center' }
         );
    }
  }

  // Footer - Professional formatting
  const footerY = doc.page.height - PAGE_LAYOUT.bottomMargin;
  doc.fontSize(11)
     .fillColor(THEME_COLORS.textSecondary)
     .text(
       'TailoredMealPlan.com',
       PAGE_LAYOUT.margin,
       footerY - 5,
       { align: 'center', width: doc.page.width - (PAGE_LAYOUT.margin * 2) }
     );
  doc.fontSize(9)
     .fillColor(THEME_COLORS.textSecondary)
     .opacity(0.8)
     .text(
       'Personalized Nutrition Plans',
       PAGE_LAYOUT.margin,
       footerY + 10,
       { align: 'center', width: doc.page.width - (PAGE_LAYOUT.margin * 2) }
     );
  doc.opacity(1.0);
}

/**
 * Add daily plan (redesigned with dark theme and page break handling)
 */
function addDayPlan(doc: any, day: any, dayNumber: number, isFreeTier: boolean = false) {
  const meals = day.meals || {};
  let yPos = PAGE_LAYOUT.topMargin;

  // Day header - large, bold, uppercase in primary green
  doc.fontSize(32)
     .fillColor(THEME_COLORS.primary)
     .text(`DAY ${dayNumber}`, PAGE_LAYOUT.margin, yPos);
  
  yPos += 45;
  
  // Check page break before divider
  yPos = checkPageBreak(doc, 50, yPos, isFreeTier);
  
  // Horizontal divider line in primary green
  doc.strokeColor(THEME_COLORS.divider);
  doc.lineWidth(2);
  doc.moveTo(PAGE_LAYOUT.margin, yPos)
     .lineTo(doc.page.width - PAGE_LAYOUT.margin, yPos)
     .stroke();
  
  yPos += 30;

  // Breakfast
  if (meals.breakfast) {
    yPos = addMeal(doc, meals.breakfast, 'Breakfast', yPos, isFreeTier);
    yPos += PAGE_LAYOUT.mealSpacing;
  }

  // Lunch
  if (meals.lunch) {
    yPos = addMeal(doc, meals.lunch, 'Lunch', yPos, isFreeTier);
    yPos += PAGE_LAYOUT.mealSpacing;
  }

  // Dinner
  if (meals.dinner) {
    yPos = addMeal(doc, meals.dinner, 'Dinner', yPos, isFreeTier);
    yPos += PAGE_LAYOUT.mealSpacing;
  }

  // Snacks
  if (meals.snacks && Array.isArray(meals.snacks) && meals.snacks.length > 0) {
    // Check if we have space for snacks section
    yPos = checkPageBreak(doc, 100, yPos, isFreeTier);
    
    // Snacks header
    doc.fontSize(18)
       .fillColor(THEME_COLORS.primary)
       .text('SNACKS', PAGE_LAYOUT.margin, yPos);
    yPos += 30;

    meals.snacks.forEach((snack: any) => {
      // Check page break before each snack
      yPos = checkPageBreak(doc, 70, yPos, isFreeTier);
      
      // Snack card
      const snackCardHeight = 50;
      doc.rect(PAGE_LAYOUT.margin, yPos, doc.page.width - (PAGE_LAYOUT.margin * 2), snackCardHeight)
         .fillAndStroke(THEME_COLORS.cardBackground, THEME_COLORS.border);
      
      const snackName = sanitizeText(snack?.name || 'Snack');
      doc.fontSize(14)
         .fillColor(THEME_COLORS.textPrimary)
         .text(snackName, PAGE_LAYOUT.margin + PAGE_LAYOUT.cardPadding, yPos + 12, {
           width: doc.page.width - (PAGE_LAYOUT.margin * 2) - (PAGE_LAYOUT.cardPadding * 2),
           ellipsis: true,
         });
      
      if (snack?.nutrition?.calories) {
        doc.fontSize(11)
           .fillColor(THEME_COLORS.textSecondary)
           .text(`${snack.nutrition.calories} kcal`, PAGE_LAYOUT.margin + PAGE_LAYOUT.cardPadding, yPos + 30);
      }
      
      yPos += snackCardHeight + 15;
    });
  }

  // Footer - Professional formatting (only if there's space)
  const footerY = doc.page.height - PAGE_LAYOUT.bottomMargin;
  if (yPos < footerY - 25) {
    doc.fontSize(11)
       .fillColor(THEME_COLORS.textSecondary)
       .text(
         'TailoredMealPlan.com',
         PAGE_LAYOUT.margin,
         footerY - 5,
         { align: 'center', width: doc.page.width - (PAGE_LAYOUT.margin * 2) }
       );
    doc.fontSize(9)
       .fillColor(THEME_COLORS.textSecondary)
       .opacity(0.8)
       .text(
         'Personalized Nutrition Plans',
         PAGE_LAYOUT.margin,
         footerY + 10,
         { align: 'center', width: doc.page.width - (PAGE_LAYOUT.margin * 2) }
       );
    doc.opacity(1.0);
  }
}

/**
 * Add meal details (redesigned with dark theme, enhanced card design, and page break handling)
 */
function addMeal(
  doc: any,
  meal: any,
  mealType: string,
  yPos: number,
  isFreeTier: boolean = false
): number {
  if (!meal || typeof meal !== 'object') {
    return yPos; // Skip invalid meals
  }

  const cardPadding = PAGE_LAYOUT.cardPadding;
  const cardX = PAGE_LAYOUT.margin;
  const cardWidth = doc.page.width - (PAGE_LAYOUT.margin * 2);
  let currentY = yPos;

  // Estimate required height for meal card (approximate)
  const estimatedHeight = 200; // Base estimate
  currentY = checkPageBreak(doc, estimatedHeight, currentY, isFreeTier);

  // Meal type label - primary green, bold, uppercase
  doc.fontSize(16)
     .fillColor(THEME_COLORS.primary)
     .text(mealType.toUpperCase(), cardX, currentY);
  currentY += 25;

  // Meal card background start position
  const cardStartY = currentY;

  // Meal name - sanitize and validate
  const mealName = sanitizeText(meal.name || 'N/A');
  if (mealName && mealName.length > 0) {
    doc.fontSize(18)
       .fillColor(THEME_COLORS.textPrimary)
       .text(mealName, cardX + cardPadding, currentY, {
         width: cardWidth - (cardPadding * 2),
         ellipsis: true,
       });
    currentY += 25;
  } else {
    currentY += 10;
  }

  // Nutrition info box
  if (meal.nutrition && typeof meal.nutrition === 'object') {
    const nutrition = meal.nutrition;
    const nutritionBoxHeight = 40;
    
    // Check page break before nutrition box
    currentY = checkPageBreak(doc, nutritionBoxHeight + 30, currentY, isFreeTier);
    const nutritionBoxY = currentY;
    
    // Nutrition box with primary green border
    doc.rect(cardX + cardPadding, nutritionBoxY, cardWidth - (cardPadding * 2), nutritionBoxHeight)
       .fillAndStroke(THEME_COLORS.cardBackground, THEME_COLORS.border);
    
    const nutritionParts = [
      nutrition.calories ? `${nutrition.calories} kcal` : null,
      nutrition.protein ? `P: ${nutrition.protein}g` : null,
      nutrition.carbs ? `C: ${nutrition.carbs}g` : null,
      nutrition.fat ? `F: ${nutrition.fat}g` : null,
    ].filter(Boolean);
    
    if (nutritionParts.length > 0) {
      const nutritionText = nutritionParts.join(' • ');
      doc.fontSize(12)
         .fillColor(THEME_COLORS.primary)
         .text(nutritionText, cardX + cardPadding + 8, nutritionBoxY + 12, {
           width: cardWidth - (cardPadding * 2) - 16,
         });
    }
    
    currentY = nutritionBoxY + nutritionBoxHeight + 20;
  } else {
    currentY += 10;
  }

  // Ingredients section
  if (meal.ingredients && Array.isArray(meal.ingredients) && meal.ingredients.length > 0) {
    // Check page break before ingredients
    const ingredientsHeight = 20 + (meal.ingredients.length * 18);
    currentY = checkPageBreak(doc, ingredientsHeight, currentY, isFreeTier);
    
    doc.fontSize(12)
       .fillColor(THEME_COLORS.textSecondary)
       .text('INGREDIENTS:', cardX + cardPadding, currentY);
    currentY += 18;

    meal.ingredients.forEach((ingredient: any) => {
      const sanitizedIngredient = sanitizeText(ingredient);
      if (sanitizedIngredient && sanitizedIngredient.length > 0) {
        // Check if we need page break for this ingredient
        currentY = checkPageBreak(doc, 20, currentY, isFreeTier);
        
        doc.fontSize(11)
           .fillColor(THEME_COLORS.textPrimary)
           .text(`• ${sanitizedIngredient}`, cardX + cardPadding + 10, currentY, {
             width: cardWidth - (cardPadding * 2) - 20,
             ellipsis: true,
           });
        currentY += 15;
      }
    });
    currentY += 10;
  }

  // Instructions section
  if (meal.instructions) {
    // Handle instructions as string or array
    let instructionsText = '';
    if (Array.isArray(meal.instructions)) {
      // If instructions is an array, join with newlines and number them
      instructionsText = meal.instructions
        .map((step: any, index: number) => `${index + 1}. ${sanitizeText(step)}`)
        .join('\n\n');
    } else {
      instructionsText = sanitizeText(meal.instructions);
    }
    
    if (instructionsText && instructionsText.length > 0) {
      // Limit instructions length to prevent excessive pages
      const maxInstructionsLength = 2000;
      if (instructionsText.length > maxInstructionsLength) {
        instructionsText = instructionsText.substring(0, maxInstructionsLength) + '...';
      }
      
      // Estimate instructions height
      const textWidth = cardWidth - (cardPadding * 2) - 20;
      const estimatedInstructionsHeight = Math.min(
        doc.heightOfString(instructionsText, { width: textWidth }) + 40,
        400 // Cap at reasonable height
      );
      
      // Check page break before instructions
      currentY = checkPageBreak(doc, estimatedInstructionsHeight, currentY, isFreeTier);
      
      doc.fontSize(12)
         .fillColor(THEME_COLORS.textSecondary)
         .text('INSTRUCTIONS:', cardX + cardPadding, currentY);
      currentY += 18;

      doc.fontSize(11)
         .fillColor(THEME_COLORS.textPrimary)
         .text(instructionsText, cardX + cardPadding + 10, currentY, {
           width: textWidth,
           lineGap: 4,
           ellipsis: true,
         });
      
      const actualHeight = doc.heightOfString(instructionsText, {
        width: textWidth,
      });
      currentY += actualHeight + 15;
    }
  }

  // Draw meal card border
  const cardHeight = currentY - cardStartY + 10;
  if (cardHeight > 0) {
    doc.rect(cardX, cardStartY - 5, cardWidth, cardHeight)
       .stroke(THEME_COLORS.border);
  }

  return currentY + 10;
}

/**
 * Add grocery list (redesigned with dark theme and page break handling)
 */
function addGroceryList(doc: any, groceryList: any, isFreeTier: boolean = false) {
  if (!groceryList || typeof groceryList !== 'object') {
    return; // Skip invalid grocery lists
  }

  let yPos = PAGE_LAYOUT.topMargin;

  // Header - large, bold, uppercase in primary green
  doc.fontSize(32)
     .fillColor(THEME_COLORS.primary)
     .text('GROCERY LIST', PAGE_LAYOUT.margin, yPos, { align: 'center' });
  
  yPos += 50;
  
  // Horizontal divider line in primary green
  doc.strokeColor(THEME_COLORS.divider);
  doc.lineWidth(2);
  doc.moveTo(PAGE_LAYOUT.margin, yPos)
     .lineTo(doc.page.width - PAGE_LAYOUT.margin, yPos)
     .stroke();
  
  yPos += 30;

  Object.entries(groceryList).forEach(([category, items]) => {
    if (!Array.isArray(items) || items.length === 0) return;

    // Check page break before category
    const categoryHeight = 35 + (items.length * 18) + 30;
    yPos = checkPageBreak(doc, categoryHeight, yPos, isFreeTier);

    // Category header - dark grey box with primary green border
    const categoryHeaderHeight = 35;
    doc.rect(PAGE_LAYOUT.margin, yPos, doc.page.width - (PAGE_LAYOUT.margin * 2), categoryHeaderHeight)
       .fillAndStroke(THEME_COLORS.cardBackground, THEME_COLORS.border);
    
    const categoryName = sanitizeText(category);
    doc.fontSize(16)
       .fillColor(THEME_COLORS.primary)
       .text(categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toUpperCase(), 
             PAGE_LAYOUT.margin + PAGE_LAYOUT.cardPadding, yPos + 10);
    
    yPos += categoryHeaderHeight + 15;

    // Items list
    items.forEach((item: any) => {
      // Check page break before each item
      yPos = checkPageBreak(doc, 25, yPos, isFreeTier);
      
      const sanitizedItem = sanitizeText(item);
      if (sanitizedItem && sanitizedItem.length > 0) {
        doc.fontSize(12)
           .fillColor(THEME_COLORS.textPrimary)
           .text(`• ${sanitizedItem}`, PAGE_LAYOUT.margin + PAGE_LAYOUT.cardPadding, yPos, {
             width: doc.page.width - (PAGE_LAYOUT.margin * 2) - (PAGE_LAYOUT.cardPadding * 2),
             ellipsis: true,
           });
        yPos += 18;
      }
    });

    yPos += 15;
  });

  // Footer - Professional formatting (only if there's space)
  const footerY = doc.page.height - PAGE_LAYOUT.bottomMargin;
  if (yPos < footerY - 25) {
    doc.fontSize(11)
       .fillColor(THEME_COLORS.textSecondary)
       .text(
         'TailoredMealPlan.com',
         PAGE_LAYOUT.margin,
         footerY - 5,
         { align: 'center', width: doc.page.width - (PAGE_LAYOUT.margin * 2) }
       );
    doc.fontSize(9)
       .fillColor(THEME_COLORS.textSecondary)
       .opacity(0.8)
       .text(
         'Personalized Nutrition Plans',
         PAGE_LAYOUT.margin,
         footerY + 10,
         { align: 'center', width: doc.page.width - (PAGE_LAYOUT.margin * 2) }
       );
    doc.opacity(1.0);
  }
}

/**
 * Format nutrition information for display
 */
export function formatNutritionInfo(nutrition: {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}): string {
  const parts: string[] = [];
  if (nutrition.calories) parts.push(`${nutrition.calories} kcal`);
  if (nutrition.protein) parts.push(`P: ${nutrition.protein}g`);
  if (nutrition.carbs) parts.push(`C: ${nutrition.carbs}g`);
  if (nutrition.fat) parts.push(`F: ${nutrition.fat}g`);
  return parts.join(' • ');
}

/**
 * Format grocery list for display
 */
export function formatGroceryList(groceryList: any): string {
  if (!groceryList || typeof groceryList !== 'object') {
    return 'No items';
  }

  const items: string[] = [];
  Object.entries(groceryList).forEach(([category, categoryItems]) => {
    if (Array.isArray(categoryItems)) {
      items.push(`${category}: ${categoryItems.join(', ')}`);
    }
  });

  return items.join('\n');
}



