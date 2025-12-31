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
 * Returns the new Y position after potential page break
 */
function checkPageBreak(doc: any, requiredHeight: number, currentY: number, isFreeTier: boolean = false): number {
  const pageHeight = doc.page.height;
  const bottomMargin = PAGE_LAYOUT.bottomMargin;
  const availableHeight = pageHeight - currentY - bottomMargin;
  
  // Only create page break if we truly don't have enough space
  // Add a larger buffer (60px) to prevent text overlap and ensure proper spacing
  // Increased buffer to prevent content from being too close to bottom
  if (availableHeight < (requiredHeight + 60)) {
    // Add new page - background is automatically added via 'pageAdded' event
    doc.addPage();
    // Reset Y position to top margin with extra spacing
    return PAGE_LAYOUT.topMargin + 10;
  }
  
  return currentY;
}

/**
 * Calculate actual text height for multi-line text
 */
function getTextHeight(doc: any, text: string, width: number, fontSize: number, lineGap: number = 4): number {
  if (!text || text.length === 0) return 0;
  
  try {
    // Use pdfkit's heightOfString method if available
    const height = doc.heightOfString(text, {
      width: width,
      lineGap: lineGap,
    });
    return height || (fontSize * 1.2); // Fallback estimate
  } catch (error) {
    // Fallback: estimate based on text length and width
    const estimatedLines = Math.ceil((text.length * fontSize * 0.6) / width);
    return estimatedLines * (fontSize * 1.2 + lineGap);
  }
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
    // Use fillRect for better performance and to ensure it's drawn first
    doc.save();
    doc.fillColor(THEME_COLORS.background);
    doc.rect(0, 0, pageWidth, pageHeight)
       .fill();
    doc.restore();
    
    // Remove grid lines completely - they conflict with content
    // Only keep very subtle diagonal pattern if needed (commented out for now)
    // Grid lines were causing visual conflicts with text and charts
    
  } catch (error: any) {
    console.warn('Warning: Could not add background pattern:', error.message);
    // Fallback to solid black background - CRITICAL to prevent white pages
    try {
      doc.save();
      doc.fillColor(THEME_COLORS.background);
      doc.rect(0, 0, doc.page.width, doc.page.height)
         .fill();
      doc.restore();
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
        // Watermark removed - premium feature for email delivery
      });

      // CRITICAL: Ensure first page has background applied
      // The constructor sets the first page, but we need to ensure background is applied
      // before any content is added
      addBackgroundPattern(doc);

      // Cover page
      addCoverPage(doc, planData, planType, createdAt);
      
      // Nutrition overview page with charts - only add if we have valid overview data
      const hasValidOverview = planData.overview && typeof planData.overview === 'object';
      const hasMacros = hasValidOverview && planData.overview.macros && 
                        (planData.overview.macros.protein || planData.overview.macros.carbs || planData.overview.macros.fat);
      const hasDaysForChart = planData.days && Array.isArray(planData.days) && planData.days.length > 0;
      
      if (hasValidOverview && (hasMacros || hasDaysForChart)) {
        doc.addPage();
        addNutritionOverview(doc, planData, planType);
      }

      // Daily plans - only add pages when there's actual content
      if (planData.days && Array.isArray(planData.days) && planData.days.length > 0) {
        planData.days.forEach((day, index) => {
          // Only add new page if there's actual content with meals
          if (day && typeof day === 'object' && day.meals && Object.keys(day.meals).length > 0) {
            // Check if we need a new page (don't add empty pages)
            const currentY = doc.y || PAGE_LAYOUT.topMargin;
            const pageHeight = doc.page.height;
            const availableSpace = pageHeight - currentY - PAGE_LAYOUT.bottomMargin;
            
            // Only add new page if current page doesn't have enough space (need at least 200px for day header)
            if (index > 0 && availableSpace < 200) {
              doc.addPage();
              // Background is automatically added via 'pageAdded' event
            } else if (index === 0) {
              // First day always needs a new page after nutrition overview
              doc.addPage();
            }
            addDayPlan(doc, day, index + 1, isFreeTier);
          }
        });
      }

      // Grocery list - check if we need a new page or can continue on current page
      if (planData.groceryList && Object.keys(planData.groceryList).length > 0) {
        // Check if current page has enough space (estimate 400px needed for grocery list)
        const hasDays = planData.days && Array.isArray(planData.days) && planData.days.length > 0;
        const currentPageY = doc.y || PAGE_LAYOUT.topMargin;
        const availableSpace = doc.page.height - currentPageY - PAGE_LAYOUT.bottomMargin;
        
        // Only add new page if we don't have enough space (need at least 400px to avoid empty pages)
        if (hasDays && availableSpace < 400) {
          doc.addPage();
          // Background is automatically added via 'pageAdded' event
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
 * Add nutrition overview page with macro breakdown and daily calories chart (modern design)
 */
function addNutritionOverview(doc: any, planData: MealPlanData, planType: string) {
  const overview = planData.overview;
  if (!overview || typeof overview !== 'object') {
    return;
  }

  let yPos = PAGE_LAYOUT.topMargin + 20;

  // Elegant page title
  doc.fontSize(32)
     .fillColor(THEME_COLORS.primary)
     .text('NUTRITION OVERVIEW', PAGE_LAYOUT.margin, yPos, { align: 'center' });
  
  yPos += 20;
  
  // Accent line
  doc.strokeColor(THEME_COLORS.primary);
  doc.lineWidth(2);
  doc.moveTo((doc.page.width - 300) / 2, yPos)
     .lineTo((doc.page.width + 300) / 2, yPos)
     .stroke();
  
  yPos += 50;

  // Macro Breakdown Section with modern visual design
  if (overview.macros) {
    doc.fontSize(20)
       .fillColor(THEME_COLORS.textPrimary)
       .text('MACRO BREAKDOWN', PAGE_LAYOUT.margin, yPos);
    
    yPos += 10;
    
    // Subtle accent line - reduced opacity to prevent conflicts
    doc.strokeColor(THEME_COLORS.primary);
    doc.lineWidth(1);
    doc.opacity(0.3); // Reduced from 0.5 to prevent visual conflicts
    doc.moveTo(PAGE_LAYOUT.margin, yPos)
       .lineTo(PAGE_LAYOUT.margin + 200, yPos)
       .stroke();
    doc.opacity(1.0);
    
    yPos += 35; // Increased spacing after accent line

    // Calculate percentages
    const totalMacros = (overview.macros.protein || 0) + (overview.macros.carbs || 0) + (overview.macros.fat || 0);
    const proteinPercent = totalMacros > 0 ? ((overview.macros.protein || 0) / totalMacros) * 100 : 0;
    const carbsPercent = totalMacros > 0 ? ((overview.macros.carbs || 0) / totalMacros) * 100 : 0;
    const fatPercent = totalMacros > 0 ? ((overview.macros.fat || 0) / totalMacros) * 100 : 0;

    // Modern macro cards with visual progress bars
    const chartX = PAGE_LAYOUT.margin;
    const chartY = yPos;
    const chartWidth = doc.page.width - (PAGE_LAYOUT.margin * 2);
    const boxHeight = 65;
    const spacing = 20;

    // Protein card with progress bar
    doc.rect(chartX, chartY, chartWidth, boxHeight)
       .fillAndStroke(THEME_COLORS.cardBackground, '#84cc16');
    doc.lineWidth(3);
    doc.rect(chartX, chartY, chartWidth, boxHeight)
       .stroke('#84cc16');
    
    // Progress bar visualization
    const progressWidth = (proteinPercent / 100) * (chartWidth - 40);
    doc.rect(chartX + 20, chartY + boxHeight - 12, progressWidth, 8)
       .fill('#84cc16');
    
    doc.fontSize(16)
       .fillColor('#84cc16')
       .text('PROTEIN', chartX + 25, chartY + 15);
    doc.fontSize(28)
       .fillColor('#84cc16')
       .text(`${proteinPercent.toFixed(0)}%`, chartX + chartWidth - 120, chartY + 10, { width: 100, align: 'right' });
    doc.fontSize(13)
       .fillColor(THEME_COLORS.textSecondary)
       .text(`${overview.macros.protein || 0}g`, chartX + 25, chartY + 40);

    yPos += boxHeight + spacing;

    // Carbs card with progress bar
    doc.rect(chartX, yPos, chartWidth, boxHeight)
       .fillAndStroke(THEME_COLORS.cardBackground, '#3b82f6');
    doc.lineWidth(3);
    doc.rect(chartX, yPos, chartWidth, boxHeight)
       .stroke('#3b82f6');
    
    const carbsProgressWidth = (carbsPercent / 100) * (chartWidth - 40);
    doc.rect(chartX + 20, yPos + boxHeight - 12, carbsProgressWidth, 8)
       .fill('#3b82f6');
    
    doc.fontSize(16)
       .fillColor('#3b82f6')
       .text('CARBS', chartX + 25, yPos + 15);
    doc.fontSize(28)
       .fillColor('#3b82f6')
       .text(`${carbsPercent.toFixed(0)}%`, chartX + chartWidth - 120, yPos + 10, { width: 100, align: 'right' });
    doc.fontSize(13)
       .fillColor(THEME_COLORS.textSecondary)
       .text(`${overview.macros.carbs || 0}g`, chartX + 25, yPos + 40);

    yPos += boxHeight + spacing;

    // Fat card with progress bar
    doc.rect(chartX, yPos, chartWidth, boxHeight)
       .fillAndStroke(THEME_COLORS.cardBackground, '#f59e0b');
    doc.lineWidth(3);
    doc.rect(chartX, yPos, chartWidth, boxHeight)
       .stroke('#f59e0b');
    
    const fatProgressWidth = (fatPercent / 100) * (chartWidth - 40);
    doc.rect(chartX + 20, yPos + boxHeight - 12, fatProgressWidth, 8)
       .fill('#f59e0b');
    
    doc.fontSize(16)
       .fillColor('#f59e0b')
       .text('FAT', chartX + 25, yPos + 15);
    doc.fontSize(28)
       .fillColor('#f59e0b')
       .text(`${fatPercent.toFixed(0)}%`, chartX + chartWidth - 120, yPos + 10, { width: 100, align: 'right' });
    doc.fontSize(13)
       .fillColor(THEME_COLORS.textSecondary)
       .text(`${overview.macros.fat || 0}g`, chartX + 25, yPos + 40);

    yPos += boxHeight + 50;
  }

  // Daily Calories Chart Section with modern bar chart
  if (planData.days && Array.isArray(planData.days) && planData.days.length > 0) {
    doc.fontSize(20)
       .fillColor(THEME_COLORS.textPrimary)
       .text('DAILY CALORIES', PAGE_LAYOUT.margin, yPos);
    
    yPos += 10;
    
    // Subtle accent line - reduced opacity to prevent conflicts
    doc.strokeColor(THEME_COLORS.primary);
    doc.lineWidth(1);
    doc.opacity(0.3); // Reduced from 0.5 to prevent visual conflicts
    doc.moveTo(PAGE_LAYOUT.margin, yPos)
       .lineTo(PAGE_LAYOUT.margin + 200, yPos)
       .stroke();
    doc.opacity(1.0);
    
    yPos += 35; // Increased spacing after accent line

    // Calculate daily calories for each day
    const dailyCalories = planData.days.map((day: any, index: number) => {
      if (!day || !day.meals) return { day: index + 1, calories: 0 };
      
      const breakfast = day.meals.breakfast?.nutrition?.calories || 0;
      const lunch = day.meals.lunch?.nutrition?.calories || 0;
      const dinner = day.meals.dinner?.nutrition?.calories || 0;
      const snacks = Array.isArray(day.meals.snacks) 
        ? day.meals.snacks.reduce((sum: number, snack: any) => sum + (snack?.nutrition?.calories || 0), 0)
        : 0;
      
      return {
        day: index + 1,
        calories: breakfast + lunch + dinner + snacks
      };
    });

    // Find max calories for scaling
    const maxCalories = Math.max(...dailyCalories.map(d => d.calories), overview.dailyCalories || 2500);
    const chartHeight = 220;
    const chartPadding = 40;
    const barSpacing = 15;
    const availableWidth = doc.page.width - (PAGE_LAYOUT.margin * 2) - (chartPadding * 2);
    const barWidth = Math.min((availableWidth - (dailyCalories.length - 1) * barSpacing) / dailyCalories.length, 60);
    const chartStartY = yPos + 20;
    const chartEndY = chartStartY + chartHeight;
    const chartX = PAGE_LAYOUT.margin + chartPadding;

    // Draw chart background with border
    doc.rect(PAGE_LAYOUT.margin, chartStartY, doc.page.width - (PAGE_LAYOUT.margin * 2), chartHeight)
       .fillAndStroke(THEME_COLORS.cardBackground, THEME_COLORS.primary);
    doc.lineWidth(2);
    doc.rect(PAGE_LAYOUT.margin, chartStartY, doc.page.width - (PAGE_LAYOUT.margin * 2), chartHeight)
       .stroke(THEME_COLORS.primary);

    // Draw grid lines
    doc.strokeColor(THEME_COLORS.textSecondary);
    doc.lineWidth(0.5);
    doc.opacity(0.2);
    for (let i = 1; i <= 4; i++) {
      const gridY = chartStartY + (chartHeight / 5) * i;
      doc.moveTo(PAGE_LAYOUT.margin + 5, gridY)
         .lineTo(doc.page.width - PAGE_LAYOUT.margin - 5, gridY)
         .stroke();
    }
    doc.opacity(1.0);

    // Draw bars with gradient effect
    let barX = chartX;
    dailyCalories.forEach((dayData: any, index: number) => {
      const barHeight = (dayData.calories / maxCalories) * (chartHeight - 60);
      const barY = chartEndY - barHeight - 30;

      // Draw bar with rounded top effect (using a small rectangle on top)
      doc.rect(barX, barY, barWidth, barHeight)
         .fill('#84cc16');
      
      // Add subtle highlight on top
      doc.opacity(0.3);
      doc.rect(barX, barY, barWidth, Math.min(barHeight * 0.2, 10))
         .fill('#FFFFFF');
      doc.opacity(1.0);

      // Day label
      doc.fontSize(11)
         .fillColor(THEME_COLORS.textPrimary)
         .text(`Day ${dayData.day}`, barX, chartEndY - 20, { width: barWidth, align: 'center' });

      // Calories label on top of bar
      if (barHeight > 25) {
        doc.fontSize(10)
           .fillColor(THEME_COLORS.textPrimary)
           .text(`${dayData.calories}`, barX, barY - 18, { width: barWidth, align: 'center' });
      } else {
        // If bar is too short, show label above
        doc.fontSize(9)
           .fillColor(THEME_COLORS.textSecondary)
           .text(`${dayData.calories}`, barX, barY - 15, { width: barWidth, align: 'center' });
      }

      barX += barWidth + barSpacing;
    });

    // Y-axis label (vertical text)
    doc.save();
    doc.translate(PAGE_LAYOUT.margin + 12, chartStartY + chartHeight / 2);
    doc.rotate(-90, { origin: [0, 0] });
    doc.fontSize(11)
       .fillColor(THEME_COLORS.textSecondary)
       .text('Calories (kcal)', 0, 0, { align: 'center' });
    doc.restore();

    yPos = chartEndY + 40;
  }

  // Footer
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
 * Add cover page (modern, professional design)
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

  let yPos = 100;

  // Elegant brand header with accent line
  doc.strokeColor(THEME_COLORS.primary);
  doc.lineWidth(3);
  doc.moveTo((doc.page.width - 200) / 2, yPos)
     .lineTo((doc.page.width + 200) / 2, yPos)
     .stroke();
  
  yPos += 20;
  
  doc.fontSize(20)
     .fillColor(THEME_COLORS.primary)
     .text('TAILOREDMEALPLAN.COM', 50, yPos, { align: 'center' });
  
  yPos += 50;

  // Modern plan type badge with rounded corners effect (using padding)
  const badgeWidth = 180;
  const badgeHeight = 45;
  const badgeX = (doc.page.width - badgeWidth) / 2;
  
  // Badge background with gradient effect (darker center)
  doc.rect(badgeX, yPos, badgeWidth, badgeHeight)
     .fill(THEME_COLORS.primary);
  
  // Badge text with better spacing
  doc.fontSize(18)
     .fillColor(THEME_COLORS.background)
     .text(`${planTypeLabel.toUpperCase()} PLAN`, badgeX, yPos + 12, {
       width: badgeWidth,
       align: 'center',
     });

  yPos += badgeHeight + 50;

  // Elegant main title with better typography
  doc.fontSize(42)
     .fillColor(THEME_COLORS.textPrimary)
     .text('YOUR PERSONALIZED', 50, yPos, { align: 'center' });
  
  yPos += 50;
  
  doc.fontSize(42)
     .fillColor(THEME_COLORS.primary)
     .text('MEAL PLAN', 50, yPos, { align: 'center' });

  yPos += 60;

  // Generated date with subtle styling
  doc.fontSize(11)
     .fillColor(THEME_COLORS.textSecondary)
     .opacity(0.7)
     .text(`Generated on ${createdDate}`, 50, yPos, { align: 'center' });
  
  doc.opacity(1.0);
  yPos += 50;

  // Overview section with modern card design
  if (planData.overview && typeof planData.overview === 'object') {
    const { overview } = planData;

    // Section header with accent
    doc.fontSize(20)
       .fillColor(THEME_COLORS.textPrimary)
       .text('NUTRITION OVERVIEW', PAGE_LAYOUT.margin, yPos, { align: 'center' });

    yPos += 15;
    
    // Accent line under header
    doc.strokeColor(THEME_COLORS.primary);
    doc.lineWidth(1);
    doc.moveTo((doc.page.width - 250) / 2, yPos)
       .lineTo((doc.page.width + 250) / 2, yPos)
       .stroke();

    yPos += 40;

    // Modern stats cards with better spacing and design
    const boxWidth = 120;
    const boxHeight = 100;
    const spacing = 20;
    const totalWidth = (boxWidth * 4) + (spacing * 3);
    let xPos = (doc.page.width - totalWidth) / 2;

    // Daily Calories - featured card
    doc.rect(xPos, yPos, boxWidth, boxHeight)
       .fillAndStroke(THEME_COLORS.cardBackground, THEME_COLORS.primary);
    doc.lineWidth(2);
    doc.rect(xPos, yPos, boxWidth, boxHeight)
       .stroke(THEME_COLORS.primary);
    
    doc.fontSize(10)
       .fillColor(THEME_COLORS.textSecondary)
       .text('Daily Calories', xPos + 10, yPos + 15, { width: boxWidth - 20, align: 'center' });
    doc.fontSize(32)
       .fillColor(THEME_COLORS.primary)
       .text(String(overview.dailyCalories || 'N/A'), xPos + 10, yPos + 35, {
         width: boxWidth - 20,
         align: 'center',
       });
    doc.fontSize(9)
       .fillColor(THEME_COLORS.textSecondary)
       .opacity(0.8)
       .text('kcal', xPos + 10, yPos + 75, { width: boxWidth - 20, align: 'center' });
    doc.opacity(1.0);

    xPos += boxWidth + spacing;

    // Protein
    if (overview.macros?.protein) {
      doc.rect(xPos, yPos, boxWidth, boxHeight)
         .fillAndStroke(THEME_COLORS.cardBackground, '#84cc16');
      doc.lineWidth(2);
      doc.rect(xPos, yPos, boxWidth, boxHeight)
         .stroke('#84cc16');
      
      doc.fontSize(10)
         .fillColor(THEME_COLORS.textSecondary)
         .text('Protein', xPos + 10, yPos + 15, { width: boxWidth - 20, align: 'center' });
      doc.fontSize(32)
         .fillColor('#84cc16')
         .text(`${overview.macros.protein}g`, xPos + 10, yPos + 35, {
           width: boxWidth - 20,
           align: 'center',
         });
      xPos += boxWidth + spacing;
    }

    // Carbs
    if (overview.macros?.carbs) {
      doc.rect(xPos, yPos, boxWidth, boxHeight)
         .fillAndStroke(THEME_COLORS.cardBackground, '#3b82f6');
      doc.lineWidth(2);
      doc.rect(xPos, yPos, boxWidth, boxHeight)
         .stroke('#3b82f6');
      
      doc.fontSize(10)
         .fillColor(THEME_COLORS.textSecondary)
         .text('Carbs', xPos + 10, yPos + 15, { width: boxWidth - 20, align: 'center' });
      doc.fontSize(32)
         .fillColor('#3b82f6')
         .text(`${overview.macros.carbs}g`, xPos + 10, yPos + 35, {
           width: boxWidth - 20,
           align: 'center',
         });
      xPos += boxWidth + spacing;
    }

    // Fat
    if (overview.macros?.fat) {
      doc.rect(xPos, yPos, boxWidth, boxHeight)
         .fillAndStroke(THEME_COLORS.cardBackground, '#f59e0b');
      doc.lineWidth(2);
      doc.rect(xPos, yPos, boxWidth, boxHeight)
         .stroke('#f59e0b');
      
      doc.fontSize(10)
         .fillColor(THEME_COLORS.textSecondary)
         .text('Fat', xPos + 10, yPos + 15, { width: boxWidth - 20, align: 'center' });
      doc.fontSize(32)
         .fillColor('#f59e0b')
         .text(`${overview.macros.fat}g`, xPos + 10, yPos + 35, {
           width: boxWidth - 20,
           align: 'center',
         });
    }

    if (overview.duration) {
      yPos += boxHeight + 40;
      doc.fontSize(11)
         .fillColor(THEME_COLORS.textSecondary)
         .opacity(0.8)
         .text(
           `Plan Duration: ${overview.duration} ${overview.duration === 1 ? 'day' : 'days'}`,
           50,
           yPos,
           { align: 'center' }
         );
      doc.opacity(1.0);
    }
  }

  // Elegant footer
  const footerY = doc.page.height - PAGE_LAYOUT.bottomMargin;
  doc.strokeColor(THEME_COLORS.primary);
  doc.lineWidth(1);
  doc.opacity(0.3);
  doc.moveTo(PAGE_LAYOUT.margin, footerY - 20)
     .lineTo(doc.page.width - PAGE_LAYOUT.margin, footerY - 20)
     .stroke();
  doc.opacity(1.0);
  
  doc.fontSize(10)
     .fillColor(THEME_COLORS.textSecondary)
     .text(
       'TailoredMealPlan.com',
       PAGE_LAYOUT.margin,
       footerY - 5,
       { align: 'center', width: doc.page.width - (PAGE_LAYOUT.margin * 2) }
     );
  doc.fontSize(8)
     .fillColor(THEME_COLORS.textSecondary)
     .opacity(0.7)
     .text(
       'Personalized Nutrition Plans',
       PAGE_LAYOUT.margin,
       footerY + 8,
       { align: 'center', width: doc.page.width - (PAGE_LAYOUT.margin * 2) }
     );
  doc.opacity(1.0);
}

/**
 * Add daily plan (modern, professional design)
 */
function addDayPlan(doc: any, day: any, dayNumber: number, isFreeTier: boolean = false) {
  const meals = day.meals || {};
  let yPos = PAGE_LAYOUT.topMargin + 10;

  // Modern day header with badge effect
  const dayHeaderWidth = 120;
  const dayHeaderHeight = 40;
  const dayHeaderX = PAGE_LAYOUT.margin;
  
  // Badge background
  doc.rect(dayHeaderX, yPos, dayHeaderWidth, dayHeaderHeight)
     .fill(THEME_COLORS.primary);
  
  doc.fontSize(24)
     .fillColor(THEME_COLORS.background)
     .text(`DAY ${dayNumber}`, dayHeaderX, yPos + 8, {
       width: dayHeaderWidth,
       align: 'center',
     });
  
  yPos += dayHeaderHeight + 30;
  
  // Check page break before divider
  yPos = checkPageBreak(doc, 50, yPos, isFreeTier);
  
  // Elegant divider with accent - ensure it doesn't conflict with content
  doc.strokeColor(THEME_COLORS.primary);
  doc.lineWidth(2); // Reduced from 3 to prevent visual conflict
  doc.moveTo(PAGE_LAYOUT.margin, yPos)
     .lineTo(doc.page.width - PAGE_LAYOUT.margin, yPos)
     .stroke();
  
  yPos += 40; // Increased spacing after divider

  // Breakfast
  if (meals.breakfast) {
    yPos = addMeal(doc, meals.breakfast, 'Breakfast', yPos, isFreeTier);
    yPos += PAGE_LAYOUT.mealSpacing + 10; // Extra spacing between meals
  }

  // Lunch
  if (meals.lunch) {
    yPos = addMeal(doc, meals.lunch, 'Lunch', yPos, isFreeTier);
    yPos += PAGE_LAYOUT.mealSpacing + 10; // Extra spacing between meals
  }

  // Dinner
  if (meals.dinner) {
    yPos = addMeal(doc, meals.dinner, 'Dinner', yPos, isFreeTier);
    yPos += PAGE_LAYOUT.mealSpacing + 10; // Extra spacing between meals
  }

  // Snacks section with modern design
  if (meals.snacks && Array.isArray(meals.snacks) && meals.snacks.length > 0) {
    // Check if we have space for snacks section
    yPos = checkPageBreak(doc, 100, yPos, isFreeTier);
    
    // Modern snacks header with badge
    const snackBadgeWidth = 100;
    const snackBadgeHeight = 30;
    doc.rect(PAGE_LAYOUT.margin, yPos, snackBadgeWidth, snackBadgeHeight)
       .fill(THEME_COLORS.primary);
    doc.fontSize(14)
       .fillColor(THEME_COLORS.background)
       .text('SNACKS', PAGE_LAYOUT.margin, yPos + 7, {
         width: snackBadgeWidth,
         align: 'center',
       });
    yPos += snackBadgeHeight + 20;

    meals.snacks.forEach((snack: any) => {
      // Check page break before each snack
      yPos = checkPageBreak(doc, 70, yPos, isFreeTier);
      
      // Modern snack card with accent
      const snackCardHeight = 55;
      const snackCardX = PAGE_LAYOUT.margin;
      const snackCardWidth = doc.page.width - (PAGE_LAYOUT.margin * 2);
      
      doc.rect(snackCardX, yPos, snackCardWidth, snackCardHeight)
         .fillAndStroke(THEME_COLORS.cardBackground, THEME_COLORS.primary);
      doc.lineWidth(2);
      doc.rect(snackCardX, yPos, snackCardWidth, snackCardHeight)
         .stroke(THEME_COLORS.primary);
      
      // Accent bar
      doc.rect(snackCardX, yPos, 4, snackCardHeight)
         .fill(THEME_COLORS.primary);
      
      const snackName = sanitizeText(snack?.name || 'Snack');
      const snackNameWidth = snackCardWidth - (PAGE_LAYOUT.cardPadding * 2) - 20;
      const snackNameHeight = getTextHeight(doc, snackName, snackNameWidth, 15, 3);
      
      doc.fontSize(15)
         .fillColor(THEME_COLORS.textPrimary)
         .text(snackName, snackCardX + PAGE_LAYOUT.cardPadding + 10, yPos + 12, {
           width: snackNameWidth,
           ellipsis: true,
         });
      
      if (snack?.nutrition?.calories) {
        doc.fontSize(12)
           .fillColor(THEME_COLORS.primary)
           .text(`${snack.nutrition.calories} kcal`, snackCardX + PAGE_LAYOUT.cardPadding + 10, yPos + 12 + Math.max(snackNameHeight, 20) + 5);
      }
      
      yPos += snackCardHeight + 20; // Extra spacing between snack cards
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

  // Modern meal type label with badge
  const mealBadgeWidth = 100;
  const mealBadgeHeight = 28;
  doc.rect(cardX, currentY, mealBadgeWidth, mealBadgeHeight)
     .fill(THEME_COLORS.primary);
  doc.fontSize(13)
     .fillColor(THEME_COLORS.background)
     .text(mealType.toUpperCase(), cardX, currentY + 6, {
       width: mealBadgeWidth,
       align: 'center',
     });
  currentY += mealBadgeHeight + 20;

  // Meal card background start position
  const cardStartY = currentY;

  // Meal name - sanitize and validate
  const mealName = sanitizeText(meal.name || 'N/A');
  if (mealName && mealName.length > 0) {
    // Calculate actual text height to prevent overlap
    const mealNameWidth = cardWidth - (cardPadding * 2);
    const mealNameHeight = getTextHeight(doc, mealName, mealNameWidth, 18, 4);
    
    doc.fontSize(18)
       .fillColor(THEME_COLORS.textPrimary)
       .text(mealName, cardX + cardPadding, currentY, {
         width: mealNameWidth,
         ellipsis: true,
       });
    currentY += Math.max(mealNameHeight, 25) + 5; // Add extra spacing
  } else {
    currentY += 10;
  }

  // Modern nutrition info box with better design
  if (meal.nutrition && typeof meal.nutrition === 'object') {
    const nutrition = meal.nutrition;
    const nutritionBoxHeight = 45;
    
    // Check page break before nutrition box
    currentY = checkPageBreak(doc, nutritionBoxHeight + 30, currentY, isFreeTier);
    const nutritionBoxY = currentY;
    
    // Nutrition box with accent border
    doc.rect(cardX + cardPadding, nutritionBoxY, cardWidth - (cardPadding * 2), nutritionBoxHeight)
       .fillAndStroke(THEME_COLORS.cardBackground, THEME_COLORS.primary);
    doc.lineWidth(2);
    doc.rect(cardX + cardPadding, nutritionBoxY, cardWidth - (cardPadding * 2), nutritionBoxHeight)
       .stroke(THEME_COLORS.primary);
    
    const nutritionParts = [
      nutrition.calories ? `${nutrition.calories} kcal` : null,
      nutrition.protein ? `P: ${nutrition.protein}g` : null,
      nutrition.carbs ? `C: ${nutrition.carbs}g` : null,
      nutrition.fat ? `F: ${nutrition.fat}g` : null,
    ].filter(Boolean);
    
    if (nutritionParts.length > 0) {
      const nutritionText = nutritionParts.join(' • ');
      doc.fontSize(13)
         .fillColor(THEME_COLORS.primary)
         .text(nutritionText, cardX + cardPadding + 10, nutritionBoxY + 14, {
           width: cardWidth - (cardPadding * 2) - 20,
         });
    }
    
    currentY = nutritionBoxY + nutritionBoxHeight + 25;
  } else {
    currentY += 10;
  }

  // Ingredients section with modern styling
  if (meal.ingredients && Array.isArray(meal.ingredients) && meal.ingredients.length > 0) {
    // Check page break before ingredients
    const ingredientsHeight = 25 + (meal.ingredients.length * 18);
    currentY = checkPageBreak(doc, ingredientsHeight, currentY, isFreeTier);
    
    doc.fontSize(13)
       .fillColor(THEME_COLORS.primary)
       .text('INGREDIENTS:', cardX + cardPadding, currentY);
    currentY += 20;

    meal.ingredients.forEach((ingredient: any) => {
      const sanitizedIngredient = sanitizeText(ingredient);
      if (sanitizedIngredient && sanitizedIngredient.length > 0) {
        // Check if we need page break for this ingredient
        currentY = checkPageBreak(doc, 25, currentY, isFreeTier);
        
        // Modern bullet point with accent color
        doc.circle(cardX + cardPadding + 5, currentY + 4, 3)
           .fill(THEME_COLORS.primary);
        
        const ingredientWidth = cardWidth - (cardPadding * 2) - 25;
        const ingredientHeight = getTextHeight(doc, sanitizedIngredient, ingredientWidth, 11, 3);
        
        doc.fontSize(11)
           .fillColor(THEME_COLORS.textPrimary)
           .text(sanitizedIngredient, cardX + cardPadding + 15, currentY, {
             width: ingredientWidth,
             ellipsis: true,
           });
        currentY += Math.max(ingredientHeight, 18) + 2; // Ensure minimum spacing
      }
    });
    currentY += 18; // Extra spacing after ingredients
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
      
      // Estimate instructions height more accurately
      const textWidth = cardWidth - (cardPadding * 2) - 20;
      const estimatedInstructionsHeight = Math.min(
        getTextHeight(doc, instructionsText, textWidth, 11, 5) + 50, // Add buffer for header
        400 // Cap at reasonable height
      );
      
      // Check page break before instructions
      currentY = checkPageBreak(doc, estimatedInstructionsHeight, currentY, isFreeTier);
      
      doc.fontSize(13)
         .fillColor(THEME_COLORS.primary)
         .text('INSTRUCTIONS:', cardX + cardPadding, currentY);
      currentY += 20;

      doc.fontSize(11)
         .fillColor(THEME_COLORS.textPrimary)
         .text(instructionsText, cardX + cardPadding + 10, currentY, {
           width: textWidth,
           lineGap: 5,
           ellipsis: true,
         });
      
      // Calculate actual height to prevent overlap
      const actualHeight = getTextHeight(doc, instructionsText, textWidth, 11, 5);
      currentY += actualHeight + 20; // Add extra spacing after instructions
    }
  }

  // Draw modern meal card border with accent
  const cardHeight = currentY - cardStartY + 20;
  if (cardHeight > 0) {
    doc.lineWidth(2);
    doc.rect(cardX, cardStartY - 10, cardWidth, cardHeight)
       .stroke(THEME_COLORS.primary);
    
    // Accent line on left side
    doc.rect(cardX, cardStartY - 10, 4, cardHeight)
       .fill(THEME_COLORS.primary);
  }

  return currentY + 15; // Extra spacing after meal card
}

/**
 * Add grocery list (modern, professional design)
 */
function addGroceryList(doc: any, groceryList: any, isFreeTier: boolean = false) {
  if (!groceryList || typeof groceryList !== 'object') {
    return; // Skip invalid grocery lists
  }

  let yPos = PAGE_LAYOUT.topMargin + 10;

  // Modern header with badge effect
  const headerWidth = 180;
  const headerHeight = 45;
  const headerX = (doc.page.width - headerWidth) / 2;
  
  doc.rect(headerX, yPos, headerWidth, headerHeight)
     .fill(THEME_COLORS.primary);
  
  doc.fontSize(26)
     .fillColor(THEME_COLORS.background)
     .text('GROCERY LIST', headerX, yPos + 10, {
       width: headerWidth,
       align: 'center',
     });
  
  yPos += headerHeight + 40;
  
  // Elegant divider
  doc.strokeColor(THEME_COLORS.primary);
  doc.lineWidth(3);
  doc.moveTo(PAGE_LAYOUT.margin, yPos)
     .lineTo(doc.page.width - PAGE_LAYOUT.margin, yPos)
     .stroke();
  
  yPos += 35;

  Object.entries(groceryList).forEach(([category, items]) => {
    if (!Array.isArray(items) || items.length === 0) return;

    // Check page break before category
    const categoryHeight = 40 + (items.length * 20) + 25;
    yPos = checkPageBreak(doc, categoryHeight, yPos, isFreeTier);

    // Modern category header with accent
    const categoryHeaderHeight = 40;
    const categoryX = PAGE_LAYOUT.margin;
    const categoryWidth = doc.page.width - (PAGE_LAYOUT.margin * 2);
    
    doc.rect(categoryX, yPos, categoryWidth, categoryHeaderHeight)
       .fillAndStroke(THEME_COLORS.cardBackground, THEME_COLORS.primary);
    doc.lineWidth(2);
    doc.rect(categoryX, yPos, categoryWidth, categoryHeaderHeight)
       .stroke(THEME_COLORS.primary);
    
    // Accent bar on left
    doc.rect(categoryX, yPos, 5, categoryHeaderHeight)
       .fill(THEME_COLORS.primary);
    
    const categoryName = sanitizeText(category);
    doc.fontSize(17)
       .fillColor(THEME_COLORS.primary)
       .text(categoryName.charAt(0).toUpperCase() + categoryName.slice(1).toUpperCase(), 
             categoryX + 20, yPos + 12);
    
    yPos += categoryHeaderHeight + 18;

    // Items list with modern bullets
    items.forEach((item: any) => {
      // Check page break before each item
      yPos = checkPageBreak(doc, 25, yPos, isFreeTier);
      
      const sanitizedItem = sanitizeText(item);
      if (sanitizedItem && sanitizedItem.length > 0) {
        // Modern bullet point
        doc.circle(PAGE_LAYOUT.margin + PAGE_LAYOUT.cardPadding + 5, yPos + 4, 3)
           .fill(THEME_COLORS.primary);
        
        const itemWidth = doc.page.width - (PAGE_LAYOUT.margin * 2) - (PAGE_LAYOUT.cardPadding * 2) - 20;
        const itemHeight = getTextHeight(doc, sanitizedItem, itemWidth, 12, 3);
        
        doc.fontSize(12)
           .fillColor(THEME_COLORS.textPrimary)
           .text(sanitizedItem, PAGE_LAYOUT.margin + PAGE_LAYOUT.cardPadding + 15, yPos, {
             width: itemWidth,
             ellipsis: true,
           });
        yPos += Math.max(itemHeight, 20) + 3; // Ensure minimum spacing between items
      }
    });

    yPos += 20;
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



