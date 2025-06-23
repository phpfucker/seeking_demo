package jp.seekin.minecraft.ailife;

import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.player.Player;
import net.minecraft.world.level.Level;
import net.minecraft.core.BlockPos;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.util.*;
import java.io.*;
import java.util.concurrent.ConcurrentHashMap;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * EntityManagerは、AI生命体の管理を担当するシングルトンクラスです。
 * このクラスは以下の責務を持ちます：
 * - AI生命体の登録と管理
 * - 繁殖ペアの検出
 * - エンティティデータの永続化
 * - 状態の JSON 形式でのエクスポート
 */
public class EntityManager {
    private static final Logger LOGGER = LoggerFactory.getLogger(EntityManager.class);
    private static final double BREEDING_DISTANCE = 10.0;
    private static EntityManager instance;
    
    private final ConcurrentHashMap<UUID, AILifeEntity> entities;
    private final Gson gson;
    private final EntityDataStorage storage;

    /**
     * テスト用のコンストラクタ。
     * @param storage エンティティデータストレージの実装
     */
    protected EntityManager(EntityDataStorage storage) {
        this.entities = new ConcurrentHashMap<>();
        this.gson = new GsonBuilder().setPrettyPrinting().create();
        this.storage = storage;
    }

    /**
     * シングルトンインスタンスを取得します。
     * @return EntityManagerのインスタンス
     */
    public static EntityManager getInstance() {
        if (instance == null) {
            instance = new EntityManager(new FileEntityDataStorage());
        }
        return instance;
    }

    /**
     * 新しいエンティティを登録します。
     * @param entity 登録するAI生命体
     * @throws IllegalArgumentException エンティティがnullの場合
     * @throws EntityStorageException データの保存に失敗した場合
     */
    public void registerEntity(AILifeEntity entity) {
        if (entity == null) {
            throw new IllegalArgumentException("Entity cannot be null");
        }
        
        entities.put(entity.getUUID(), entity);
        try {
            storage.saveEntityData(entity);
        } catch (IOException e) {
            throw new EntityStorageException("Failed to save entity data", e);
        }
    }

    /**
     * 指定されたUUIDのエンティティを取得します。
     * @param id 検索するエンティティのUUID
     * @return エンティティを含むOptional
     */
    public Optional<AILifeEntity> getEntity(UUID id) {
        return Optional.ofNullable(entities.get(id));
    }

    /**
     * 登録されている全エンティティのコレクションを取得します。
     * @return 不変のエンティティコレクション
     */
    public Collection<AILifeEntity> getAllEntities() {
        return Collections.unmodifiableCollection(entities.values());
    }

    /**
     * エンティティの状態を更新します。
     * @param id 更新するエンティティのUUID
     * @param newState 新しい状態
     * @throws EntityNotFoundException エンティティが見つからない場合
     * @throws EntityStorageException 状態の保存に失敗した場合
     */
    public void updateEntityState(UUID id, EntityState newState) {
        AILifeEntity entity = entities.get(id);
        if (entity == null) {
            throw new EntityNotFoundException("Entity not found: " + id);
        }

        entity.updateState(newState);
        try {
            storage.saveEntityData(entity);
        } catch (IOException e) {
            throw new EntityStorageException("Failed to save entity state", e);
        }
    }

    /**
     * 繁殖可能なペアを検索します。
     * 繁殖条件：
     * - 両方のエンティティが繁殖準備完了状態
     * - 異なる性別
     * - 指定された距離以内に存在
     * @return 繁殖可能なペアのリスト
     */
    public List<BreedingPair> findBreedingPairs() {
        List<BreedingPair> breedingPairs = new ArrayList<>();
        
        entities.values().stream()
            .filter(AILifeEntity::isReadyToBreed)
            .forEach(e1 -> {
                entities.values().stream()
                    .filter(e2 -> isValidBreedingPartner(e1, e2))
                    .findFirst()
                    .ifPresent(e2 -> breedingPairs.add(new BreedingPair(e1, e2)));
            });
        
        return breedingPairs;
    }

    /**
     * 現在の状態をJSON形式で生成します。
     * @return 状態を表すJSON文字列
     */
    public String generateStateJson() {
        Map<String, Object> state = new HashMap<>();
        state.put("timestamp", System.currentTimeMillis());
        state.put("entities", new ArrayList<>(entities.values()));
        
        return gson.toJson(state);
    }

    /**
     * 繁殖パートナーとして有効かどうかを判定します。
     * @param e1 第1エンティティ
     * @param e2 第2エンティティ
     * @return 繁殖可能な場合true
     */
    private boolean isValidBreedingPartner(AILifeEntity e1, AILifeEntity e2) {
        return e2.isReadyToBreed() 
            && !e2.equals(e1)
            && e2.getGender() != e1.getGender()
            && e1.getPosition().distanceTo(e2.getPosition()) < BREEDING_DISTANCE;
    }

    /**
     * テスト用にエンティティマネージャーをリセットします。
     */
    protected static void resetForTesting() {
        instance = null;
    }
}

/**
 * 繁殖ペアを表すイミュータブルなクラス。
 */
class BreedingPair {
    private final AILifeEntity entityA;
    private final AILifeEntity entityB;

    public BreedingPair(AILifeEntity entityA, AILifeEntity entityB) {
        this.entityA = entityA;
        this.entityB = entityB;
    }

    public AILifeEntity getEntityA() { return entityA; }
    public AILifeEntity getEntityB() { return entityB; }
}

/**
 * エンティティデータの永続化を担当するインターフェース。
 */
interface EntityDataStorage {
    void saveEntityData(AILifeEntity entity) throws IOException;
    Optional<AILifeEntity> loadEntityData(UUID id) throws IOException;
}

/**
 * ファイルベースのエンティティデータストレージ実装。
 */
class FileEntityDataStorage implements EntityDataStorage {
    private static final String DATA_DIR = "entity_data";
    private final Gson gson = new GsonBuilder().setPrettyPrinting().create();

    @Override
    public void saveEntityData(AILifeEntity entity) throws IOException {
        File dataDir = new File(DATA_DIR);
        if (!dataDir.exists() && !dataDir.mkdir()) {
            throw new IOException("Failed to create data directory");
        }

        File entityFile = new File(dataDir, entity.getUUID().toString() + ".json");
        try (FileWriter writer = new FileWriter(entityFile)) {
            gson.toJson(entity, writer);
        }
    }

    @Override
    public Optional<AILifeEntity> loadEntityData(UUID id) throws IOException {
        File entityFile = new File(DATA_DIR, id.toString() + ".json");
        if (!entityFile.exists()) {
            return Optional.empty();
        }

        try (FileReader reader = new FileReader(entityFile)) {
            return Optional.of(gson.fromJson(reader, AILifeEntity.class));
        }
    }
}

/**
 * エンティティ関連の例外クラス。
 */
class EntityNotFoundException extends RuntimeException {
    public EntityNotFoundException(String message) {
        super(message);
    }
}

class EntityStorageException extends RuntimeException {
    public EntityStorageException(String message, Throwable cause) {
        super(message, cause);
    }
} 