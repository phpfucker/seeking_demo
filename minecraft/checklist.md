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
- [x] 未スポーン個体（adam/eve等）をワールド内に自動スポーン
- [x] モデル・スキン・アニメーションを個体ごとに適用
- [x] スポーン位置・重複管理のロジックを実装
- [x] テスト・デバッグ

## 5. AI連携・家系・進化サイクル自動化（詳細版）

- [x] **5.1 Minecraftからのリアルタイムデータ取得**
    - [x] 5.1.1 **Java MOD側: AI生命体の位置情報と状態をファイルに出力する機能の実装**
        - [x] 5.1.1.1 Minecraft MOD（`AiLifeMod.java`）に、現在スポーンしているAI生命体エンティティのID、性別、DNA、**リアルタイム位置情報**を取得する処理を実装
        - [x] 5.1.1.2 取得したデータをJSON形式（例: `config/current_entity_status.json`）でファイルに出力する処理を実装
        - [x] 5.1.1.3 Minecraftコマンド（例: `/ailife export_status`）で上記機能が実行できるコマンドリスナーを実装
        - [x] 5.1.1.4 Java MODの出力機能が正しく動作することを確認するためのテスト（または手動確認手順）を整備
    - [x] 5.1.2 **Node.js側: 出力されたリアルタイム状態データの読み込みと整形**
        - [x] 5.1.2.1 Node.jsスクリプトがJava MODが出力した`current_entity_status.json`を読み込む処理を実装
        - [x] 5.1.2.2 読み込んだデータを、Node.jsで処理しやすい内部データ構造に整形する処理を実装（個体ID、DNA、性別、ワールド内座標を抽出）
        - [x] 5.1.2.3 整形したデータをファイルまたはメモリに一時的に保存する処理を実装
    - [x] **5.1.3 EntitySpawnManager拡張: 特性データのNBT保存機能**
        - [x] 5.1.3.1 `generated_entities.json`から特性データ（behavior, sociality, lifespan）を読み取る処理を実装
        - [x] 5.1.3.2 エンティティスポーン時にNBTタグに特性データを保存する処理を実装
            - **NBTタグ名**: `"Behavior"`, `"Sociality"`, `"Lifespan"`（英語名）
        - [x] 5.1.3.3 特性データが欠損している場合の警告ログ出力とスポーン続行処理
        - [x] 5.1.3.4 全世代統一処理（初期個体・子世代・孫世代すべて同じロジック）のテスト確認
    - [x] **5.1.4 EntityInfoService拡張: 特性データのNBT取得機能**
        - [x] 5.1.4.1 エンティティのNBTタグから特性データを取得する処理を実装
        - [x] 5.1.4.2 特性データが存在しない場合のnull値返却処理を実装
        - [x] 5.1.4.3 `getCurrentAiLifeEntitiesInformation()`メソッドに特性データフィールドを追加
            - **追加フィールド**: `"behavior"`, `"sociality"`, `"lifespan"`
        - [x] 5.1.4.4 JSON出力形式の拡張と後方互換性の確保
    - [ ] **5.1.5 統合テストとバリデーション**
        - [x] 5.1.5.1 初期個体（adam/eve）のスポーン時特性データ保存の確認
        - [x] 5.1.5.2 `/ailife export_status`コマンドでの特性データ出力確認
        - [x] 5.1.5.3 エンティティ再起動後のNBTデータ永続性確認
        - [ ] 5.1.5.4 複数世代にわたる特性データ管理の動作確認

- [x] **5.2 繁殖条件を満たしたユニークペアの抽出**
    - [x] 5.2.1 5.1.2.2で整形されたリアルタイム状態データを利用し、繁殖条件判定の入力とする
    - [x] 5.2.2 読み込んだデータから、各個体の「性別」が「オスとメスのペア」であることを判定するロジックを実装
    - [x] 5.2.3 対象となるオスとメスのペアの「ワールド内座標」を比較し、事前に定義された「接近度（一定距離内）」を満たすかを判定するロジックを実装
    - [x] 5.2.4 上記2つの条件（性別と接近度）を両方満たすペアの中から、**重複しないユニークなペア（例: 一度ペアになった個体は、そのサイクルでは他のペアにはならない）** を抽出する機能の実装
    - [ ] **5.2.5 親の詳細特性情報の補完（5.1.3-5.1.5連携対応）**
        - [x] 5.2.5.1 5.1.3-5.1.5完了を待機後、EntityInfoServiceから特性データを直接取得する方式に移行
        - [x] 5.2.5.2 抽出されたペアの各親に対して、5.1拡張されたJava MODから取得した現在の詳細特性を補完する処理を実装
        - [x] 5.2.5.3 `breeding_pairs_result.json`の出力形式を拡張し、現在世代の親詳細特性も含めて保存する
        - [ ] 5.2.5.4 世代を跨いだ特性継承が正しく動作することを確認するテストを実装

