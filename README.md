# seek-in（飼育員）プロジェクト

2体の膝形生命体が自発的に進化し、相互に影響を与えながら変化していく様子を観察するWebアプリケーション。

## 特徴

- AIを用いて生命体の進化状態（細胞のパラメータ）と、進化の理由や生命体の内面（レポート）を生成
- ユーザーは介入せず、ただ進化の様子と各進化段階における「レポート」を時系列で観察可能
- 視覚的変化だけでなく、「なぜこうなったのか」「今何を感じているか」といった物語的要素も提供

## 技術スタック

- フロントエンド: HTML5, CSS3, JavaScript (ES6+), Canvas
- AI進化生成: OpenAI GPT API
- ホスティング: GitHub Pages
- 自動更新: GitHub Actions

## 開発環境のセットアップ

1. リポジトリをクローン
```bash
git clone [リポジトリURL]
cd seek-in
```

2. ローカルサーバーで実行（例：Pythonの場合）
```bash
python -m http.server 8000
```

3. ブラウザで確認
```
http://localhost:8000
```

## プロジェクト構造

```
seek-in/
├── index.html          # メインのHTMLファイル
├── styles/
│   └── main.css       # スタイルシート
├── scripts/
│   └── main.js        # メインのJavaScriptファイル
└── data/
    └── initial-state.json  # 初期状態のデータ
```

## ライセンス

MIT License

## 作者

[あなたの名前] 