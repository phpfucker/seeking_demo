# seek-in（飼育員）プロジェクト 仕様書

## 1. プロジェクト概要

- **テーマ**：
    
    「膝と膝」をキーワードに、2体の膝形生命体が自発的に進化し、相互に影響を与えながら変化していく様子を観察するWebアプリケーション。
    
- **特徴**：
    - AIを用いて生命体の進化状態（細胞のパラメータ）と、進化の理由や生命体の内面（レポート）を生成
    - ユーザーは介入せず、ただ進化の様子と各進化段階における「レポート」を時系列で観察できる
- **狙い**：
    
    視覚的変化だけでなく、「なぜこうなったのか」「今何を感じているか」といった物語的要素も加えることで、知的エンターテイメントとしての側面を提供する
    

---

## 2. システム構成・技術スタック

| 構成要素 | 技術/ツール例 | 備考 |
| --- | --- | --- |
| フロントエンド | HTML5, CSS3, JavaScript (ES6+), Canvas / SVG | GitHub Pagesで静的ホスティング |
| 描画 | Canvas API または SVG | 軽量かつリアルタイムなアニメーション |
| AI進化生成 | OpenAI GPT系 API（または他の小型Transformerモデル） | AWS Lambda からAPI呼び出し（サーバーレス） |
| バックエンド/更新 | AWS Lambda + GitHub Actions | 定期実行、静的ファイル更新 |
| データ形式 | JSON | 各生命体のセル状態、進化レポート共にJSONで管理 |
| CI/CD | GitHub Actions | 静的ファイルの自動更新に利用 |
| 拡張オプション | Web Audio API, WebGL/Three.js | 将来的なアニメーション・音響演出の拡張 |

---

## 3. 機能仕様

### 3-1. 生命体の進化データ構造

各生命体（entityA, entityB）は、「細胞（セル）」の集合体として表現され、そのパラメータは以下の通り：

- **セルパラメータ例**
    - `x`, `y`: 画面上の位置（ピクセル単位）
    - `radius`: セルの大きさ（px）
    - `color_h`: 色相（0〜360の整数、HSL色空間の色相）
    - `shapeFactor`: 形の変化・楕円の度合い（0〜1の小数）

### 3-2. AIによる進化生成

- **進化ロジック**
    - 現在の進化状態と、これまでの進化履歴（過去のパラメータ変化）をもとに、次世代の進化状態をAIに生成させる
    - AIは、細胞の分裂、変異、パラメータ調整（位置、サイズ、色、形状）に加え、2体間の相互影響ルールも盛り込む
- **進化データの応答例（JSON形式）**

```json
{
  "entityA": {
    "cells": [
      {"x":100, "y":120, "radius":10, "color_h":210, "shapeFactor":0.4},
      {"x":110, "y":130, "radius":9,  "color_h":215, "shapeFactor":0.5}
    ],
    "report": {
      "appearance": "背中のような膝が左右に分裂し、中央に光る器官を持つようになった。",
      "reason": "entityBの波動に呼応し、防御的な進化が促進されたため。",
      "thought": "『私はまだ知らない自分の役割を探している。』"
    }
  },
  "entityB": {
    "cells": [
      {"x":130, "y":140, "radius":9, "color_h":190, "shapeFactor":0.5},
      {"x":140, "y":150, "radius":8, "color_h":195, "shapeFactor":0.3}
    ],
    "report": {
      "appearance": "体表の色が青から赤に変わり、細胞密度が増加している。",
      "reason": "entityAからの刺激により攻撃的な進化が進んだため。",
      "thought": "『私こそが先に完成へと進むべき存在だが、完成とは何か？』"
    }
  }
}
```

### 3-3. レポート表示

- 各進化ステップごとに、以下の内容を記録し一覧表示する：
    1. **現在の姿**（生命体の描画サムネイルまたは説明）
    2. **進化要因**（なぜその進化に至ったのかの説明）
    3. **今考えていること**（内面、感情、思考の記述）