## 期待される5.2修正後のbreeding_pairs_result.json形式
```json
{
  "totalEntities": 2,
  "totalPairs": 1, 
  "distanceValidPairs": 1,
  "uniquePairs": [
    {
      "male": {
        "id": "adam",
        "gender": "male",
        "dna": ["A","C","G","T",...],
        "behavior": "curious",
        "sociality": "leader", 
        "lifespan": 1500,
        "position": {"x": 25.4, "y": 66, "z": 10.78},
        "health": 20,
        "age": 0,
        "entity_type": "entity.minecraft.villager",
        "max_health": 20
      },
      "female": {
        "id": "eve",
        "gender": "female", 
        "dna": ["T","G","C","A",...],
        "behavior": "passive",
        "sociality": "herd",
        "lifespan": 1500,
        "position": {"x": 29.74, "y": 69, "z": 29.27},
        "health": 20,
        "age": 0,
        "entity_type": "entity.minecraft.villager",
        "max_health": 20
      },
      "distance": 19.23
    }
  ],
  "maxDistance": 25,
  "processedAt": "2025-06-22T14:46:57.267Z"
}
```


- [ ] **5.3 AI連携用JSONの生成と送信**
    - [x] 5.3.1 **繁殖ペア情報の抽出と要約JSON生成**
        - [x] 5.3.1.1 `breeding_pairs_result.json`から繁殖ペアの親情報（ID、DNA、特性）を抽出
        - [x] 5.3.1.2 各ペアの親データから必要最小限の情報を抽出してChatGPT送信用JSONを生成
            - **抽出する項目**：`id`, `dna`, `behavior`, `sociality`, `lifespan`
            - **除外する項目**：`position`, `health`, `age`, `entity_type`, `max_health`, 統計情報
            - **出力形式**：`{breeding_pairs: [{male: {...}, female: {...}}]}`
        - [x] 5.3.1.3 複数ペアに対応した配列構造でのデータ整理
        - [x] 5.3.1.4 距離が近いペアを優先した並び替え機能
    - [x] 5.3.2 **利用可能エンティティ情報の準備**
        - [x] 5.3.2.1 `models_skins_animations.json`から利用可能エンティティ名リストを抽出
        - [x] 5.3.2.2 エンティティ名のみの配列を生成（詳細パス情報は除外してトークン節約）
            - **抽出する項目**：`name`のみ
            - **除外する項目**：`model`, `texture`, `animation`パス情報
            - **出力形式**：`["villager", "witch", "zombie", "pig", ...]`
        - [x] 5.3.2.3 ChatGPT送信用データに統合
    - [x] 5.3.3 **トークン制限管理システム**
        - [x] 5.3.3.1 tiktoken-nodeライブラリのインストールと設定
        - [x] 5.3.3.2 正確なトークン計算機能の実装（`tiktoken.encodingForModel("gpt-3.5-turbo")`使用）
        - [x] 5.3.3.3 トークン制限値の設定（実際の送信上限：3,000トークン）
        - [x] 5.3.3.4 動的ペア数調整機能（距離近い順でペア優先選択、上限超過時の後方ペア削除）
    - [x] 5.3.4 **管理者介入システム（コマンド方式）**
        - [x] 5.3.4.1 Minecraftコマンド機能の実装（`/ailife set_guidance`, `/ailife clear_guidance`, `/ailife show_guidance`）
        - [x] 5.3.4.2 コマンド設定の永続化（`current_guidance.txt`ファイルへの保存）
        - [x] 5.3.4.3 指示内容のトークン計算と制限チェック（最大500文字）
        - [x] 5.3.4.4 Node.js側での指示内容読み込み機能
            - [x] 5.3.4.4.1 `current_guidance.txt`の読み込み処理の実装
            - [x] 5.3.4.4.2 AIリクエストジェネレーターでの指示内容の統合
            - [x] 5.3.4.4.3 ファイルが存在しない場合や空の場合のハンドリング

- [x] **5.4 ChatGPTからのレスポンス処理**
    - [x] 5.4.1 ChatGPT APIからのレスポンスを受信し、その内容をパースする機能の実装
    - [x] 5.4.2 レスポンスJSONから、新たに生成された子孫の「個体ID」「DNA」「性別」などの詳細情報を抽出する機能の実装

