/**
 * initial_adam_eve.jsonを読み込み、
 * adamとeveの2体の個体データJSONをgenerated_entities.jsonに出力するスクリプト。
 * 
 * 実行方法: node generate_entities.js
 * 出力: /opt/minecraft_forge_server/config/generated_entities.json
 */

const fs = require('fs');
const path = require('path');

const INPUT_PATH = path.join(__dirname, '../config/initial_adam_eve.json');
const OUTPUT_PATH = '/opt/minecraft_forge_server/config/generated_entities.json';

/**
 * adam/eve個体データ（性別付き）を外部ファイルから読み込み、ファイルに出力する
 */
function generateAdamEveFromFile() {
  if (!fs.existsSync(INPUT_PATH)) {
    throw new Error(`初期個体データファイルが見つかりません: ${INPUT_PATH}`);
  }
  const entities = JSON.parse(fs.readFileSync(INPUT_PATH, 'utf8'));
  if (!Array.isArray(entities) || entities.length !== 2) {
    throw new Error('初期個体データは2体（adam/eve）の配列である必要があります');
  }
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(entities, null, 2), 'utf8');
  console.log(`Loaded adam and eve from ${INPUT_PATH} and wrote to ${OUTPUT_PATH}`);
}

generateAdamEveFromFile(); 