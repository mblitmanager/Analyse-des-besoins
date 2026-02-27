const fs = require('fs');
const path = require('path');

const parsedTestsDir = path.resolve(__dirname, '..', 'parsed_tests');
const files = fs.readdirSync(parsedTestsDir);

function parseMarkdownTest(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  
  const levels = [];
  let currentLevel = null;
  let currentQuestion = null;
  let levelOrder = 1;
  let qOrder = 1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const upperLine = line.toUpperCase();
    if (upperLine === 'INITIAL' || upperLine === 'BASIQUE' || upperLine === 'OPÉRATIONNEL' || upperLine === 'AVANCE' || upperLine === 'EXPERT') {
      currentLevel = {
        label: upperLine === 'AVANCE' ? 'Avancé' : upperLine === 'OPÉRATIONNEL' ? 'Opérationnel' : upperLine === 'INITIAL' ? 'Initial' : upperLine === 'BASIQUE' ? 'Basique' : 'Expert',
        order: levelOrder++,
        successThreshold: 80,
        questions: []
      };
      
      // Map naming convention
      if (currentLevel.label === 'Initial') currentLevel.label = 'Débutant';
      if (currentLevel.label === 'Basique') currentLevel.label = 'Basique'; // Or Intermédiaire? Word/Excel used Débutant, Intermédiaire, Avancé, Expert.
      if (currentLevel.label === 'Opérationnel') currentLevel.label = 'Intermédiaire';
      if (currentLevel.label === 'Avancé') currentLevel.label = 'Avancé';
      if (currentLevel.label === 'Expert') currentLevel.label = 'Expert';

      levels.push(currentLevel);
      qOrder = 1;
      continue;
    }

    if (line.match(/^1\.\s+/) || line.match(/^[0-9]+\.\s+/)) {
      if (currentLevel) {
        currentQuestion = {
          text: line.replace(/^[0-9]+\.\s+/, '').replace(/:$/, '').replace(/  .*$/, '').trim(),
          options: [],
          correctResponseIndex: -1,
          order: qOrder++
        };
        currentLevel.questions.push(currentQuestion);
      }
      continue;
    }

    if (line.match(/^- [A-Z]\\?\./) || line.match(/^[A-Z]\./)) {
      if (currentQuestion) {
        let optText = line.replace(/^- [A-Z]\\?\.\s*/, '').replace(/^[A-Z]\.\s+/, '').trim();
        let isCorrect = false;
        
        if (optText.includes('✅') || optText.includes('✔️') || line.includes('__') || line.includes('**')) {
            isCorrect = true;
        }

        optText = optText.replace(/✅/g, '').replace(/✔️/g, '').replace(/__/g, '').replace(/\*\*/g, '').trim();

        currentQuestion.options.push(optText);
        if (isCorrect) {
          currentQuestion.correctResponseIndex = currentQuestion.options.length - 1;
        }
      }
    }
  }

  return levels;
}

const allData = {};
for (const file of files) {
    if (file.endsWith('.md')) {
        allData[file] = parseMarkdownTest(path.join(parsedTestsDir, file));
        console.log(`\nParsed ${file}:`);
        allData[file].forEach(l => {
            console.log(` Level: ${l.label} (${l.questions.length} questions)`);
            if(l.questions.length > 0) {
              console.log(`   Q: ${l.questions[0].text}`);
              console.log(`   A: ${l.questions[0].options[l.questions[0].correctResponseIndex]}`);
            }
        });
    }
}
