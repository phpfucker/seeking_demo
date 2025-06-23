package jp.seekin.minecraft.ailife;

import com.google.gson.*;
import net.minecraft.core.BlockPos;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.AABB;
import net.minecraft.world.phys.Vec3;
import org.apache.logging.log4j.Logger;

import java.io.File;
import java.io.FileReader;
import java.nio.charset.StandardCharsets;

/**
 * AI生命体エンティティのスポーン管理を担当するクラス
 * 
 * <p>このクラスは以下の責任を持ちます：</p>
 * <ul>
 *   <li>JSONファイルからエンティティデータの読み込み</li>
 *   <li>エンティティの重複チェック</li>
 *   <li>エンティティのワールドへのスポーン</li>
 *   <li>カスタムスキン・アニメーションの適用</li>
 * </ul>
 * 
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */
public class EntitySpawnManager {
    
    private final Logger logger;
    private static final double WORLD_BORDER = 30000000.0;
    private static final double WORLD_HEIGHT = 256.0;
    
    /**
     * EntitySpawnManagerのコンストラクタ
     * 
     * @param logger ログ出力用のLoggerインスタンス
     */
    public EntitySpawnManager(Logger logger) {
        this.logger = logger;
    }
    
    /**
     * generated_entities.jsonを読み込み、AI生命体をワールドにスポーンする
     * 
     * @param world 対象のサーバーワールド
     * @return スポーン結果（成功数、スキップ数）
     */
    public SpawnResult spawnEntitiesFromJson(ServerLevel world) {
        logger.info("[AiLife] EntitySpawnManager: エンティティスポーン処理を開始します");
        
        try {
            // Step 1: JSONファイルの存在確認
            File jsonFile = new File("config/generated_entities.json");
            if (!jsonFile.exists()) {
                logger.warn("[AiLife] generated_entities.json が見つかりません。AI生命体のスポーンをスキップします");
                return new SpawnResult(0, 0);
            }

            // Step 2: JSONファイルの読み込みとパース
            JsonArray entities;
            try (FileReader reader = new FileReader(jsonFile, StandardCharsets.UTF_8)) {
                entities = JsonParser.parseReader(reader).getAsJsonArray();
                logger.info("[AiLife] generated_entities.json の読み込みが完了しました（{}体のデータを検出）", entities.size());
            }

            logger.info("[AiLife] === AI生命体スポーン処理開始 ===");

            // Step 3: 各AI生命体データの処理
            int spawnedCount = 0;
            int skippedCount = 0;
            
            for (JsonElement elem : entities) {
                try {
                    JsonObject entity = elem.getAsJsonObject();
                    
                    // 必須フィールドの取得とバリデーション
                    String id = EntityUtils.getRequiredJsonString(entity, "entity_id", "個体ID");
                    String name = EntityUtils.getRequiredJsonString(entity, "name", "個体名");
                    String gender = EntityUtils.getRequiredJsonString(entity, "gender", "性別");
                    String model = EntityUtils.getRequiredJsonString(entity, "model", "モデル");

                    logger.debug("[AiLife] 個体処理開始: ID={}, 名前={}, 性別={}, モデル={}", id, name, gender, model);

                    // Step 4: エンティティタイプの決定
                    EntityType<? extends LivingEntity> entityType = EntityUtils.determineEntityType(model);
                    if (entityType == null) {
                        logger.warn("[AiLife] 未対応モデル '{}' のため、個体 '{}' をスキップします", model, id);
                        skippedCount++;
                        continue;
                    }

                    // Step 5: 重複チェック（既存エンティティの確認）
                    if (isEntityAlreadySpawned(world, name)) {
                        logger.info("[AiLife] 個体 '{}' は既にスポーン済みのためスキップします", name);
                        skippedCount++;
                        continue;
                    }

                    // Step 6: エンティティのスポーン実行
                    LivingEntity spawnedEntity = spawnEntity(world, entityType, id, name);
                    if (spawnedEntity == null) {
                        logger.error("[AiLife] 個体 '{}' のスポーンに失敗しました", id);
                        skippedCount++;
                        continue;
                    }

                    // Step 7: カスタムスキン・アニメーションの適用
                    applyCustomAppearance(spawnedEntity, entity, id);

                    logger.info("[AiLife] 個体 '{}' を正常にスポーンしました（座標: {}, {}, {}）", 
                        id, spawnedEntity.getX(), spawnedEntity.getY(), spawnedEntity.getZ());
                    spawnedCount++;
                    
                } catch (Exception entityError) {
                    logger.error("[AiLife] 個体データの処理中にエラーが発生しました", entityError);
                    skippedCount++;
                }
            }

            logger.info("[AiLife] === AI生命体スポーン処理完了 ===");
            logger.info("[AiLife] スポーン成功: {}体, スキップ: {}体", spawnedCount, skippedCount);
            
            return new SpawnResult(spawnedCount, skippedCount);

        } catch (Exception e) {
            logger.error("[AiLife] AI生命体スポーン処理中に予期しないエラーが発生しました", e);
            return new SpawnResult(0, 0);
        }
    }
    
