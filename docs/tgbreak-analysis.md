# TGbreak😺 V3.1.1 预设分析

## 基本信息
- 文件：`reference/TGbreak😺V3.1.1.json`（347KB，2572行）
- 目标模型：DeepSeek（openai_max_context: 2,000,000 / openai_max_tokens: 65535）
- 采样参数：temp=1, top_p=0.99
- **prompts[]: 约70个条目**
- **prompt_order[]: 约50个条目（大部分 disabled）**

## 核心架构发现

### 1. 预设 = 两个数组的交互

```
prompts[]          ← 所有可用的"零件"（70+个）
  每个条目都有: identifier, name, role, content, enabled, marker, system_prompt, injection_position/depth/order

prompt_order[]     ← 装配线，决定哪些零件按什么顺序装上
  每个条目: { identifier: "xxx", enabled: true/false }
```

### 2. 三种条目类型（不是两种！）

| 类型 | system_prompt | marker | 示例 | 特点 |
|------|:---:|:---:|------|------|
| **系统提示** | true | false | `main` | ST 预定义的固定 identifier，可编辑 content，可被角色卡 override |
| **动态占位** | true | true | `dialogueExamples`, `worldInfoBefore` | 无 content，运行时从角色卡/世界书替换 |
| **自定义脚本** | false | false | UUID 标识符（70+个） | preset 独有的内容，不可被角色卡 override |

### 3. 条目不是全部生效——靠 prompt_order 开关

TGbreak 有 70+ 条目，但 prompt_order 里只启用了约 15 个，其余全部 `"enabled": false`。

用户切换预设时，实际上是在切换一整套 prompt_order 的开关配置。

### 4. prompt_order 的组装顺序就是消息顺序

TGbreak 的生效条目按顺序组装成最终发给 AI 的 messages 数组：

```
1. b98b0f27  "⚠️⚠️使用必看⚠️⚠️"        → system: "TGbreak-V3，针对deepseek的预设..."
2. 98ca43d1  "😾😾别关"                 → system: "{{setvar::COT-Anti-Omniscience::}}{{setvar::COT-npchs::}}..."
3. main      "^ - ^"                   → system: "<system_context>你是TG的助手tgd...</system_context>"
4. 566cf468  "法则"                     → system: "<core_rules>玩家主权原则...</core_rules>"
5. 254a0dec  "**&&**"                  → assistant: "<Instruction received>指令收到..."
6. dialogueExamples                     → marker → 替换为角色卡对话示例
7. f456ff54  "写作要求开始👇️👇️"      → system: "你要严格参考<writing_engine>..."
8. efe17399  "文风指导👇️👇️"          → system: "<wfeeling>..."
... (其余 disabled)
```

### 5. "别关" 条目的关键作用——脚本激活器

```json
{
  "identifier": "98ca43d1-14bd-464f-98d0-076f85c35a61",
  "name": "😾😾别关",
  "content": "{{setvar::COT-Anti-Omniscience::}}{{setvar::COT-npchs::}}{{setvar::mvuvar::}}..."
}
```

这个条目本身不产生有意义的内容——它通过 `{{setvar::...}}` 宏**激活 JS-Slash-Runner 中的脚本模块**。每个 setvar 触发一个脚本模块的初始化。这就是为什么这个条目叫"别关"——关了它，所有脚本模块都不生效。

### 6. 每个自定义条目 = 一个独立的功能模块

| 条目名称 | 功能 |
|---------|------|
| ⚠️使用必看 | 免责声明 + 使用说明 |
| 😾别关 | 激活所有脚本模块（setvar 宏） |
| ^ - ^ (main) | 系统角色定义（<system_context>） |
| 法则 | 核心创作法则（<core_rules>） |
| **&&** | 确认指令收到的 assistant 响应 |
| 写作要求开始 | <writing_engine> 写作引擎配置 |
| 文风指导 | <wfeeling> 文风设定 |
| 👻基础文风 (disabled) | 备选文风——叙事基调 |
| ... | 还有几十个 disabled 的备选模块 |

## 对我们项目的启示

1. **预设编辑器已经做对了**——条目列表就是预设的核心
2. **需要确认的**：条目的 identifier 可以是 `main`/`jailbreak` 等 ST 内置名，也可以是自定义 UUID——导入 ST 预设时直接保留原始 identifier
3. **需要改进的**：
   - 每个条目需要 `injection_position` / `injection_depth` / `injection_order` 字段（控制注入位置）
   - `marker` 条目不显示 content 编辑框（已有）
   - `system_prompt` 字段需要暴露（控制是否可被角色卡 override）
   - prompt_order 目前等于条目列表顺序 + enabled 状态，这个逻辑是正确的
4. **不需要的**：单独的 `main` prompt 字段和 `jailbreak` 字段——已经删掉了，正确
