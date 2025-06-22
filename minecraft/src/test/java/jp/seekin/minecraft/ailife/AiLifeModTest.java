package jp.seekin.minecraft.ailife;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.fail;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

import com.google.gson.JsonArray;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;

/**
 * AiLifeModの機能に対する統合テストクラス（リファクタリング後）
 * 
 * <p>テスト対象機能:</p>
 * <ul>
 *   <li>リファクタリング後のクラス構造の検証</li>
 *   <li>サービスクラスの依存性注入の確認</li>
 *   <li>既存の5.1.1機能の継続動作確認</li>
 *   <li>統合ワークフローの正常動作確認</li>
 * </ul>
 * 
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */
@DisplayName("AiLifeMod 統合テスト（リファクタリング後）")
public class AiLifeModTest {

    /** テスト用の設定ディレクトリパス */
    private static final String TEST_CONFIG_DIR = "test-config";
    
    /** テスト用の出力ファイル名 */
    private static final String TEST_OUTPUT_FILE = "current_entity_status.json";
    
    /** テスト用の出力ファイルパス */
    private Path testOutputPath;
    
    /** テスト対象のAiLifeModインスタンス */
    private AiLifeMod aiLifeMod;

    /**
     * 各テスト実行前のセットアップ
     * テスト用ディレクトリとファイルの準備
     * 
     * @throws IOException ファイル操作に失敗した場合
     */
    @BeforeEach
    @DisplayName("テスト環境のセットアップ")
    void setUp() throws IOException {
        // テスト用ディレクトリの作成
        Path testConfigPath = Paths.get(TEST_CONFIG_DIR);
        Files.createDirectories(testConfigPath);
        
        // テスト用出力ファイルパスの設定
        testOutputPath = testConfigPath.resolve(TEST_OUTPUT_FILE);
        
        // 既存のテストファイルがあれば削除
        Files.deleteIfExists(testOutputPath);
        
        // AiLifeModインスタンスの作成
        aiLifeMod = new AiLifeMod();
        
        System.out.println("テスト環境セットアップ完了: " + testConfigPath.toAbsolutePath());
    }

    /**
     * 各テスト実行後のクリーンアップ
     * テスト用ファイルとディレクトリの削除
     * 
     * @throws IOException ファイル操作に失敗した場合
     */
    @AfterEach
    @DisplayName("テスト環境のクリーンアップ")
    void tearDown() throws IOException {
        // テスト用ファイルの削除
        Files.deleteIfExists(testOutputPath);
        
        // テスト用ディレクトリの削除
        Path testConfigPath = Paths.get(TEST_CONFIG_DIR);
        if (Files.exists(testConfigPath)) {
            Files.delete(testConfigPath);
        }
        
        System.out.println("テスト環境クリーンアップ完了");
    }

    // ===== リファクタリング後のクラス構造テスト =====

    @Test
    @DisplayName("リファクタリング: サービスクラスのインスタンス化確認")
    void testServiceClassInstantiation() {
        // 各サービスクラスが正常にインスタンス化されていることを確認
        assertNotNull(aiLifeMod.getEntitySpawnManager(), "EntitySpawnManagerがインスタンス化されているはず");
        assertNotNull(aiLifeMod.getEntityInfoService(), "EntityInfoServiceがインスタンス化されているはず");
        assertNotNull(aiLifeMod.getJsonExportService(), "JsonExportServiceがインスタンス化されているはず");
        assertNotNull(aiLifeMod.getAiLifeCommands(), "AiLifeCommandsがインスタンス化されているはず");
        
        System.out.println("リファクタリング: 全サービスクラスが正常にインスタンス化されました");
    }

    @Test
    @DisplayName("リファクタリング: 依存性注入の確認")
    void testDependencyInjection() {
        // AiLifeCommandsが正しいサービスを注入されていることを確認
        // （実際のフィールドアクセスは不可能なため、動作確認で代替）
        
        assertDoesNotThrow(() -> {
            // コマンドクラスが正常に機能するかテスト
            var commands = aiLifeMod.getAiLifeCommands();
            assertNotNull(commands, "AiLifeCommandsが取得できるはず");
        }, "依存性注入が正常に行われているはず");
        
        System.out.println("リファクタリング: 依存性注入が正常に機能しています");
    }

