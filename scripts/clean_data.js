const fs = require('fs');
const path = require('path');

const srcFiles = {
  'breeding.json': '/home/ibukichi/.gemini/antigravity-ide/brain/659d66b4-a66e-40c6-a2b2-a494174b4c9b/.system_generated/steps/23/content.md',
  'pals.json': '/home/ibukichi/.gemini/antigravity-ide/brain/659d66b4-a66e-40c6-a2b2-a494174b4c9b/.system_generated/steps/27/content.md',
  'db.json': '/home/ibukichi/.gemini/antigravity-ide/brain/659d66b4-a66e-40c6-a2b2-a494174b4c9b/.system_generated/steps/47/content.md'
};

const destDir = path.join(__dirname, '../src/data');
if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

Object.entries(srcFiles).forEach(([name, srcPath]) => {
  if (!fs.existsSync(srcPath)) {
    console.error(`Source file does not exist: ${srcPath}`);
    return;
  }
  const content = fs.readFileSync(srcPath, 'utf8');
  // Find where the JSON starts. In the step outputs, the JSON follows "---"
  const parts = content.split('---');
  if (parts.length < 2) {
    console.error(`Could not find separator in ${srcPath}`);
    return;
  }
  let jsonText = parts.slice(1).join('---').trim();
  // Ensure it is valid JSON
  try {
    JSON.parse(jsonText);
    fs.writeFileSync(path.join(destDir, name), jsonText, 'utf8');
    console.log(`Cleaned and wrote ${name} successfully.`);
  } catch (e) {
    console.error(`Invalid JSON in ${name}:`, e.message);
  }
});
