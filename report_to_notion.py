from src.services.notion_service import NotionService
from src.app import get_notion_database_id
from datetime import datetime

# 日報レポート本文
content = '''## 日報レポート（AI漫画自動化フロー開発）

### 1. 目的・ゴール
- ChatGPT（OpenAI API）でストーリーを生成し、そのストーリーをStable Diffusionで漫画画像化し、S3に保存、Notionに貼り付ける自動化フローの安定運用・改善。

### 2. 本日の主な作業内容

■ 既存フローの確認・動作テスト
- Docker環境でtest_story_to_notion.pyを実行し、ストーリー生成→画像生成→S3アップロード→Notion連携の一連の流れをテスト。
- OpenAI APIのバージョン不整合やパスの問題、APIサーバーの起動・サービス名の確認など、細かなエラーに都度対応。

■ 画像生成AIの切り替え・検証
- DALL·E（OpenAI画像生成API）からStable Diffusionへの切り替えを実施。
- Stable Diffusionのセットアップ、必要パッケージのインストール、モデルダウンロード、動作確認。
- Stable Diffusionでの漫画画像生成が正常に動作することを確認。

■ プロンプト・生成品質の検証
- 生成された漫画画像の吹き出し内の文字が「日本語で正しく出ない」「途中でちぎれる」などの課題を確認。
- プロンプトを「英語のセリフ」「吹き出しは空白」などに工夫することで、品質向上の可能性を検討。
- 1ページ4コマを「1コマずつ生成→合成」する方式の提案・実装（generate_manga_panelsメソッド追加）。

■ 不要な処理・ファイルの整理
- DALL·EやOpenAI画像生成APIを用いた旧処理・テストスクリプト・サービスファイルを完全削除。
- コアとなる「ChatGPTストーリー生成→Stable Diffusion漫画化→S3→Notion」フローのみを残し、シンプルな構成に整理。

### 3. 試行錯誤・工夫点

- APIバージョンやパスの不整合によるエラーに対し、requirements.txtやimportパスを修正。
- Dockerサービス名の確認・修正、APIサーバーの起動順序の見直し。
- 画像生成品質向上のためのプロンプト工夫（日本語→英語、吹き出しの扱い、コマごと生成など）。
- 不要なファイル・コードの整理で、今後の保守性・拡張性を向上。

### 4. 現状・今後の課題

- 現状、ChatGPTストーリー生成→Stable Diffusion漫画化→S3→Notionの自動化フローは正常動作。
- 画像生成の品質（特に吹き出し内の文字やコマ割り）はAIモデルの限界もあり、さらなる工夫・分割生成の自動化余地あり。
- 画像生成は時間がかかるため、今後はバッチ処理や非同期化も検討。

### 5. 感想・所感

- 一連の自動化フローがシンプルかつ安定して動作するようになり、今後の拡張や運用がしやすくなった。
- AI画像生成の限界やプロンプト設計の難しさを再認識。今後も品質向上のための工夫を続けたい。
'''

title = datetime.now().strftime("%Y-%m-%d")
database_id = get_notion_database_id()
NotionService.update_article(database_id, title, content)
print(f"Notionに日報レポートを追記しました（タイトル: {title}）") 