- [x] **5.5 新個体のMinecraftデータへの反映（完全置換方式）**
    - [x] 5.5.1 **evolution-result-integrator.js作成**
        - [x] 5.5.1.1 ChatGPT結果をMinecraft形式に変換する機能の実装
            - [x] `data/evolution_result.json`読み込み機能
            - [x] DNA配列変換機能（`["A","C","G","T"]` → `"ACGT"`）
            - [x] `selected_entity`を使って`models_skins_animations.json`からmodel/texture/animationパス取得機能
            - [x] initial_adam_eve.json形式への整形機能
        - [x] 5.5.1.2 generated_entities.jsonの完全上書き機能の実装
            - [x] `/opt/minecraft_forge_server/config/generated_entities.json`への直接上書き処理
            - [x] 親世代データ削除、子世代のみが生存する自然な世代交代の実現
        - [x] 5.5.1.3 実行方法の実装（`node evolution-result-integrator.js`）
    - [x] 5.5.2 **test-evolution-result-integrator.js作成**
        - [x] 5.5.2.1 テスト用evolution_result.jsonの作成
        - [x] 5.5.2.2 統合処理のテスト実装
        - [x] 5.5.2.3 出力確認テストの実装

- [x] **5.6 進化サイクルの自動化とバリデーション**
    - [x] 5.6.1 RCON設定の導入・設定
        - [x] Node.jsからMinecraftサーバーへコマンド送信するためのRCON設定を導入
        - [x] Minecraft MODコマンド（/ailife export_status）をNode.jsから実行する仕組みを構築
    - [x] 5.6.2 スクリプト実行順序の統合
        - [x] status-data-integration.jsを実行し、MOD出力のcurrent_entity_status.jsonをformatted_status_data.jsonに整形する
        - [x] breeding-pair-extractor.jsを実行し、formatted_status_data.jsonから繁殖ペアを抽出しbreeding_pairs_result.jsonを生成する
        - [x] ai-request-generator.jsを実行し、breeding_pairs_result.jsonとmodels_skins_animations.jsonからai_request_data.jsonを生成する
        - [x] chatgpt-evolution-processor.jsを実行し、ai_request_data.jsonをChatGPT APIに送りevolution_result.jsonを生成する
        - [x] evolution-result-integrator.jsを実行し、evolution_result.jsonをgenerated_entities.jsonに変換・上書きする
    - [x] 5.6.3 親スクリプトとスケジューリング
        - [x] 上記スクリプト群を順番に実行する親スクリプト（auto-minecraft-evolution.js等）を作成
        - [x] cronジョブまたはNode.jsスケジューラーで1時間ごとに親スクリプトを自動実行する設定
    - [x] 5.6.4 ログ管理とエラー処理
        - [x] 専用ログファイル（auto-evolution.log等）への標準出力・標準エラー記録機能を実装
        - [x] エラー発生時のログ記録とスクリプト続行・停止判定の仕組みを実装
    - [x] 5.6.5 運用準備とテスト
        - [x] 環境変数（OPENAI_API_KEY等）の設定確認
        - [x] VPS環境での動作テスト・デバッグ実行
        - [x] 本番運用開始
    - [x] 5.6.6 バリデーション機能
        - [x] ChatGPTからのレスポンスを含む、生成される全てのJSONデータに対して、期待される構文と内容が正しいかを自動的にバリデーションする機能の実装

- [x] 各個体データには必ず性別（gender）情報を含める
- [x] adamは'male'、eveは'female'として初期化
- [ ] 子孫生成時は親2体の性別が異なる場合のみ生成可能とする (これは5.2.2でカバーされます)

## 6. その他運用・拡張
- [ ] 5.2繁殖ペア抽出の精度向上（最短接近距離・接触履歴・接触時間記録）
- [ ] Entity Model Loaderが指定ディレクトリのJSONを定期的に読み込み、各エンティティに反映
- [ ] 進化・誕生・社会性・行動パターン・寿命などをJSONデータに基づき反映
  - エンティティの寿命（lifespan）をゲーム内で反映するロジックを実装（例：Tickごとに寿命を減算し、0で自動消滅）
    - 現状はJSONデータに寿命情報が存在するが、MOD本体では未適用
- [ ] ゲーム内チャットやログで進化・誕生・死亡・社会イベントを通知
- [ ] 家系・進化履歴をJSONで保存・管理
- [ ] 進化レポートや家系図を表示
- [ ] トークン上限超過時のエラー処理・例外対応
- [ ] テスト・レビュー・README更新

## 7. 重要動作確認ポイント
- [x] アダムとイブがMODで正しくスポーンできる
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