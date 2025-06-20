const fs = require('fs');
const path = require('path');

const entitiesPath = path.join(__dirname, '../data/generated_entities.json');

if (!fs.existsSync(entitiesPath)) {
  console.error('generated_entities.jsonが存在しません');
  process.exit(1);
}

const entities = JSON.parse(fs.readFileSync(entitiesPath, 'utf8'));
console.log('=== 読み込んだ個体データ ===');
entities.forEach(e => {
  console.log(`ID: ${e.entity_id}, 名前: ${e.name}, 性別: ${e.gender}, モデル: ${e.model}`);
}); 