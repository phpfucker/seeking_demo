package jp.seekin.minecraft.ailife;

import net.minecraft.world.entity.Entity;
import net.minecraft.world.entity.EntityType;
import net.minecraft.world.level.Level;
import net.minecraft.core.BlockPos;
import net.minecraft.nbt.CompoundTag;
import java.util.UUID;
import java.util.List;
import java.util.ArrayList;
import java.util.Collections;
import java.time.Duration;

/**
 * AI生命体を表すエンティティクラス。
 * このクラスは以下の責務を持ちます：
 * - 生命体の基本属性（名前、性別、世代）の管理
 * - 家系関係（親、子）の追跡
 * - 行動履歴の記録
 * - 繁殖状態の管理
 */
public class AILifeEntity extends Entity {
    private static final Duration BREEDING_COOLDOWN = Duration.ofHours(1);
    
    private String name;
    private Gender gender;
    private int generation;
    private UUID parentA;
    private UUID parentB;
    private final List<UUID> children;
    private EntityState currentState;
    private final List<ActionRecord> actionHistory;
    private long lastBreedTime;
    private boolean readyToBreed;

    /**
     * 新しいAI生命体を作成します。
     * @param entityType エンティティタイプ
     * @param level ワールド
     */
    public AILifeEntity(EntityType<?> entityType, Level level) {
        super(entityType, level);
        this.children = new ArrayList<>();
        this.actionHistory = new ArrayList<>();
        this.lastBreedTime = 0;
        this.readyToBreed = false;
    }

    /**
     * アダムを作成します。
     * @param level ワールド
     * @param position 初期位置
     * @return 作成されたアダム
     */
    public static AILifeEntity createAdam(Level level, BlockPos position) {
        if (level == null || position == null) {
            throw new IllegalArgumentException("Level and position must not be null");
        }

        AILifeEntity adam = new AILifeEntity(EntityType.PLAYER, level);
        adam.setPos(position.getX(), position.getY(), position.getZ());
        adam.name = "Adam";
        adam.gender = Gender.MALE;
        adam.generation = 0;
        return adam;
    }

    /**
     * イブを作成します。
     * @param level ワールド
     * @param position 初期位置
     * @return 作成されたイブ
     */
    public static AILifeEntity createEve(Level level, BlockPos position) {
        if (level == null || position == null) {
            throw new IllegalArgumentException("Level and position must not be null");
        }

        AILifeEntity eve = new AILifeEntity(EntityType.PLAYER, level);
        eve.setPos(position.getX(), position.getY(), position.getZ());
        eve.name = "Eve";
        eve.gender = Gender.FEMALE;
        eve.generation = 0;
        return eve;
    }

    /**
     * 子孫を作成します。
     * @param level ワールド
     * @param position 初期位置
     * @param name 名前
     * @param gender 性別
     * @param parentA 親A
     * @param parentB 親B
     * @return 作成された子孫
     */
    public static AILifeEntity createOffspring(Level level, BlockPos position, 
            String name, Gender gender, AILifeEntity parentA, AILifeEntity parentB) {
        validateOffspringParameters(level, position, name, parentA, parentB);

        AILifeEntity offspring = new AILifeEntity(EntityType.PLAYER, level);
        offspring.setPos(position.getX(), position.getY(), position.getZ());
        offspring.name = name;
        offspring.gender = gender;
        offspring.generation = Math.max(parentA.generation, parentB.generation) + 1;
        offspring.parentA = parentA.getUUID();
        offspring.parentB = parentB.getUUID();

        parentA.addChild(offspring.getUUID());
        parentB.addChild(offspring.getUUID());

        return offspring;
    }

    private static void validateOffspringParameters(Level level, BlockPos position, 
            String name, AILifeEntity parentA, AILifeEntity parentB) {
        if (level == null || position == null || name == null || parentA == null || parentB == null) {
            throw new IllegalArgumentException("All parameters must not be null");
        }
        if (name.trim().isEmpty()) {
            throw new IllegalArgumentException("Name must not be empty");
        }
        if (parentA.gender == parentB.gender) {
            throw new IllegalArgumentException("Parents must have different genders");
        }
    }

