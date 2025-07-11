const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '0405 - KMA Boys Secodnary School- Rubric Scores Sheet - 2024-25 MSP.xlsx');

try {
  console.log('Analyzing Excel file:', filePath);
  
  const workbook = XLSX.readFile(filePath);
  console.log('Sheet names:', workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const sheet = workbook.Sheets[sheetName];
    
    // Get range
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1:A1');
    console.log('Range:', sheet['!ref']);
    
    // Check A1 cell specifically
    const a1Cell = sheet['A1'];
    console.log('A1 cell:', a1Cell);
    if (a1Cell) {
      console.log('A1 properties:', Object.keys(a1Cell));
      console.log('A1 value (.v):', a1Cell.v);
      console.log('A1 formatted (.w):', a1Cell.w);
      console.log('A1 type (.t):', a1Cell.t);
    }
    
    // Get first few rows to understand structure
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
    console.log('First 5 rows:');
    jsonData.slice(0, 5).forEach((row, index) => {
      console.log(`Row ${index}:`, row);
    });
    
    // Get headers for analysis
    if (jsonData.length > 0) {
      console.log('\nHeaders analysis:');
      const headers = jsonData[0];
      headers.forEach((header, index) => {
        const cleaned = header ? header.toString().toLowerCase().replace(/[^a-z]/g, "") : "";
        console.log(`Column ${index}: "${header}" -> cleaned: "${cleaned}"`);
      });
    }
  });
  
} catch (error) {
  console.error('Error analyzing file:', error);
}