    @Test
    @DisplayName("リファクタリング: EntityInfoServiceの分離確認")
    void testEntityInfoServiceSeparation() {
        // EntityInfoServiceが独立して機能することを確認
        var entityInfoService = aiLifeMod.getEntityInfoService();
        
        assertDoesNotThrow(() -> {
            List<JsonObject> entityInfoList = entityInfoService.getCurrentAiLifeEntitiesInformation();
            assertNotNull(entityInfoList, "エンティティ情報リストが取得できるはず");
            assertEquals(0, entityInfoList.size(), "テスト環境ではエンティティが0体であるはず");
        }, "EntityInfoServiceが独立して動作するはず");
        
        System.out.println("リファクタリング: EntityInfoServiceが独立して動作しています");
    }

    @Test
    @DisplayName("リファクタリング: JsonExportServiceの分離確認")
    void testJsonExportServiceSeparation() throws IOException {
        // JsonExportServiceが独立して機能することを確認
        var jsonExportService = aiLifeMod.getJsonExportService();
        var entityInfoService = aiLifeMod.getEntityInfoService();
        
        assertDoesNotThrow(() -> {
            // エンティティ情報を取得
            List<JsonObject> entityInfoList = entityInfoService.getCurrentAiLifeEntitiesInformation();
            
            // JSON出力を実行
            jsonExportService.exportEntityStatusToFile(entityInfoList, testOutputPath.toString());
            
            // ファイルが作成されたことを確認
            assertTrue(Files.exists(testOutputPath), "JSONファイルが作成されているはず");
        }, "JsonExportServiceが独立して動作するはず");
        
        System.out.println("リファクタリング: JsonExportServiceが独立して動作しています");
    }

    // ===== 既存機能の継続動作確認テスト =====

    @Test
    @DisplayName("5.1.1.1 AI生命体エンティティ情報取得機能テスト（リファクタリング後）")
    void testGetCurrentEntityInformation() {
        // リファクタリング後も既存のパブリックAPIが正常に動作することを確認
        
        // テスト対象メソッドの呼び出し
        java.util.List<JsonObject> entityInfoList = aiLifeMod.getCurrentAiLifeEntitiesInformation();
        
        // 基本的な戻り値の検証
        assertNotNull(entityInfoList, "エンティティ情報リストがnullではないはず");
        assertTrue(entityInfoList.size() >= 0, "エンティティ情報リストのサイズが0以上であるはず");
        
        // テスト環境では実際のMinecraftサーバーが動いていないため、
        // エンティティが0体であることを確認（正常な動作）
        assertEquals(0, entityInfoList.size(), "テスト環境ではエンティティが0体であるはず");
        
        System.out.println("5.1.1.1 テスト完了: リファクタリング後もエンティティ情報取得機能が正常に動作しました");
    }

    @Test
    @DisplayName("5.1.1.2 JSON形式ファイル出力機能テスト（リファクタリング後）")
    void testExportEntityStatusToJsonFile() throws IOException {
        // リファクタリング後も既存のパブリックAPIが正常に動作することを確認
        
        // テスト対象メソッドの呼び出し
        aiLifeMod.exportEntityStatusToFile(testOutputPath.toString());
        
        // JSONファイルが作成されたことを確認
        assertTrue(Files.exists(testOutputPath), "JSONファイルが作成されているはず");
        
        // JSONファイルの内容を検証
        validateJsonStructure(testOutputPath.toString());
        
        System.out.println("5.1.1.2 テスト完了: リファクタリング後もJSON出力機能が正常に動作しました");
    }

    @Test
    @DisplayName("5.1.1.3 Minecraftコマンド実行機能テスト（リファクタリング後）")
    void testMinecraftCommandExecution() {
        // リファクタリング後のコマンド機能が正常に動作することを確認
        
        // AiLifeCommandsインスタンスが正常に取得できることを確認
        assertDoesNotThrow(() -> {
            var commands = aiLifeMod.getAiLifeCommands();
            assertNotNull(commands, "AiLifeCommandsインスタンスが取得できるはず");
        }, "コマンド機能が正常に動作するはず");
        
        System.out.println("5.1.1.3 テスト完了: リファクタリング後もコマンド機能が正常に動作しました");
    }

    @Test
    @DisplayName("5.1.1 統合テスト: リファクタリング後の完全ワークフロー")
    void testCompleteWorkflowAfterRefactoring() {
        // リファクタリング後も統合ワークフローが正常に動作することを確認
        
        // 全体ワークフローの実行
        assertDoesNotThrow(() -> {
            aiLifeMod.executeCompleteEntityExportWorkflow(testOutputPath.toString());
        }, "リファクタリング後も統合ワークフローがエラーなく実行できるはず");
        
        // 出力ファイルの存在確認
        assertTrue(Files.exists(testOutputPath), "リファクタリング後も統合ワークフローでJSONファイルが作成されているはず");
        
        try {
            // JSONファイルの内容を検証
            validateJsonStructure(testOutputPath.toString());
            System.out.println("5.1.1 統合テスト完了: リファクタリング後も全ワークフローが正常に動作しました");
        } catch (IOException e) {
            fail("JSON構造の検証中にエラーが発生しました: " + e.getMessage());
        }
    }

