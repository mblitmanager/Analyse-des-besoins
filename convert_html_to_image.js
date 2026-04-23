const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function convertHtmlToImage() {
  const htmlPath = path.join(__dirname, 'prevention.html');
  const outputPath = path.join(__dirname, 'prevention.png');
  
  const fileUrl = `file://${htmlPath.replace(/\\/g, '/')}`;
  
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Set viewport to match email width
  await page.setViewportSize({ width: 640, height: 1200 });
  
  try {
    await page.goto(fileUrl, { waitUntil: 'networkidle' });
    
    // Get the full page height
    const bodyHandle = await page.$('body');
    const boundingBox = await bodyHandle.boundingBox();
    const height = boundingBox.height;
    
    // Set viewport to full content height
    await page.setViewportSize({ width: 640, height: Math.ceil(height) });
    
    // Take screenshot
    await page.screenshot({ 
      path: outputPath, 
      fullPage: true 
    });
    
    console.log(`✓ Image créée avec succès: ${outputPath}`);
    console.log(`  Dimensions: 640x${Math.ceil(height)}px`);
  } catch (error) {
    console.error('Erreur lors de la conversion:', error);
  } finally {
    await browser.close();
  }
}

convertHtmlToImage();
