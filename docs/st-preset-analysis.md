# SillyTavern 预设系统分析

## 参考来源
`reference/SillyTavern-1.17.0/default/content/presets/openai/Default.json`

## 预设的本质

ST 预设不是"一个 main prompt + 一堆参数"——它是**一套完整的消息组装规则**。

结构分为三层：

### 1. prompts[] — 所有可能的"条目"
每条 prompt 是一个独立的消息片段：
```json
{
  "identifier": "main",           // 唯一ID，prompt_order 通过它引用
  "name": "Main Prompt",          // 显示名称
  "role": "system",               // 消息角色 (system/user/assistant)
  "content": "Write {{char}}'s...", // 实际文本内容
  "system_prompt": true,          // 是否属于系统提示
  "marker": false                 // true = 占位符，内容动态填充
}
```

**marker=true 的条目没有 content**——它们是占位符，运行时被替换为动态内容：
| identifier | 运行时替换为 |
|---|---|
| `chatHistory` | 实际聊天记录 |
| `worldInfoBefore` | 世界书匹配条目（前置） |
| `worldInfoAfter` | 世界书匹配条目（后置） |
| `charDescription` | 角色卡中的描述 |
| `charPersonality` | 角色卡中的性格 |
| `scenario` | 角色卡中的场景设定 |
| `personaDescription` | 用户 Persona 描述 |
| `dialogueExamples` | 角色卡中的对话示例 |

**marker=false 的条目有 content**——它们是自定义文本，支持 `{{char}}` / `{{user}}` 宏替换。

### 2. prompt_order[] — 组装顺序
```json
[
  { "identifier": "main", "enabled": true },
  { "identifier": "worldInfoBefore", "enabled": true },
  { "identifier": "charDescription", "enabled": true },
  ...
  { "identifier": "chatHistory", "enabled": true },
  { "identifier": "jailbreak", "enabled": true }
]
```
- **顺序决定 AI 看到内容的先后**
- **enabled 控制条目是否参与组装**
- prompt_order 可按 character_id 分组（不同角色可用不同顺序）

### 3. 采样参数
temperature, top_p, max_tokens, frequency_penalty 等——这些是 API 调用参数，不是 prompt 内容。

## 消息组装流程

```
prompt_order 遍历:
  identifier="main"       → content 有值 → system: "Write {{char}}'s next reply..."
  identifier="worldInfoBefore" → marker → 替换为匹配的世界书内容
  identifier="charDescription" → marker → 替换为角色卡描述
  identifier="chatHistory"     → marker → 替换为历史消息数组
  identifier="jailbreak"       → content 有值但为空 → 跳过
  ...
→ 最终 messages 数组发送给 API
```

## 关键结论

1. **main 和 jailbreak 不是特殊字段**——它们只是 prompts 数组中的普通条目，恰好有 content
2. **预设 = prompts 条目池 + prompt_order 排序启用 + 采样参数 + 正则**
3. **每个条目可以独立启用/禁用、修改内容、调整角色**
4. **marker 条目是内容管道**——把角色卡、世界书、聊天记录等动态内容注入到正确位置
5. **用户可以通过编辑条目来完全定制 AI 的行为**——不需要单独的 main/jailbreak 字段