    /**
     * 指定された名前のエンティティが既にワールドにスポーンされているかチェックする
     * 
     * @param world 対象のサーバーワールド
     * @param entityName チェックする個体名
     * @return 既にスポーン済みの場合true、そうでなければfalse
     */
    private boolean isEntityAlreadySpawned(ServerLevel world, String entityName) {
        // ワールド全体をカバーするAABBを作成
        AABB searchArea = new AABB(-WORLD_BORDER, 0, -WORLD_BORDER, WORLD_BORDER, WORLD_HEIGHT, WORLD_BORDER);
        
        // カスタム名が一致するエンティティを検索
        return world.getEntitiesOfClass(LivingEntity.class, searchArea, entity -> {
            if (entity == null || entity.getCustomName() == null) {
                return false;
            }
            return entity.getCustomName().getString().equals(entityName);
        }).size() > 0;
    }
    
    /**
     * エンティティをワールドにスポーンする
     * 
     * @param world 対象のサーバーワールド
     * @param entityType スポーンするエンティティタイプ
     * @param entityId 個体ID
     * @param entityName 個体名
     * @return スポーンされたエンティティ、失敗した場合はnull
     */
    private LivingEntity spawnEntity(ServerLevel world, EntityType<? extends LivingEntity> entityType, 
                                   String entityId, String entityName) {
        try {
            // スポーン位置の決定（ワールドスポーン地点付近にランダム配置）
            BlockPos worldSpawn = world.getSharedSpawnPos();
            int offsetX = world.random.nextInt(10) - 5; // -5から+4の範囲
            int offsetZ = world.random.nextInt(10) - 5; // -5から+4の範囲
            BlockPos spawnPos = worldSpawn.offset(offsetX, 0, offsetZ);

            // エンティティの作成
            LivingEntity entity = entityType.create(world);
            if (entity == null) {
                logger.error("[AiLife] エンティティタイプ '{}' でのエンティティ作成に失敗しました", entityType);
                return null;
            }

            // エンティティの設定
            entity.setPos(Vec3.atBottomCenterOf(spawnPos));
            entity.setCustomName(net.minecraft.network.chat.Component.literal(entityName));
            entity.setCustomNameVisible(true);

            // ワールドに追加
            world.addFreshEntity(entity);
            
            return entity;
            
        } catch (Exception e) {
            logger.error("[AiLife] エンティティ '{}' のスポーン中にエラーが発生しました", entityId, e);
            return null;
        }
    }
    
    /**
     * エンティティにカスタムスキンとアニメーションを適用する
     * 
     * @param entity 対象のエンティティ
     * @param entityData 個体データのJSONオブジェクト
     * @param entityId 個体ID（ログ出力用）
     */
    private void applyCustomAppearance(LivingEntity entity, JsonObject entityData, String entityId) {
        // スキンの適用
        if (entityData.has("skin")) {
            String skin = entityData.get("skin").getAsString();
            if (skin != null && !skin.trim().isEmpty()) {
                entity.getPersistentData().putString("Skin", skin.trim());
                logger.debug("[AiLife] 個体 '{}' にスキン '{}' を適用しました", entityId, skin);
            }
        }

        // アニメーションの適用
        if (entityData.has("animation")) {
            String animation = entityData.get("animation").getAsString();
            if (animation != null && !animation.trim().isEmpty()) {
                entity.getPersistentData().putString("Animation", animation.trim());
                logger.debug("[AiLife] 個体 '{}' にアニメーション '{}' を適用しました", entityId, animation);
            }
        }

        // 特性データの適用（5.1.3拡張機能）
        applyCharacteristicsData(entity, entityData, entityId);

        // 詳細ログの出力
        String name = entityData.has("name") ? entityData.get("name").getAsString() : "不明";
        String gender = entityData.has("gender") ? entityData.get("gender").getAsString() : "不明";
        String model = entityData.has("model") ? entityData.get("model").getAsString() : "不明";
        String skin = entityData.has("skin") ? entityData.get("skin").getAsString() : "なし";
        String animation = entityData.has("animation") ? entityData.get("animation").getAsString() : "なし";
        
        logger.info("[AiLife] 個体詳細 - ID: {}, 名前: {}, 性別: {}, モデル: {}, スキン: {}, アニメーション: {}", 
            entityId, name, gender, model, skin, animation);
    }

