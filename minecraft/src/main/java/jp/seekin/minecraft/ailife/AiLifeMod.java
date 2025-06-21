package jp.seekin.minecraft.ailife;

import com.google.gson.*;
import net.minecraftforge.fml.common.Mod;
import net.minecraftforge.event.server.ServerStartingEvent;
import net.minecraftforge.eventbus.api.SubscribeEvent;
import net.minecraftforge.common.MinecraftForge;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import net.minecraft.server.MinecraftServer;
import net.minecraft.server.level.ServerLevel;
import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.entity.LivingEntity;
import net.minecraft.world.entity.Mob;
import net.minecraft.world.entity.npc.Villager;
import net.minecraft.world.entity.monster.Witch;
import net.minecraft.world.level.Level;
import net.minecraft.core.BlockPos;
import net.minecraft.world.phys.Vec3;
import net.minecraft.world.phys.AABB;
import java.util.UUID;

import java.io.File;
import java.io.FileReader;
import java.nio.charset.StandardCharsets;

/**
 * generated_entities.jsonを読み込み、内容をサーバーログに出力する最小限のMOD
 *
 * - config/generated_entities.json を参照
 * - サーバー起動時に内容を出力
 *
 * MOD ID: ailife
 *
 * 使い方:
 * 1. config/generated_entities.json に個体データ（アダム・イヴ等）を配置
 * 2. サーバーを起動すると、内容がログに出力される
 *
 * このクラスはデータ取得の動作確認用の最小雛形です。
 */
@Mod("ailife")
public class AiLifeMod {
    // Forge推奨のロガー定義
    public static final Logger LOGGER = LogManager.getLogger();

    // ワールド全体をカバーするAABB用定数
    private static final double WORLD_BORDER = 30000000.0;
    private static final double WORLD_HEIGHT = 256.0;

    /**
     * MOD初期化時の処理（現状は何もしない）
     */
    public AiLifeMod() {
        // MOD初期化時の処理
        MinecraftForge.EVENT_BUS.register(this);
    }

    /**
     * サーバー起動時にgenerated_entities.jsonを読み込み、内容をログ出力する
     *
     * @param event サーバー起動イベント
     */
    @SubscribeEvent
    public void onServerStarting(ServerStartingEvent event) {
        try {
            // configディレクトリのgenerated_entities.jsonを参照
            File jsonFile = new File("config/generated_entities.json");
            if (!jsonFile.exists()) {
                LOGGER.info("[AiLife] generated_entities.json が見つかりません");
                return;
            }
            // JSONファイルをパース
            JsonArray entities = JsonParser.parseReader(new FileReader(jsonFile, StandardCharsets.UTF_8)).getAsJsonArray();
            LOGGER.info("[AiLife] === generated_entities.json の内容 ===");
            // 各個体データを出力＆スポーン
            ServerLevel world = event.getServer().getLevel(Level.OVERWORLD);
            if (world == null) {
                LOGGER.error("[AiLife] ServerLevelが取得できません");
                return;
            }
            for (JsonElement elem : entities) {
                JsonObject entity = elem.getAsJsonObject();
                String id = entity.get("entity_id").getAsString();
                String name = entity.get("name").getAsString();
                String gender = entity.get("gender").getAsString();
                String model = entity.get("model").getAsString();
                // ループごとに詳細デバッグログ
                LOGGER.info(String.format("[AiLife][DEBUG] id=%s, name=%s, gender=%s, model=%s, world=%s", id, name, gender, model, world));

                // モデル名でバニラエンティティを判定（例: villager, witch）
                EntityType<? extends LivingEntity> type = null;
                if (model.contains("villager")) {
                    type = EntityType.VILLAGER;
                } else if (model.contains("witch")) {
                    type = EntityType.WITCH;
                } else {
                    LOGGER.warn(String.format("[AiLife] 未対応モデル: %s のためスポーンしません", model));
                    continue;
                }
                LOGGER.info(String.format("[AiLife][DEBUG] id=%s, type=%s", id, type));

                // 既に同じIDのエンティティが存在するかチェック（UUIDタグやカスタム名で判定）
                AABB allArea = new AABB(-WORLD_BORDER, 0, -WORLD_BORDER, WORLD_BORDER, WORLD_HEIGHT, WORLD_BORDER);
                boolean alreadyExists = world.getEntitiesOfClass(LivingEntity.class, allArea, e -> {
                    if (e == null) return false;
                    if (e.getCustomName() == null) return false;
                    return e.getCustomName().getString().equals(id);
                }).size() > 0;
                if (alreadyExists) {
                    LOGGER.info(String.format("[AiLife] ID: %s は既にスポーン済みのためスキップ", id));
                    continue;
                }

                // デバッグ用: type, world, modelの値を出力
                if (type == null) {
                    LOGGER.error(String.format("[AiLife] ID: %s モデル: %s でEntityTypeがnull", id, model));
                    continue;
                }
                if (world == null) {
                    LOGGER.error(String.format("[AiLife] ID: %s モデル: %s でServerLevelがnull", id, model));
                    continue;
                }

                // スポーン位置（ワールドスポーン地点付近にランダム配置）
                BlockPos spawnPos = world.getSharedSpawnPos().offset(world.random.nextInt(5)-2, 0, world.random.nextInt(5)-2);
                LivingEntity spawned = type.create(world);
                if (spawned == null) {
                    LOGGER.error(String.format("[AiLife] ID: %s モデル: %s EntityType: %s でスポーンに失敗（spawned==null）", id, model, type));
                    continue;
                }
                spawned.setPos(Vec3.atBottomCenterOf(spawnPos));
                spawned.setCustomName(net.minecraft.network.chat.Component.literal(id));
                spawned.setCustomNameVisible(true);
                // skin, animationフィールドを取得（なければnull）
                String skin = entity.has("skin") ? entity.get("skin").getAsString() : null;
                String animation = entity.has("animation") ? entity.get("animation").getAsString() : null;
                LOGGER.info(String.format("[AiLife] ID: %s, 名前: %s, 性別: %s, モデル: %s, スキン: %s, アニメーション: %s", id, name, gender, model, skin, animation));
                // skin, animationをNBTに保存（EMF/ETF/Fresh Animations連携用）
                if (skin != null && !skin.isEmpty()) {
                    spawned.getPersistentData().putString("Skin", skin);
                    LOGGER.info(String.format("[AiLife] ID: %s にスキン '%s' を適用", id, skin));
                }
                if (animation != null && !animation.isEmpty()) {
                    spawned.getPersistentData().putString("Animation", animation);
                    LOGGER.info(String.format("[AiLife] ID: %s にアニメーション '%s' を適用", id, animation));
                }
                world.addFreshEntity(spawned);
                LOGGER.info(String.format("[AiLife] ID: %s をスポーンしました（%s, %s, %s）", id, spawnPos.getX(), spawnPos.getY(), spawnPos.getZ()));
            }
        } catch (Exception e) {
            // エラー発生時はスタックトレースを出力
            LOGGER.error("[AiLife] generated_entities.json の読み込み中にエラー", e);
        }
    }
} 