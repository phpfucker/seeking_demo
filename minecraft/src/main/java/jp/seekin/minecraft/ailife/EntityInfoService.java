package jp.seekin.minecraft.ailife;

import com.google.gson.JsonObject;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.level.Level;
import net.minecraft.world.phys.AABB;
import org.apache.logging.log4j.Logger;

import java.util.ArrayList;
import java.util.List;

/**
 * AI生命体エンティティの情報取得・抽出を担当するクラス
 * 
 * <p>このクラスは以下の責任を持ちます：</p>
 * <ul>
 *   <li>ワールド内のAI生命体エンティティの検索</li>
 *   <li>エンティティの詳細情報抽出</li>
 *   <li>位置情報、DNA、性別などのデータ取得</li>
 * </ul>
 * 
 * @author seekin development team
 * @version 1.0.0
 * @since 1.0.0
 */
public class EntityInfoService {
    
    private final Logger logger;
    private static final double WORLD_BORDER = 30000000.0;
    private static final double WORLD_HEIGHT = 256.0;
    
    /**
     * EntityInfoServiceのコンストラクタ
     * 
     * @param logger ログ出力用のLoggerインスタンス
     */
    public EntityInfoService(Logger logger) {
        this.logger = logger;
    }
    
    /**
     * 現在スポーンしているAI生命体エンティティの情報を取得する
     * 
     * <p>この機能は以下の情報を取得します：</p>
     * <ul>
     *   <li>エンティティID（カスタム名）</li>
     *   <li>性別情報（NBTデータから取得）</li>
     *   <li>DNA情報（NBTデータから取得）</li>
     *   <li>特性データ（behavior, sociality, lifespan）（NBTデータから取得）</li>
     *   <li>リアルタイム位置情報（現在のワールド座標）</li>
     * </ul>
     * 
     * @return AI生命体エンティティの情報リスト
     */
    public List<JsonObject> getCurrentAiLifeEntitiesInformation() {
        logger.info("[AiLife] EntityInfoService: AI生命体エンティティ情報取得を開始します");
        
        List<JsonObject> entityInfoList = new ArrayList<>();
        
        try {
            // サーバーインスタンスの取得
            MinecraftServer server = net.minecraftforge.server.ServerLifecycleHooks.getCurrentServer();
            if (server == null) {
                logger.warn("[AiLife] サーバーインスタンスが取得できません");
                return entityInfoList;
            }
            
            // オーバーワールドの取得
            ServerLevel world = server.getLevel(Level.OVERWORLD);
            if (world == null) {
                logger.warn("[AiLife] オーバーワールドが取得できません");
                return entityInfoList;
            }
            
            // ワールド全体をカバーするAABBを作成
            AABB searchArea = new AABB(-WORLD_BORDER, 0, -WORLD_BORDER, WORLD_BORDER, WORLD_HEIGHT, WORLD_BORDER);
            
            // AI生命体エンティティ（カスタム名を持つLivingEntity）を検索
            List<LivingEntity> aiLifeEntities = world.getEntitiesOfClass(
                LivingEntity.class, 
                searchArea, 
                entity -> {
                    // カスタム名を持つエンティティのみを対象とする
                    if (entity == null || entity.getCustomName() == null) {
                        return false;
                    }
                    
                    // AI生命体として識別されるエンティティ（adam, eveなど）
                    String customName = entity.getCustomName().getString();
                    return customName != null && !customName.trim().isEmpty();
                }
            );
            
            logger.info("[AiLife] {}体のAI生命体エンティティを検出しました", aiLifeEntities.size());
            
            // 各エンティティの詳細情報を取得
            for (LivingEntity entity : aiLifeEntities) {
                try {
                    JsonObject entityInfo = extractEntityInformation(entity);
                    if (entityInfo != null) {
                        entityInfoList.add(entityInfo);
                        
                        String entityId = entityInfo.get("entity_id").getAsString();
                        JsonObject position = entityInfo.getAsJsonObject("position");
                        logger.debug("[AiLife] エンティティ情報取得完了: ID={}, 座標=({}, {}, {})", 
                            entityId, position.get("x"), position.get("y"), position.get("z"));
                    }
                } catch (Exception e) {
                    logger.error("[AiLife] エンティティ情報の取得中にエラーが発生しました", e);
                }
            }
            
            logger.info("[AiLife] EntityInfoService: AI生命体エンティティ情報取得完了: {}体", entityInfoList.size());
            
        } catch (Exception e) {
            logger.error("[AiLife] AI生命体エンティティ情報取得中に予期しないエラーが発生しました", e);
        }
        
        return entityInfoList;
    }
    
    /**
     * 単一のエンティティから詳細情報を抽出する
     * 
     * @param entity 対象のLivingEntity
     * @return エンティティ情報のJSONオブジェクト、取得に失敗した場合はnull
     */
    public JsonObject extractEntityInformation(LivingEntity entity) {
        try {
            JsonObject entityInfo = new JsonObject();
            
            // エンティティID（カスタム名）
            String entityId = entity.getCustomName().getString();
            entityInfo.addProperty("entity_id", entityId);
            
            // リアルタイム位置情報
            JsonObject position = new JsonObject();
            position.addProperty("x", entity.getX());
            position.addProperty("y", entity.getY());
            position.addProperty("z", entity.getZ());
            entityInfo.add("position", position);
            
            // NBTデータから性別情報を取得
            String gender = entity.getPersistentData().getString("Gender");
            if (gender == null || gender.trim().isEmpty()) {
                // NBTに保存されていない場合は、初期データから推測
                gender = DnaUtils.inferGenderFromEntityId(entityId);
            }
            entityInfo.addProperty("gender", gender);
            
            // NBTデータからDNA情報を取得
            String dna = entity.getPersistentData().getString("DNA");
            if (dna == null || dna.trim().isEmpty()) {
                // NBTに保存されていない場合は、初期データから推測
                dna = DnaUtils.inferDnaFromEntityId(entityId);
            }
            entityInfo.addProperty("dna", dna);
            
            // NBTデータから特性データを取得（5.1.4拡張）
            String behavior = entity.getPersistentData().getString("Behavior");
            if (behavior != null && !behavior.trim().isEmpty()) {
                entityInfo.addProperty("behavior", behavior);
            }
            
            String sociality = entity.getPersistentData().getString("Sociality");
            if (sociality != null && !sociality.trim().isEmpty()) {
                entityInfo.addProperty("sociality", sociality);
            }
            
            int lifespan = entity.getPersistentData().getInt("Lifespan");
            if (lifespan > 0) {
                entityInfo.addProperty("lifespan", lifespan);
            }
            
            // 追加情報（デバッグ用）
            entityInfo.addProperty("entity_type", entity.getType().toString());
            entityInfo.addProperty("health", entity.getHealth());
            entityInfo.addProperty("max_health", entity.getMaxHealth());
            
            return entityInfo;
            
        } catch (Exception e) {
            logger.error("[AiLife] エンティティ情報抽出中にエラーが発生しました: {}", entity.getCustomName(), e);
            return null;
        }
    }
} 