    /**
     * エンティティに特性データ（behavior, sociality, lifespan）をNBTタグに保存する
     * 
     * <p>5.1.3拡張機能: generated_entities.jsonから特性データを読み取り、
     * エンティティのNBTタグに保存します。</p>
     * 
     * <p>保存されるNBTタグ:</p>
     * <ul>
     *   <li>"Behavior" - 行動特性（curious, passive, aggressive等）</li>
     *   <li>"Sociality" - 社会性（leader, herd, loner等）</li>
     *   <li>"Lifespan" - 寿命（整数値）</li>
     * </ul>
     * 
     * <p>エラーハンドリング:</p>
     * <ul>
     *   <li>特性データが欠損している場合: 警告ログを出力し、スポーン処理を続行</li>
     *   <li>空文字列やnull値: NBTに保存せず、ログに記録</li>
     * </ul>
     * 
     * @param entity 対象のエンティティ
     * @param entityData 個体データのJSONオブジェクト
     * @param entityId 個体ID（ログ出力用）
     * @since 1.0.0
     */
    public void applyCharacteristicsData(LivingEntity entity, JsonObject entityData, String entityId) {
        logger.debug("[AiLife] 個体 '{}' の特性データ適用を開始します", entityId);
        
        boolean hasAnyCharacteristics = false;
        
        // Behavior（行動特性）の適用
        if (entityData.has("behavior")) {
            String behavior = entityData.get("behavior").getAsString();
            if (behavior != null && !behavior.trim().isEmpty()) {
                entity.getPersistentData().putString("Behavior", behavior.trim());
                logger.debug("[AiLife] 個体 '{}' に行動特性 '{}' を適用しました", entityId, behavior);
                hasAnyCharacteristics = true;
            } else {
                logger.debug("[AiLife] 個体 '{}' の行動特性が空文字列またはnullのため、NBTに保存しません", entityId);
            }
        } else {
            logger.warn("[AiLife] 個体 '{}' のJSONデータに行動特性（behavior）が含まれていません", entityId);
        }
        
        // Sociality（社会性）の適用
        if (entityData.has("sociality")) {
            String sociality = entityData.get("sociality").getAsString();
            if (sociality != null && !sociality.trim().isEmpty()) {
                entity.getPersistentData().putString("Sociality", sociality.trim());
                logger.debug("[AiLife] 個体 '{}' に社会性 '{}' を適用しました", entityId, sociality);
                hasAnyCharacteristics = true;
            } else {
                logger.debug("[AiLife] 個体 '{}' の社会性が空文字列またはnullのため、NBTに保存しません", entityId);
            }
        } else {
            logger.warn("[AiLife] 個体 '{}' のJSONデータに社会性（sociality）が含まれていません", entityId);
        }
        
        // Lifespan（寿命）の適用
        if (entityData.has("lifespan")) {
            try {
                int lifespan = entityData.get("lifespan").getAsInt();
                if (lifespan > 0) {
                    entity.getPersistentData().putInt("Lifespan", lifespan);
                    logger.debug("[AiLife] 個体 '{}' に寿命 '{}' を適用しました", entityId, lifespan);
                    hasAnyCharacteristics = true;
                } else {
                    logger.debug("[AiLife] 個体 '{}' の寿命が0以下のため、NBTに保存しません: {}", entityId, lifespan);
                }
            } catch (Exception e) {
                logger.warn("[AiLife] 個体 '{}' の寿命データの解析に失敗しました: {}", entityId, e.getMessage());
            }
        } else {
            logger.warn("[AiLife] 個体 '{}' のJSONデータに寿命（lifespan）が含まれていません", entityId);
        }
        
        // 適用結果のサマリーログ
        if (hasAnyCharacteristics) {
            logger.info("[AiLife] 個体 '{}' の特性データ適用が完了しました", entityId);
        } else {
            logger.warn("[AiLife] 個体 '{}' には有効な特性データが含まれていませんでした", entityId);
        }
    }
    
    /**
     * スポーン結果を格納する内部クラス
     */
    public static class SpawnResult {
        private final int spawnedCount;
        private final int skippedCount;
        
        public SpawnResult(int spawnedCount, int skippedCount) {
            this.spawnedCount = spawnedCount;
            this.skippedCount = skippedCount;
        }
        
        public int getSpawnedCount() { return spawnedCount; }
        public int getSkippedCount() { return skippedCount; }
    }
} 