# seek-in（飼育員）

2体の膝形生命体が自発的に進化し、相互に影響を与えながら変化していく様子を観察するWebアプリケーション。

## 特徴

- AIを用いて生命体の進化状態（細胞のパラメータ）と、進化の理由や生命体の内面（レポート）を生成
- ユーザーは介入せず、ただ進化の様子と各進化段階における「レポート」を時系列で観察できる
- 視覚的変化だけでなく、「なぜこうなったのか」「今何を感じているか」といった物語的要素も提供

## 技術スタック

- フロントエンド: HTML5, CSS3, JavaScript (ES6+), Canvas
- AI進化生成: OpenAI GPT系 API
- バックエンド/更新: GitHub Actions
- ホスティング: GitHub Pages

## 使用方法

1. アプリケーションにアクセスする
   - 本番環境: [https://your-username.github.io/seekin_demo/](https://your-username.github.io/seekin_demo/)

2. 生命体の観察
   - 画面上部のCanvasに2体の生命体が表示されます
   - 生命体は1時間ごとに自動的に進化します
   - 「手動進化実行」ボタンで手動でも進化を実行できます

3. 進化レポートの確認
   - 画面下部に進化レポートが時系列で表示されます
   - 各レポートには「現在の姿」「進化要因」「内面」の3つの項目が含まれます

## 開発環境のセットアップ

1. リポジトリのクローン
```bash
git clone https://github.com/your-username/seekin_demo.git
cd seekin_demo
```

2. 依存関係のインストール
```bash
npm install
```

3. ローカルサーバーの起動
```bash
npm start
```

## 注意事項

- OpenAI APIの使用にはAPIキーが必要です
- GitHub Actionsの無料枠の実行時間制限に注意してください
- 進化データは`data/`ディレクトリに保存されます

## ライセンス

MIT License

## 作者

[Your Name] 