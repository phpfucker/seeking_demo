package jp.seekin.minecraft.ailife;

import com.mojang.brigadier.CommandDispatcher;
import com.mojang.brigadier.context.CommandContext;
import com.mojang.brigadier.arguments.StringArgumentType;
import net.minecraft.commands.CommandSourceStack;
import net.minecraft.commands.Commands;
import net.minecraft.network.chat.Component;
import org.apache.logging.log4j.Logger;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * AI生命体MOD関連のMinecraftコマンドを管理するクラス
 * 
 * <p>このクラスは以下の責任を持ちます：</p>
 * <ul>
 *   <li>Minecraftコマンドの登録</li>
 *   <li>コマンド実行処理の管理</li>
 *   <li>コマンド結果のチャット出力</li>
 * </ul>
 * 
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */
public class AiLifeCommands {
    
    private final Logger logger;
    private final EntityInfoService entityInfoService;
    private final JsonExportService jsonExportService;
    
    /**
     * AiLifeCommandsのコンストラクタ
     * 
     * @param logger ログ出力用のLoggerインスタンス
     * @param entityInfoService エンティティ情報取得サービス
     * @param jsonExportService JSON出力サービス
     */
    public AiLifeCommands(Logger logger, EntityInfoService entityInfoService, JsonExportService jsonExportService) {
        this.logger = logger;
        this.entityInfoService = entityInfoService;
        this.jsonExportService = jsonExportService;
    }
    
    /**
     * AI生命体関連のコマンドを登録する
     * 
     * <p>登録されるコマンド：</p>
     * <ul>
     *   <li>/ailife export_status - AI生命体の状態情報をJSONファイルに出力</li>
     *   <li>/ailife set_guidance <text> - 管理者指示を設定</li>
     *   <li>/ailife clear_guidance - 管理者指示をクリア</li>
     *   <li>/ailife show_guidance - 現在の管理者指示を表示</li>
     * </ul>
     * 
     * @param dispatcher コマンドディスパッチャー
     */
    public void registerCommands(CommandDispatcher<CommandSourceStack> dispatcher) {
        logger.info("[AiLife] AiLifeCommands: AILifeコマンドを登録します");
        
        dispatcher.register(
            Commands.literal("ailife")
                .then(Commands.literal("export_status")
                    .requires(source -> source.hasPermission(2)) // OP権限レベル2が必要
                    .executes(this::executeExportStatusCommand)
                )
                .then(Commands.literal("set_guidance")
                    .requires(source -> source.hasPermission(2)) // OP権限が必要
                    .then(Commands.argument("guidance", StringArgumentType.greedyString())
                        .executes(context -> {
                            String guidance = StringArgumentType.getString(context, "guidance");
                            if (guidance.length() > 500) {
                                context.getSource().sendFailure(Component.literal("文字数制限を超えています（最大500文字）"));
                                return 0;
                            }
                            try {
                                setGuidance(guidance);
                                context.getSource().sendSuccess(() -> Component.literal("管理者指示を設定しました: " + guidance), true);
                                return 1;
                            } catch (Exception e) {
                                context.getSource().sendFailure(Component.literal("管理者指示の設定に失敗しました: " + e.getMessage()));
                                return 0;
                            }
                        })))
                .then(Commands.literal("clear_guidance")
                    .requires(source -> source.hasPermission(2))
                    .executes(context -> {
                        try {
                            clearGuidance();
                            context.getSource().sendSuccess(() -> Component.literal("管理者指示をクリアしました"), true);
                            return 1;
                        } catch (Exception e) {
                            context.getSource().sendFailure(Component.literal("管理者指示のクリアに失敗しました: " + e.getMessage()));
                            return 0;
                        }
                    }))
                .then(Commands.literal("show_guidance")
                    .requires(source -> source.hasPermission(2))
                    .executes(context -> {
                        try {
                            String guidance = showGuidance();
                            if (guidance.isEmpty()) {
                                context.getSource().sendSuccess(() -> Component.literal("管理者指示は設定されていません"), true);
                            } else {
                                context.getSource().sendSuccess(() -> Component.literal("現在の管理者指示: " + guidance), true);
                            }
                            return 1;
                        } catch (Exception e) {
                            context.getSource().sendFailure(Component.literal("管理者指示の表示に失敗しました: " + e.getMessage()));
                            return 0;
                        }
                    }))
        );
        
        logger.info("[AiLife] コマンド '/ailife export_status' が正常に登録されました");
    }
    
