import fs from 'fs';

const envContent = fs.readFileSync('.env', 'utf-8');
const match = envContent.match(/VITE_GEMINI_API_KEY=(.*)/);
const apiKey = match ? match[1].trim() : '';

if (!apiKey) {
  console.log('No API key found');
  process.exit(1);
}

async function listModels() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await res.json();
    console.log(data.models.filter(m => m.name.includes('gemini') && m.supportedGenerationMethods.includes('generateContent')).map(m => m.name));
  } catch (e) {
    console.error(e);
  }
}

listModels();
