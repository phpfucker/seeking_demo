/**
 * initial_adam_eve.json を generated_entities.json に上書きコピーし、
 * AI生命体データを初期状態（アダムとイヴのみ）にリセットするスクリプト。
 *
 * 実行方法: node reset_entities.js
 *
 * 役割:
 * - テストやデバッグ時に、個体データをいつでも初期状態に戻せる
 * - initial_adam_eve.json の内容が generated_entities.json に反映される
 */

const fs = require('fs');
const path = require('path');

// コピー元（初期個体データ）
const src = path.join(__dirname, '../config/initial_adam_eve.json');
// コピー先（現在の個体データ）
const dest = path.join(__dirname, '../config/generated_entities.json');

// ファイル存在チェック
if (!fs.existsSync(src)) {
  console.error('初期個体データファイルが存在しません:', src);
  process.exit(1);
}

// 上書きコピー
fs.copyFileSync(src, dest);
console.log('generated_entities.json を初期状態（adam/eveのみ）にリセットしました。'); 