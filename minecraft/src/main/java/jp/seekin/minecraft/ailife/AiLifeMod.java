package jp.seekin.minecraft.ailife;

import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.event.server.ServerStartingEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.common.MinecraftForge;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.level.Level;

import net.minecraftforge.event.RegisterCommandsEvent;

/**
 * AI生命体MOD - メインクラス
 * 
 * <p>このMODは以下の機能を提供します：</p>
 * <ul>
 *   <li>config/generated_entities.json からAI生命体データを読み込み</li>
 *   <li>サーバー起動時に各AI生命体をワールドにスポーン</li>
 *   <li>EMF/ETF/Fresh Animationsとの連携によるカスタムスキン・アニメーション適用</li>
 *   <li>AI生命体の位置情報取得・JSON出力機能</li>
 *   <li>Minecraftコマンド `/ailife export_status` の提供</li>
 * </ul>
 * 
 * <p><strong>リファクタリング済み：</strong></p>
 * <p>このクラスは単一責任原則に従い、以下のサービスクラスに責任を委譲します：</p>
 * <ul>
 *   <li>{@link EntitySpawnManager} - エンティティスポーン管理</li>
 *   <li>{@link EntityInfoService} - エンティティ情報取得</li>
 *   <li>{@link JsonExportService} - JSON出力機能</li>
 *   <li>{@link AiLifeCommands} - Minecraftコマンド管理</li>
 *   <li>{@link EntityUtils} - エンティティ関連ユーティリティ</li>
 *   <li>{@link DnaUtils} - DNA関連ユーティリティ</li>
 * </ul>
 * 
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 * @see net.minecraftforge.fml.common.Mod
 */
@Mod("ailife")
public class AiLifeMod {
    
    /**
     * Forge推奨のロガーインスタンス
     * MOD全体のログ出力に使用する
     */
    public static final Logger LOGGER = LogManager.getLogger();

    // サービスクラスのインスタンス
    private final EntitySpawnManager entitySpawnManager;
    private final EntityInfoService entityInfoService;
    private final JsonExportService jsonExportService;
    private final AiLifeCommands aiLifeCommands;

    /**
     * MODのコンストラクタ
     * 
     * <p>MOD初期化時に呼び出され、サービスクラスの初期化とイベントバスへの登録を行います。</p>
     * 
     * @since 1.0.0
     */
    public AiLifeMod() {
        // サービスクラスの初期化（依存性注入）
        this.entitySpawnManager = new EntitySpawnManager(LOGGER);
        this.entityInfoService = new EntityInfoService(LOGGER);
        this.jsonExportService = new JsonExportService(LOGGER);
        this.aiLifeCommands = new AiLifeCommands(LOGGER, entityInfoService, jsonExportService);
        
        // MOD初期化時の処理：イベントバスに自身を登録
        MinecraftForge.EVENT_BUS.register(this);
        LOGGER.info("[AiLife] AI生命体MODが初期化されました（リファクタリング済み）");
    }

    /**
     * サーバー起動時にgenerated_entities.jsonを読み込み、AI生命体をスポーンする
     * 
     * <p>このメソッドは{@link EntitySpawnManager}に処理を委譲します。</p>
     *
     * @param event サーバー起動イベント（Forgeから自動的に渡される）
     * @since 1.0.0
     * @see ServerStartingEvent
     * @see EntitySpawnManager#spawnEntitiesFromJson(ServerLevel)
     */
    @SubscribeEvent
    public void onServerStarting(ServerStartingEvent event) {
        LOGGER.info("[AiLife] サーバー起動時処理を開始します");
        
        try {
            // サーバーワールドの取得
            ServerLevel world = event.getServer().getLevel(Level.OVERWORLD);
            if (world == null) {
                LOGGER.error("[AiLife] オーバーワールドの取得に失敗しました。スポーン処理を中断します");
                return;
            }

            // EntitySpawnManagerに処理を委譲
            EntitySpawnManager.SpawnResult result = entitySpawnManager.spawnEntitiesFromJson(world);
            
            LOGGER.info("[AiLife] サーバー起動時処理完了 - スポーン成功: {}体, スキップ: {}体", 
                result.getSpawnedCount(), result.getSkippedCount());

        } catch (Exception e) {
            LOGGER.error("[AiLife] サーバー起動時処理中に予期しないエラーが発生しました", e);
        }
    }