    @Override
    protected void defineSynchedData() {
        // Minecraft エンティティの同期データを定義
    }

    @Override
    protected void readAdditionalSaveData(CompoundTag compound) {
        this.name = compound.getString("name");
        this.gender = Gender.valueOf(compound.getString("gender"));
        this.generation = compound.getInt("generation");
        this.parentA = compound.hasUUID("parentA") ? compound.getUUID("parentA") : null;
        this.parentB = compound.hasUUID("parentB") ? compound.getUUID("parentB") : null;
        this.lastBreedTime = compound.getLong("lastBreedTime");
        this.readyToBreed = compound.getBoolean("readyToBreed");
    }

    @Override
    protected void addAdditionalSaveData(CompoundTag compound) {
        compound.putString("name", this.name);
        compound.putString("gender", this.gender.name());
        compound.putInt("generation", this.generation);
        if (parentA != null) compound.putUUID("parentA", this.parentA);
        if (parentB != null) compound.putUUID("parentB", this.parentB);
        compound.putLong("lastBreedTime", this.lastBreedTime);
        compound.putBoolean("readyToBreed", this.readyToBreed);
    }

    /**
     * エンティティの状態を更新します。
     * @param newState 新しい状態
     * @throws IllegalArgumentException 状態がnullの場合
     */
    public void updateState(EntityState newState) {
        if (newState == null) {
            throw new IllegalArgumentException("State cannot be null");
        }
        this.currentState = newState;
        this.actionHistory.add(new ActionRecord(System.currentTimeMillis(), newState));
    }

    /**
     * 繁殖準備が整っているかを確認します。
     * @return 繁殖可能な場合true
     */
    public boolean isReadyToBreed() {
        if (!readyToBreed) return false;
        
        long currentTime = System.currentTimeMillis();
        Duration timeSinceLastBreed = Duration.ofMillis(currentTime - lastBreedTime);
        return timeSinceLastBreed.compareTo(BREEDING_COOLDOWN) > 0;
    }

    /**
     * 繁殖準備状態を設定します。
     * @param ready 準備状態
     */
    public void setReadyToBreed(boolean ready) {
        this.readyToBreed = ready;
        if (!ready) {
            this.lastBreedTime = System.currentTimeMillis();
        }
    }

    // Getters
    public String getName() { return name; }
    public Gender getGender() { return gender; }
    public int getGeneration() { return generation; }
    public UUID getParentA() { return parentA; }
    public UUID getParentB() { return parentB; }
    public List<UUID> getChildren() { return Collections.unmodifiableList(children); }
    public EntityState getCurrentState() { return currentState; }
    public List<ActionRecord> getActionHistory() { 
        return Collections.unmodifiableList(actionHistory); 
    }

    // Protected setters for testing
    protected void setName(String name) { this.name = name; }
    protected void setGender(Gender gender) { this.gender = gender; }
    protected void setGeneration(int generation) { this.generation = generation; }
    protected void setParentA(UUID parentA) { this.parentA = parentA; }
    protected void setParentB(UUID parentB) { this.parentB = parentB; }

    /**
     * 子供を追加します。
     * @param child 子供のUUID
     * @throws IllegalArgumentException UUIDがnullの場合
     */
    public void addChild(UUID child) {
        if (child == null) {
            throw new IllegalArgumentException("Child UUID cannot be null");
        }
        this.children.add(child);
    }

    @Override
    public String toString() {
        return String.format("AILifeEntity{name='%s', gender=%s, generation=%d}", 
            name, gender, generation);
    }
}



class ActionRecord {
    private final long timestamp;
    private final EntityState state;

    public ActionRecord(long timestamp, EntityState state) {
        this.timestamp = timestamp;
        this.state = state;
    }

    public long getTimestamp() { return timestamp; }
    public EntityState getState() { return state; }
} 