    /**
     * /ailife export_status コマンドの実行処理
     * 
     * @param context コマンド実行コンテキスト
     * @return コマンド実行結果（成功時は1）
     */
    private int executeExportStatusCommand(CommandContext<CommandSourceStack> context) {
        CommandSourceStack source = context.getSource();
        
        try {
            logger.info("[AiLife] '/ailife export_status' コマンドが実行されました");
            
            // 出力ファイルパスの決定
            String outputFilePath = "config/current_entity_status.json";
            
            // チャットメッセージでコマンド実行開始を通知
            source.sendSuccess(() -> Component.literal("§a[AiLife] AI生命体の状態情報を出力しています..."), false);
            
            // 実際のエクスポート処理を実行
            executeCompleteEntityExportWorkflow(outputFilePath);
            
            // 成功メッセージをチャットに送信
            source.sendSuccess(() -> Component.literal("§a[AiLife] AI生命体の状態情報を " + outputFilePath + " に出力しました"), true);
            
            logger.info("[AiLife] '/ailife export_status' コマンドが正常に完了しました");
            return 1; // コマンド成功
            
        } catch (Exception e) {
            // エラーメッセージをチャットに送信
            source.sendFailure(Component.literal("§c[AiLife] エラー: " + e.getMessage()));
            logger.error("[AiLife] '/ailife export_status' コマンドの実行中にエラーが発生しました", e);
            return 0; // コマンド失敗
        }
    }
    
    /**
     * エンティティ情報取得からファイル出力までの完全なワークフローを実行する
     * 
     * @param outputFilePath 出力先ファイルパス
     */
    private void executeCompleteEntityExportWorkflow(String outputFilePath) {
        logger.info("[AiLife] AiLifeCommands: AI生命体情報の完全エクスポートワークフローを開始します");
        
        long startTime = System.currentTimeMillis();
        
        try {
            // Step 1: 現在のAI生命体エンティティ情報を取得
            logger.debug("[AiLife] Step 1: AI生命体エンティティ情報取得中...");
            var entityInfoList = entityInfoService.getCurrentAiLifeEntitiesInformation();
            logger.info("[AiLife] Step 1 完了: {}体のAI生命体情報を取得しました", entityInfoList.size());
            
            // Step 2: JSON形式に整形してファイルに出力
            logger.debug("[AiLife] Step 2: JSON整形とファイル出力中...");
            jsonExportService.exportEntityStatusToFile(entityInfoList, outputFilePath);
            logger.info("[AiLife] Step 2 完了: JSONファイル出力完了");
            
            // Step 3: 実行結果の記録
            long endTime = System.currentTimeMillis();
            long executionTime = endTime - startTime;
            
            logger.info("[AiLife] AiLifeCommands: 完全エクスポートワークフロー完了:");
            logger.info("[AiLife]   - 処理時間: {}ms", executionTime);
            logger.info("[AiLife]   - 出力ファイル: {}", outputFilePath);
            logger.info("[AiLife]   - エンティティ数: {}体", entityInfoList.size());
            
        } catch (Exception e) {
            logger.error("[AiLife] 完全エクスポートワークフロー中にエラーが発生しました", e);
            throw new RuntimeException("完全エクスポートワークフローの実行に失敗しました: " + e.getMessage(), e);
        }
    }

    /**
     * 管理者指示を設定
     * @param guidance 設定する指示内容
     * @return 設定に成功した場合はtrue
     */
    public static boolean setGuidance(String guidance) {
        if (guidance == null || guidance.length() > 500) {
            return false;
        }
        try {
            Path configDir = Paths.get("config");
            if (!Files.exists(configDir)) {
                Files.createDirectories(configDir);
            }
            Path guidanceFile = configDir.resolve("current_guidance.txt");
            Files.writeString(guidanceFile, guidance);
            return true;
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 管理者指示をクリア
     * @return クリアに成功した場合はtrue
     */
    public static boolean clearGuidance() {
        try {
            Path guidanceFile = Paths.get("config", "current_guidance.txt");
            Files.writeString(guidanceFile, "");
            return true;
        } catch (IOException e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * 現在の管理者指示を取得
     * @return 管理者指示の内容（設定されていない場合は空文字列）
     */
    public static String showGuidance() {
        try {
            Path guidanceFile = Paths.get("config", "current_guidance.txt");
            if (!Files.exists(guidanceFile)) {
                return "";
            }
            return Files.readString(guidanceFile);
        } catch (IOException e) {
            e.printStackTrace();
            return "";
        }
    }
} 