    /**
     * Minecraftコマンドの登録
     * 
     * <p>このメソッドは{@link AiLifeCommands}に処理を委譲します。</p>
     * 
     * @param event コマンド登録イベント
     * @since 1.0.0
     * @see AiLifeCommands#registerCommands
     */
    @SubscribeEvent
    public void onRegisterCommands(RegisterCommandsEvent event) {
        LOGGER.info("[AiLife] AILifeコマンドの登録を開始します");
        
        // AiLifeCommandsに処理を委譲
        aiLifeCommands.registerCommands(event.getDispatcher());
        
        LOGGER.info("[AiLife] AILifeコマンドの登録が完了しました");
    }

    // ===== 後方互換性のためのパブリックAPIメソッド =====

    /**
     * 現在スポーンしているAI生命体エンティティの情報を取得する（パブリックAPI）
     * 
     * <p>このメソッドは{@link EntityInfoService}に処理を委譲します。</p>
     * 
     * @return AI生命体エンティティの情報リスト
     * @since 1.0.0
     * @see EntityInfoService#getCurrentAiLifeEntitiesInformation()
     */
    public java.util.List<com.google.gson.JsonObject> getCurrentAiLifeEntitiesInformation() {
        return entityInfoService.getCurrentAiLifeEntitiesInformation();
    }

    /**
     * AI生命体エンティティ情報をJSON形式でファイルに出力する（パブリックAPI）
     * 
     * <p>このメソッドは{@link EntityInfoService}と{@link JsonExportService}に処理を委譲します。</p>
     * 
     * @param outputFilePath 出力先ファイルパス
     * @since 1.0.0
     * @see EntityInfoService#getCurrentAiLifeEntitiesInformation()
     * @see JsonExportService#exportEntityStatusToFile
     */
    public void exportEntityStatusToFile(String outputFilePath) {
        LOGGER.info("[AiLife] パブリックAPI: AI生命体エンティティ情報のJSON出力を開始します: {}", outputFilePath);
        
        try {
            // EntityInfoServiceから情報を取得
            var entityInfoList = entityInfoService.getCurrentAiLifeEntitiesInformation();
            
            // JsonExportServiceでファイル出力
            jsonExportService.exportEntityStatusToFile(entityInfoList, outputFilePath);
            
            LOGGER.info("[AiLife] パブリックAPI: JSON出力完了: {}体のエンティティ情報を出力しました", entityInfoList.size());
            
        } catch (Exception e) {
            LOGGER.error("[AiLife] パブリックAPI: JSON出力中にエラーが発生しました: {}", outputFilePath, e);
            throw new RuntimeException("JSON出力に失敗しました: " + e.getMessage(), e);
        }
    }

    /**
     * エンティティ情報取得からファイル出力までの完全なワークフローを実行する（パブリックAPI）
     * 
     * <p>このメソッドは{@link AiLifeCommands}に処理を委譲します。</p>
     * 
     * @param outputFilePath 出力先ファイルパス
     * @since 1.0.0
     * @deprecated このメソッドは直接使用せず、{@code /ailife export_status}コマンドを使用してください
     */
    @Deprecated
    public void executeCompleteEntityExportWorkflow(String outputFilePath) {
        LOGGER.warn("[AiLife] executeCompleteEntityExportWorkflow()は非推奨です。/ailife export_statusコマンドを使用してください。");
        
        // 後方互換性のため、直接サービスを呼び出し
        try {
            var entityInfoList = entityInfoService.getCurrentAiLifeEntitiesInformation();
            jsonExportService.exportEntityStatusToFile(entityInfoList, outputFilePath);
        } catch (Exception e) {
            LOGGER.error("[AiLife] 完全エクスポートワークフロー中にエラーが発生しました", e);
            throw new RuntimeException("完全エクスポートワークフローの実行に失敗しました: " + e.getMessage(), e);
        }
    }

    // ===== ゲッターメソッド（テストや外部連携用） =====

    /**
     * EntitySpawnManagerインスタンスを取得する
     * 
     * @return EntitySpawnManagerインスタンス
     */
    public EntitySpawnManager getEntitySpawnManager() {
        return entitySpawnManager;
    }

    /**
     * EntityInfoServiceインスタンスを取得する
     * 
     * @return EntityInfoServiceインスタンス
     */
    public EntityInfoService getEntityInfoService() {
        return entityInfoService;
    }

    /**
     * JsonExportServiceインスタンスを取得する
     * 
     * @return JsonExportServiceインスタンス
     */
    public JsonExportService getJsonExportService() {
        return jsonExportService;
    }

    /**
     * AiLifeCommandsインスタンスを取得する
     * 
     * @return AiLifeCommandsインスタンス
     */
    public AiLifeCommands getAiLifeCommands() {
        return aiLifeCommands;
    }
} 