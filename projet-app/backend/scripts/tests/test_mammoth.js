const mammoth = require("mammoth");
const path = require("path");

const docxPath = path.resolve(
  __dirname,
  "..",
  "listes des tests",
  "Google Docs - Test AB.docx"
);

mammoth
  .convertToMarkdown({ path: docxPath })
  .then(function (result) {
    const text = result.value;
    console.log("Extracted Markdown:\n", text.substring(0, 1500));
  })
  .catch(function (err) {
    console.error("Error reading docx:", err);
  });
