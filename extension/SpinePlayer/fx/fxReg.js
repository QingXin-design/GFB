// 无职转生特效注册表 特效统一用编号命名 cn只描述特效的颜色
export const FX_CAT_CN = {
  "atk": "攻击",
  "beatk": "受击",
  "special": "必杀",
  "magic": "魔法",
  "core": "核心爆发",
  "world": "场地",
  "shield": "护盾",
  "buff": "状态",
  "pet": "召唤",
  "team": "团队",
  "misc": "其他",
};

// id: { cat: 类别, cn: 颜色, clip: 动画名, dur: 时长(秒,可选), fadeSlots: 需要提前淡出的槽 }
export const FX_REG = {
  "001": { cat: "atk", cn: "金", clip: "idle" },   // 攻击·轻
  "002": { cat: "atk", cn: "青", clip: "idle" },   // 攻击·中
  "003": { cat: "atk", cn: "绿", clip: "idle" },   // 攻击·重
  "004": { cat: "atk", cn: "红", clip: "idle" },   // 攻击·突
  "005": { cat: "beatk", cn: "黄", clip: "idle" },   // 受击·轻
  "006": { cat: "beatk", cn: "橙", clip: "idle", blend: "normal" },   // 受击·爆
  "007": { cat: "beatk", cn: "蓝", clip: "idle" },   // 受击·颤
  "008": { cat: "beatk", cn: "绿", clip: "idle" },   // 受击·裂
  "009": { cat: "beatk", cn: "蓝", clip: "idle" },   // 受击·中
  "010": { cat: "beatk", cn: "金", clip: "idle" },   // 受击·重
  "011": { cat: "special", cn: "紫", clip: "idle" },   // 必杀①段
  "012": { cat: "special", cn: "粉", clip: "idle" },   // 必杀②段
  "013": { cat: "special", cn: "紫", clip: "idle" },   // 必杀③段
  "014": { cat: "special", cn: "橙", clip: "idle" },   // 必杀·斩1
  "015": { cat: "special", cn: "橙", clip: "idle" },   // 必杀·斩2
  "016": { cat: "special", cn: "金", clip: "idle" },   // 必杀·焰1
  "017": { cat: "special", cn: "金", clip: "idle" },   // 必杀·焰2
  "018": { cat: "special", cn: "红", clip: "idle" },   // 必杀·雷1
  "019": { cat: "special", cn: "金", clip: "idle" },   // 必杀·雷2
  "020": { cat: "special", cn: "金", clip: "idle" },   // 必杀·雷3
  "021": { cat: "special", cn: "红", clip: "idle" },   // 必杀·灭1
  "022": { cat: "special", cn: "金", clip: "idle" },   // 必杀·灭2
  "023": { cat: "magic", cn: "紫", clip: "idle" },   // 魔法·初
  "024": { cat: "magic", cn: "青", clip: "idle" },   // 魔法·风
  "025": { cat: "magic", cn: "橙", clip: "idle" },   // 魔法·火
  "026": { cat: "magic", cn: "紫", clip: "idle" },   // 魔法·水
  "027": { cat: "magic", cn: "金", clip: "idle" },   // 魔法·冰
  "028": { cat: "magic", cn: "蓝", clip: "idle" },   // 魔法·雷
  "029": { cat: "magic", cn: "橙", clip: "idle" },   // 魔法·土
  "030": { cat: "magic", cn: "紫", clip: "idle" },   // 魔法·光
  "031": { cat: "magic", cn: "金", clip: "idle" },   // 魔法·暗
  "032": { cat: "magic", cn: "青", clip: "idle" },   // 魔法·时
  "033": { cat: "magic", cn: "金", clip: "idle" },   // 魔法·空
  "034": { cat: "magic", cn: "紫", clip: "idle" },   // 魔法·幻
  "035": { cat: "magic", cn: "金", clip: "idle" },   // 魔法·大初
  "036": { cat: "magic", cn: "蓝", clip: "idle" },   // 魔法·大风
  "037": { cat: "magic", cn: "金", clip: "idle", fadeSlots: ["fazhen", "fazhen_lg"] },   // 魔法·大火
  "038": { cat: "magic", cn: "蓝", clip: "idle" },   // 魔法·大水
  "039": { cat: "magic", cn: "蓝", clip: "idle" },   // 魔法·大冰
  "040": { cat: "magic", cn: "金", clip: "idle" },   // 魔法·大雷
  "041": { cat: "magic", cn: "黑", clip: "idle", blend: "normal" },   // 魔法·大土
  "042": { cat: "magic", cn: "蓝", clip: "idle" },   // 技能·通用
  "043": { cat: "core", cn: "青", clip: "idle" },   // 核心·爆1
  "044": { cat: "core", cn: "紫", clip: "idle" },   // 核心·爆2
  "045": { cat: "core", cn: "黄", clip: "idle" },   // 核心·爆3
  "046": { cat: "core", cn: "红", clip: "idle" },   // 核心·爆4
  "047": { cat: "core", cn: "灰", clip: "idle" },   // 核心·漩涡
  "048": { cat: "world", cn: "青", clip: "idle" },   // 场地·降临
  "049": { cat: "world", cn: "黄", clip: "idle" },   // 场地·攻击
  "050": { cat: "world", cn: "青", clip: "idle" },   // 场地·增益
  "051": { cat: "shield", cn: "金", clip: "idle" },   // 破甲
  "052": { cat: "shield", cn: "黄", clip: "idle" },   // 入侵框
  "053": { cat: "shield", cn: "灰", clip: "idle" },   // 格挡
  "054": { cat: "shield", cn: "缺图", clip: "idle" },   // 旋盾
  "055": { cat: "shield", cn: "蓝", clip: "idle" },   // 护盾
  "056": { cat: "buff", cn: "黑", clip: "idle", blend: "normal" },   // 黑化
  "057": { cat: "buff", cn: "橙", clip: "idle" },   // 强化
  "058": { cat: "buff", cn: "黄", clip: "idle" },   // 增益
  "059": { cat: "buff", cn: "黄", clip: "idle" },   // 燃烧
  "060": { cat: "buff", cn: "金", clip: "idle" },   // 汇聚
  "061": { cat: "buff", cn: "蓝", clip: "idle" },   // 能量+
  "062": { cat: "buff", cn: "黄", clip: "idle" },   // 能量满
  "063": { cat: "buff", cn: "黄", clip: "idle" },   // 花绽
  "064": { cat: "buff", cn: "紫", clip: "idle" },   // 复活
  "065": { cat: "buff", cn: "黄", clip: "idle" },   // 完全蜕变
  "066": { cat: "buff", cn: "红", clip: "idle", blend: "normal" },   // 锁血
  "067": { cat: "buff", cn: "蓝", clip: "idle" },   // 冰封
  "068": { cat: "buff", cn: "黄", clip: "idle" },   // 蜕变①
  "069": { cat: "buff", cn: "黄", clip: "idle" },   // 蜕变②
  "070": { cat: "buff", cn: "红", clip: "idle" },   // 蜕变③
  "071": { cat: "buff", cn: "黄绿", clip: "idle" },   // 回复
  "072": { cat: "buff", cn: "青", clip: "idle" },   // 蓄力
  "073": { cat: "buff", cn: "金", clip: "idle" },   // 眩晕
  "074": { cat: "pet", cn: "黄", clip: "idle" },   // 宠物·鼓舞
  "075": { cat: "pet", cn: "紫", clip: "idle", blend: "normal" },   // 宠物·压制
  "076": { cat: "pet", cn: "紫", clip: "idle" },   // 召唤·兽1
  "077": { cat: "pet", cn: "青", clip: "idle" },   // 召唤·兽2
  "078": { cat: "pet", cn: "紫", clip: "idle" },   // 召唤·兽3
  "079": { cat: "pet", cn: "黄绿", clip: "idle" },   // 召唤·兽4
  "080": { cat: "team", cn: "橙", clip: "idle" },   // 团队技①
  "081": { cat: "team", cn: "黑", clip: "idle" },   // 团队技②
  "082": { cat: "misc", cn: "紫", clip: "idle" },   // 光线
};