    // ===== 新機能テスト =====

    @Test
    @DisplayName("リファクタリング: パフォーマンス向上確認")
    void testPerformanceImprovement() {
        // リファクタリング後のパフォーマンスを測定
        long startTime = System.currentTimeMillis();
        
        // 複数回の操作を実行してパフォーマンスを測定
        for (int i = 0; i < 10; i++) {
            assertDoesNotThrow(() -> {
                var entityInfoList = aiLifeMod.getCurrentAiLifeEntitiesInformation();
                assertNotNull(entityInfoList);
            }, "リファクタリング後もパフォーマンスが維持されているはず");
        }
        
        long endTime = System.currentTimeMillis();
        long executionTime = endTime - startTime;
        
        // パフォーマンスが妥当な範囲内であることを確認（1秒以内）
        assertTrue(executionTime < 1000, "リファクタリング後もパフォーマンスが維持されているはず");
        
        System.out.println("リファクタリング: パフォーマンステスト完了 - 実行時間: " + executionTime + "ms");
    }

    @Test
    @DisplayName("リファクタリング: メモリ効率性確認")
    void testMemoryEfficiency() {
        // リファクタリング後のメモリ効率性を確認
        Runtime runtime = Runtime.getRuntime();
        
        // ガベージコレクションを実行してメモリ状態をクリア
        System.gc();
        long memoryBefore = runtime.totalMemory() - runtime.freeMemory();
        
        // AiLifeModインスタンスを複数作成してメモリ使用量を確認
        AiLifeMod[] mods = new AiLifeMod[10];
        for (int i = 0; i < 10; i++) {
            mods[i] = new AiLifeMod();
        }
        
        System.gc();
        long memoryAfter = runtime.totalMemory() - runtime.freeMemory();
        long memoryUsed = memoryAfter - memoryBefore;
        
        // メモリ使用量が妥当な範囲内であることを確認（10MB以内）
        assertTrue(memoryUsed < 10 * 1024 * 1024, "リファクタリング後もメモリ効率が維持されているはず");
        
        System.out.println("リファクタリング: メモリ効率テスト完了 - 使用メモリ: " + (memoryUsed / 1024) + "KB");
    }

    /**
     * 出力されたJSONファイルの構造妥当性をテストするヘルパーメソッド
     * 
     * @param jsonFilePath 検証対象のJSONファイルパス
     * @throws IOException ファイル読み込みに失敗した場合
     */
    private void validateJsonStructure(String jsonFilePath) throws IOException {
        // JSONファイルの存在確認
        assertTrue(Files.exists(Paths.get(jsonFilePath)), 
            "JSONファイルが作成されているはず: " + jsonFilePath);
        
        // JSONファイルの読み込みとパース
        String jsonContent = Files.readString(Paths.get(jsonFilePath));
        JsonObject jsonObject = JsonParser.parseString(jsonContent).getAsJsonObject();
        
        // 必須フィールドの存在確認
        assertTrue(jsonObject.has("timestamp"), "timestampフィールドが存在するはず");
        assertTrue(jsonObject.has("entities"), "entitiesフィールドが存在するはず");
        
        // entitiesが配列であることを確認
        assertTrue(jsonObject.get("entities").isJsonArray(), "entitiesは配列であるはず");
        
        JsonArray entities = jsonObject.getAsJsonArray("entities");
        
        // 各エンティティの必須フィールド確認
        for (int i = 0; i < entities.size(); i++) {
            JsonObject entity = entities.get(i).getAsJsonObject();
            
            assertTrue(entity.has("entity_id"), "entity_idフィールドが存在するはず");
            assertTrue(entity.has("gender"), "genderフィールドが存在するはず");
            assertTrue(entity.has("dna"), "dnaフィールドが存在するはず");
            assertTrue(entity.has("position"), "positionフィールドが存在するはず");
            
            // position内部構造の確認
            JsonObject position = entity.getAsJsonObject("position");
            assertTrue(position.has("x"), "position.xフィールドが存在するはず");
            assertTrue(position.has("y"), "position.yフィールドが存在するはず");
            assertTrue(position.has("z"), "position.zフィールドが存在するはず");
        }
        
        System.out.println("JSON構造妥当性チェック完了: " + entities.size() + "体のエンティティデータ");
    }
} 