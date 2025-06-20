# 🦵Minecraft AI生命体プロジェクト チェックリスト（Entity Model Loader＋AI JSON方式）

---

## 1. 環境構築・基盤準備
- [x] ConoHa VPSに最新版Minecraft Java Editionサーバーをセットアップ
- [x] Java（Forge対応バージョン）をインストール
- [x] Forgeサーバーを導入し、動作確認
- [ ] BlockbenchをローカルPC（モデル・スキン作成用）にインストール

## 2. モデル・リソースパック準備
- [x] Entity Model Features（EMF, MITライセンス）をサーバーとクライアントのmodsフォルダに導入
- [x] Entity Texture Features（ETF, MITライセンス）をサーバーとクライアントのmodsフォルダに導入
- [ ] Blockbenchで膝型生命体や進化バリエーションのモデル・スキン・アニメーションを複数作成
- [x] Fresh Animations等のOptiFine/EMF対応リソースパックをクライアントのresourcepacksフォルダに導入・有効化
- [ ] Entity Model Loaderの仕様に合わせてモデル・スキン・アニメーションを登録

## 3. AI生命体データ管理
### 3.1 初期個体データ生成・リセット
- [x] initial_adam_eve.jsonを作成し、アダムとイブの個体データを定義
- [x] generate_entities.jsでinitial_adam_eve.jsonを読み込み、generated_entities.jsonを出力
- [x] テスト用に「初期状態に戻す」リセットスクリプトを用意

## 4. MOD本体連携・ワールド反映
### 4.1 データ連携・テスト
- [x] generated_entities.jsonをMOD本体で読み込む処理を実装
- [x] 読み込んだ内容をログ出力し、正しく取得できているかテスト

### 4.2 個体データ連携によるスポーン処理
- [ ] 未スポーン個体（adam/eve等）をワールド内に自動スポーン
- [ ] モデル・スキン・アニメーションを個体ごとに適用
- [ ] スポーン位置・重複管理のロジックを実装
- [ ] テスト・デバッグ

## 5. AI連携・家系・進化サイクル自動化
- [ ] 1時間ごとに全AI生命体の行動・状態を記録
- [ ] スクリプトで「繁殖条件を満たしたペア」や「進化イベント」を抽出
- [ ] 必要な個体・イベントのみを要約し、AI連携用JSONを生成
- [ ] JSONのトークン数をAPI上限内に収める
- [ ] ChatGPT API等に要約JSONを送信し、子孫や進化内容を取得
- [ ] レスポンスJSONから新個体（子供）や進化内容を抽出
- [ ] 新個体・進化内容をMinecraft内データ・家系ツリーに反映
- [ ] 1時間ごとにこのサイクルを自動で繰り返す
- [ ] 生成されたJSONの構文・内容を自動バリデーション
- [x] 各個体データには必ず性別（gender）情報を含める
- [x] adamは'male'、eveは'female'として初期化
- [ ] 子孫生成時は親2体の性別が異なる場合のみ生成可能とする

## 6. その他運用・拡張
- [ ] Entity Model Loaderが指定ディレクトリのJSONを定期的に読み込み、各エンティティに反映
- [ ] 進化・誕生・社会性・行動パターン・寿命などをJSONデータに基づき反映
- [ ] ゲーム内チャットやログで進化・誕生・死亡・社会イベントを通知
- [ ] 家系・進化履歴をJSONで保存・管理
- [ ] 進化レポートや家系図を表示
- [ ] トークン上限超過時のエラー処理・例外対応
- [ ] テスト・レビュー・README更新

## 7. 重要動作確認ポイント
- [ ] アダムとイブがMODで正しくスポーンできる
- [ ] ChatGPTへのリクエスト・レスポンスが適切
- [ ] ChatGPTレスポンスに応じて個体の誕生・変更が行われる

---

## 参考：MOD・リソースパック導入手順まとめ（1.20.1/Forge）

### 1. Forge（MODローダー）
- ダウンロードURL: https://files.minecraftforge.net/net/minecraftforge/forge/
- ダウンロードするもの: 1.20.1用のInstaller（forge-1.20.1-xxxx-installer.jar）
- インストール方法: ダウンロードしたjarをダブルクリックし「Install client」を選択

### 2. Entity Model Features（EMF）
- ダウンロードURL: https://modrinth.com/mod/entity-model-features
- ダウンロードするもの: 1.20.1用のForge版jar
- 設置場所: クライアントとサーバー両方の「mods」フォルダ

### 3. Entity Texture Features（ETF）
- ダウンロードURL: https://modrinth.com/mod/entitytexturefeatures
- ダウンロードするもの: 1.20.1用のForge版jar
- 設置場所: クライアントとサーバー両方の「mods」フォルダ

### 4. Fresh Animations（リソースパック）
- ダウンロードURL: https://modrinth.com/resourcepack/fresh-animations/versions
- ダウンロードするもの: 1.20.1対応バージョンのzip
- 設置場所: クライアントの「resourcepacks」フォルダ

---

※ modsフォルダがない場合は自分で作成してOK
※ Forgeで起動しないとMODは有効になりません
※ サーバー・クライアントともバージョンを揃えること

ご質問・ご要望は随時Issueまたはチャットでお知らせください。 