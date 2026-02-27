const mammoth = require("mammoth");
const fs = require("fs");
const path = require("path");

const sourceDir = path.resolve(__dirname, "..", "listes des tests");
const targetDir = path.resolve(__dirname, "..", "parsed_tests");

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir);
}

const files = fs.readdirSync(sourceDir).filter(f => f.endsWith(".docx"));

async function processAll() {
  for (const file of files) {
    const docxPath = path.join(sourceDir, file);
    const mdPath = path.join(targetDir, file.replace(".docx", ".md"));
    try {
      const result = await mammoth.convertToMarkdown({ path: docxPath });
      fs.writeFileSync(mdPath, result.value);
      console.log(`Converted ${file} to Markdown`);
    } catch (err) {
      console.error(`Error converting ${file}:`, err);
    }
  }
}

processAll();
