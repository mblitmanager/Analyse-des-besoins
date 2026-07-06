const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join(__dirname, '../../nouveau p1,p2 et p3.xlsx');

try {
  const workbook = XLSX.readFile(filePath);
  console.log('Sheet names:', workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const sheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    // Show only first 50 non-empty rows
    const nonEmptyData = data.filter(row => row.some(cell => cell !== undefined && cell !== null && cell !== ''));
    console.log(JSON.stringify(nonEmptyData.slice(0, 50), null, 2));
  });
} catch (error) {
  console.error('Error reading Excel file:', error);
}
