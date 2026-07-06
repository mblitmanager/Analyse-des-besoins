const mammoth = require('mammoth');
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../../Modifs TOEIC - Juin 2026.docx');

mammoth.extractRawText({ path: filePath })
  .then(result => {
    console.log(result.value);
  })
  .catch(err => {
    console.error('Error reading Word document:', err);
  });