- 表示例：各進化ステップのカード形式（タイムスタンプ付き）
- レポートはJSONまたはMarkdownファイルとしてGitHubリポジトリに保存し、静的ページで読み出して表示

---

## 4. フロントエンド描画・インタラクション

- **描画方法**：
    - HTML5 Canvas または SVG を用いて、各生命体のセルを楕円として描画
    - 描画は、各セルの `x, y, radius, shapeFactor, color_h` に基づく
- **更新動作**：
    - ページ読み込み時に最新の進化データ（JSON）を取得して描画
    - 定期的なAI進化データの更新に伴い、描画もリフレッシュ
    - 動きは、細胞の位置や形の変化として実装（ユーザー操作は不要）
- **レポート表示**：
    - 進化レポートは一覧（またはタイムライン）形式で表示し、各進化ステップの詳細（Appearance / Reason / Thought）を参照できる

---

## 5. 運用と自動更新フロー

1. **初期状態の生成**：
    
    初期の膝形生命体データを静的JSONとしてGitHub Pagesに配置
    
2. **AI進化更新**：
    
    定期（例：1時間ごと）にAWS Lambda（またはGitHub Actions経由）で現在状態をAIに送信し、新しい進化状態を取得
    
    - 取得したデータは JSON ファイルとしてリポジトリにコミットし、GitHub Pages に反映
3. **ユーザー閲覧**：
    
    ユーザーは静的なWebページ（GitHub Pages）にアクセスして、最新の生命体の進化状態と進化レポートを確認
    

---

## 6. 実装上の注意点

- **データ検証**：
    
    AIから返却されるJSONの各パラメータに対して、負の値や範囲外の値が入らないようバリデーションする
    
- **セキュリティ**：
    
    APIキーや機密情報はフロント側に含めず、バックエンド（AWS Lambdaなど）で管理する
    
- **パフォーマンス**：
    
    CanvasやSVG描画はパフォーマンスを意識し、必要なら描画領域の最適化を図る
    
- **履歴管理**：
    
    各進化ステップのデータとレポートは、時系列ファイルまたはデータベースで管理し、リポジトリから一覧表示できるようにする
    
- **利用料金**：
    
    Open API 系 GPTやAWS等、従量課金されるものは料金を極力抑えるよため、頻繁に実行されないようにする。
    

---

## 7. 参考コードスニペット

### AI進化データ取得例 (fetch API)

```jsx
async function fetchNextEvolution(currentState) {
  const response = await fetch('https://your-ai-api.example/next-evolution', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(currentState),
  });
  if (!response.ok) {
    throw new Error('API error');
  }
  return await response.json();
}
```

### Canvas 描画例

```jsx
function drawCell(ctx, cell) {
  ctx.fillStyle = `hsl(${cell.color_h}, 80%, 60%)`;
  ctx.beginPath();
  ctx.ellipse(
    cell.x,
    cell.y,
    cell.radius * (1 + cell.shapeFactor),
    cell.radius * (1 - cell.shapeFactor),
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function drawEntity(ctx, cells) {
  cells.forEach(drawCell.bind(null, ctx));
}
```

### 進化＆描画更新の流れ

```jsx
async function evolveAndRender(ctx, currentState) {
  try {
    // AIから次の進化状態を取得
    const nextState = await fetchNextEvolution(currentState);
    // 画面クリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // entityA と entityB を描画
    drawEntity(ctx, nextState.entityA.cells);
    drawEntity(ctx, nextState.entityB.cells);
    // 進化レポートは別UIコンポーネントで表示
    updateReportUI(nextState.entityA.report, nextState.entityB.report);
    return nextState;
  } catch (error) {
    console.error('Evolution update failed:', error);
  }
}
```

---

## 8. まとめ

この仕様書は、

- 静的サイト（GitHub Pages）＋AI進化生成（外部API/AWS Lambda）＋フロントエンドのCanvas描画
    
    という構成で、2体の膝形生命体が進化し、各進化ステップごとに「現在の姿」「進化要因」「内面」をレポートとして記録・表示する仕組みを実現するためのものです。