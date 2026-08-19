# 健身成长系统：第一阶段产品契约 v1.0

**状态：** 可用于交互原型、规则实现与可用性测试的工作契约  
**适用范围：** 移动端优先的第一阶段体验；不构成训练、医疗、康复或营养处方。

## 1. 本阶段要交付的体验

第一阶段不是“记录一次训练”的演示，而是让三类用户都能走完一条可信的闭环：

```text
进入 / 重返
  -> 最少必要状态确认与安全分流
  -> 当前 Mission 与今天的可选行动
  -> 完整、短版或恢复版的训练执行
  -> 保存发生过的事实
  -> 区分观察、未知与建议
  -> 用户确认下一步
```

产品在每个结论旁说明其类型。界面及数据层统一采用四类内容：

| 类型 | 含义 | 可否直接作为结论 |
|---|---|---|
| `fact` / 事实 | 用户输入、设备采集或已保存训练记录 | 可以陈述发生了什么，不可越过来源含义 |
| `observation` / 观察 | 基于一个或多个事实的有限描述 | 仅可描述当前证据支持的范围 |
| `toConfirm` / 待确认 | 证据缺失、不可比或需要用户补充的信息 | 不可包装成能力、体型或健康结论 |
| `userDecision` / 用户决定 | 用户接受、修改、跳过或拒绝某建议 | 决定后才可影响后续计划 |

`recommendation` 是由规则产生的行动选项，不是第五种“事实”。它必须展示所依赖的事实、观察和待确认项，并保留用户拒绝入口。

## 2. v1 成功标准与不做的事

### 成功标准

原型测试中的用户能够在不被提示的情况下回答：

1. 我的当前 Mission 是什么，为什么不是所有长期愿望一起处理？
2. 今天为什么给我完整、短版或恢复版这几个选项？
3. 系统知道什么、不知道什么？
4. 我在哪里修改、暂停或拒绝建议？

每条路径都能完成一次训练或明确选择不训练，并产生一条可进入下次判断的记录。

### 非目标

- 不诊断疼痛、伤病、疾病、动作质量或体重变化原因；
- 不以体重、热量、连续打卡、排名或羞耻作为完成度；
- 不在用户未确认前自动提高负荷、改变核心动作或延长 Mission；
- 不依赖食物识别、动作识别、聊天式 AI、教练市场或社交功能。

## 3. 三条端到端用户路径

### A. 重返：忙碌后重新开始

**适用用户：** 近期主动声明或系统从记录中看到训练中断；在 v1 中，中断 `>= 14 天` 只触发“需要重新确认”的提示，不形成失败标签。

| 步骤 | 用户提供 / 选择 | 系统必须做的事 | 产生的内容 |
|---|---|---|---|
| 1. 进入 | 选择“重新开始”或打开重返提醒 | 只保留历史，不显示断练天数或惩罚 | `CurrentState.entryMode=returning` |
| 2. 安全分流 | 回答急性症状、持续加重不适、当下限制 | 命中高风险即停止高强度建议，说明边界 | `SafetyCheck` 与风险 `Decision` |
| 3. 校准 | 今天可用时长、场地、信心、是否有不适 | 用最少信息生成低门槛候选；允许“今天只看计划” | `CurrentState` 更新 |
| 4. 选择行动 | 20 分钟重返版、恢复活动、改天再开始 | 展示每项保留什么训练意图，绝不暗示必须完成 | `Decision` |
| 5. 执行 / 退出 | 实际完成、跳过、替换或标记不适 | 保存实际，不把未完成变成负面结果 | `Session`、`Evidence` |
| 6. 下次 | 接受两天后同类训练、改日期或暂停 | 说明下一次仍需确认状态；不自动恢复旧负荷 | 新 `Decision` |

**完成定义：** 用户在不感到被责备的前提下，拥有一个下一步选择；即使选择暂停，也记录为有效决定。

### B. 建立规律：把两次训练放进现实

**适用用户：** 刚开始、训练零散，或明确希望建立可重复节奏；典型可用频率为每周 2 次。

| 步骤 | 用户提供 / 选择 | 系统必须做的事 | 产生的内容 |
|---|---|---|---|
| 1. 起始 | 训练经验、场地器械、每周可投入次数和时间 | 把信息密度降到基础动作与固定时段；不要求全量身体数据 | 首个 `CurrentState` |
| 2. Mission | 选择“先稳定完成两次基础训练”等可执行方向 | 明确 4 周内的成功证据与不作为裁判的指标 | `Mission` |
| 3. 计划 | 在两个训练日、完整 / 短版、可替代动作间选择 | 为每个训练日准备 20 分钟短版；替换不抹去当日意图 | `Program` |
| 4. 训练 | 记录实际组数、主观难度、跳过原因或不适 | 只要求完成当前动作所需的最少记录 | `Session`、训练 `Evidence` |
| 5. 周复盘 | 确认本周现实变化：时间、疲劳、意愿 | 先展示实际发生，再说明证据是否足以谈“规律” | `Review` |
| 6. 决定 | 维持、调换训练日、只保留短版或暂停 | 计划仅在用户确认后更新 | `Decision`、下一周 `Program` |

**完成定义：** 用户可以复述自己本周采用的节奏，并知道少做一次时下一步怎样低压力地继续。

### C. 自主进阶：已有规律，但成长信号不一致

**适用用户：** 已有可比较训练记录，想判断计划是否有效、是否应改变；体重、训练表现、主观体验与身体观察可能不一致。

| 步骤 | 用户提供 / 选择 | 系统必须做的事 | 产生的内容 |
|---|---|---|---|
| 1. 进入阶段 | 确认当前愿望、可用时间、限制与偏好 | 将长期愿望收敛为一个 4-6 周 Mission | `CurrentState`、`Mission` |
| 2. 今天 | 10 秒状态检查：时间、精力、不适、器械 | 展示完整 / 短版 / 恢复版及各自触发原因 | 当日 `Decision` |
| 3. 训练 | 记录可比工作组、RPE、替换、不适 | 上次表现仅作为参照，不把单组变化解释为能力提升 | `Session`、`Evidence` |
| 4. 单次收据 | 查看时长、动作、组数、调整及下一次注意项 | 先说事实，再说有限观察，明确一次训练不够判断什么 | `Review`（session scope） |
| 5. 周 / 阶段复盘 | 选择是否补充围度、照片、衣物感受、体重趋势或生活上下文 | 并列展示表现、体验、身体观察；缺失信息必须可见 | `Review`（week / mission scope） |
| 6. 阶段决定 | 选择维持、渐进进阶、恢复一周、改写 Mission 或咨询专业人士 | 把建议视为候选路线；用户选择和理由可被保存 | `Decision`、后续 `Program` |

**完成定义：** 用户知道当前证据支持什么、尚不能说明什么，并能自主确认一条可执行的下阶段路线。

## 4. 核心领域对象与最小字段

所有对象必须有：`id`、`userId`、`createdAt`、`updatedAt`、`status`。时间使用 ISO 8601；重量、时长、次数均携带单位；原始记录不可被后续推断覆盖。

### 4.1 `CurrentState`：此刻做决策所需的现实条件

| 字段 | 必要性 | 说明 |
|---|---:|---|
| `entryMode` | 必填 | `starting`、`returning`、`routine`、`progressing`；是当前入口，不是永久等级 |
| `availability` | 必填 | 本次可用分钟数、可训练日期 / 时段、场地与器械摘要 |
| `experience` | 必填 | 用户自选的训练熟悉度与偏好，不给能力打分 |
| `readiness` | 必填 | 用户自评精力 / 意愿 / 疲劳的离散选项，可跳过细节 |
| `discomfort` | 必填 | `none`、`noticeable`、`urgentSignal`；自由文本可选，不能被解释为诊断 |
| `constraints` | 必填 | 用户声明的动作回避、时间、场地、偏好等，每条有来源和有效期 |
| `safetyCheckId` | 必填 | 连接本次简短安全分流的版本与结果 |
| `source` | 必填 | `user`、`device`、`import` 或 `derived`，并记录授权状态 |

### 4.2 `Mission`：4-6 周内的唯一优先方向

| 字段 | 必要性 | 说明 |
|---|---:|---|
| `title`、`userIntent` | 必填 | 用户能理解的方向与原话摘要 |
| `startDate`、`reviewDate` | 必填 | `reviewDate` 在开始后 28-42 天；可由用户提前发起复盘 |
| `successEvidence` | 必填 | 2-4 个可观察信号，分别标注事实 / 主观观察及采集频率 |
| `notTheJudge` | 必填 | 本阶段不作为唯一成败裁判的指标，例如体重 |
| `timeAndEnvironment` | 必填 | 支持此 Mission 的现实约束 |
| `boundaries` | 必填 | 不适、回避动作、数据与心理压力边界 |
| `assumptions` | 必填 | 计划依赖但尚未证实的条件 |
| `status` | 必填 | `proposed`、`active`、`paused`、`completed`、`replaced`；激活必须经用户确认 |

### 4.3 `Program`：可协商、可降级的阶段计划

| 字段 | 必要性 | 说明 |
|---|---:|---|
| `missionId`、`version` | 必填 | 归属与可追溯版本；不覆盖旧版本 |
| `weeklyRhythm` | 必填 | 推荐频率、可选日、最低可行节奏；不展示连续打卡 |
| `sessions` | 必填 | 每类训练的训练意图、动作块、目标区间与顺序 |
| `fullVariant`、`shortVariant`、`recoveryVariant` | 必填 | 每个版本的预计时长、保留 / 移除内容、适用条件和替代动作 |
| `progressionRules` | 必填 | 仅为候选调整条件，需 `Decision` 才生效 |
| `safetyConstraints` | 必填 | 不可违反的限制与触发后行为 |
| `rationale` | 必填 | 面向用户的“为什么如此安排”文字及证据 ID |
| `status` | 必填 | `draft`、`active`、`superseded`、`paused` |

### 4.4 `Session`：一次实际发生或被主动跳过的训练

| 字段 | 必要性 | 说明 |
|---|---:|---|
| `programId`、`plannedSessionId` | 必填 | 保留与计划的关系，允许为空表示自由训练 |
| `startedAt`、`endedAt`、`outcome` | 必填 | `completed`、`partial`、`recovery`、`skipped`、`stoppedForSafety` |
| `selectedVariant` | 必填 | `full`、`short`、`recovery` 或 `selfDirected` |
| `actualBlocks` | 必填 | 动作、组、次数、负荷、RPE / RIR、休息和实际顺序；字段可为空但须说明未知 |
| `adjustments` | 必填 | 替换、减量、跳过、暂停与用户理由 |
| `checkOut` | 必填 | 用户自报不适、精力、信心、是否愿意下次继续 |
| `safetyEvents` | 必填 | 风险触发、用户选择与系统抑制内容；无事件用空数组 |
| `provenance` | 必填 | 每项来自手动、导入或设备的来源与授权 |

### 4.5 `Evidence`：可追溯的信号，不是总分

| 字段 | 必要性 | 说明 |
|---|---:|---|
| `kind` | 必填 | `trainingPerformance`、`bodyObservation`、`subjectiveExperience`、`lifeContext`、`deviceSignal` |
| `classification` | 必填 | 仅 `fact`、`observation`、`toConfirm`；用户决定独立放在 `Decision` |
| `statement` | 必填 | 面向用户的简短陈述，不能越过数据支持范围 |
| `value`、`unit`、`recordedAt` | 条件必填 | 数值型或时点型事实必须带上；自由表达可为 null |
| `source`、`sourceRecordIds` | 必填 | 来源、授权与可回溯原始记录 ID |
| `comparisonKey` | 条件必填 | 需要比较时记录动作、条件、区间、口径版本；不可比则明确为 null |
| `confidence` | 必填 | `direct`、`limited`、`insufficient`，说明的是证据范围，非用户能力 |
| `scope` | 必填 | `session`、`week`、`mission`，限制可得出的结论 |

### 4.6 `Review`：先陈述，再解释，再给选择

| 字段 | 必要性 | 说明 |
|---|---:|---|
| `scope`、`periodStart`、`periodEnd` | 必填 | `session`、`week` 或 `mission` 的复盘范围 |
| `factEvidenceIds` | 必填 | 事实证据清单 |
| `observations`、`toConfirm` | 必填 | 有来源的观察及其尚不确定之处 |
| `coverage` | 必填 | 已记录 / 计划的训练数量与可比证据数量；不是顺从评分 |
| `interpretationBoundary` | 必填 | 明确当前不能推断的事项 |
| `recommendationIds` | 必填 | 候选路线，连接规则和 `Decision` |
| `shareArtifact` | 可选 | 分享时必须只引用本 Review 中的事实和有限观察 |

### 4.7 `Decision`：系统提议由用户完成

| 字段 | 必要性 | 说明 |
|---|---:|---|
| `trigger`、`ruleId` | 必填 | 触发时点与可审查规则 ID；手动决定则为 `userInitiated` |
| `inputEvidenceIds` | 必填 | 用于建议的事实、观察与待确认项 |
| `riskLevel`、`nonNegotiables` | 必填 | `none`、`caution`、`urgent`；不可突破的安全限制 |
| `options` | 必填 | 至少一项可替代行动；每项写明影响、依据与未知 |
| `recommendedOptionId` | 可选 | 系统可推荐，禁止把推荐伪装成唯一答案 |
| `userChoice` | 必填 | `accepted`、`modified`、`declined`、`paused`、`deferred`，以及选择原因（可选） |
| `effectiveFrom`、`followUpEvidence` | 必填 | 生效时间与下次需要验证的证据 |
| `explanation` | 必填 | 固定顺序：事实 -> 观察 -> 待确认 -> 选项 |

### 4.8 关联和写入约束

```text
CurrentState --sets context for--> Mission --owns--> Program
Program --offers a variant for--> Session --creates raw--> Evidence
Evidence --is assembled by--> Review --creates candidates for--> Decision
Decision --may activate a new--> Program / Mission / CurrentState
```

- `Session.actualBlocks` 是事实的原始来源，完成后不可静默改写；纠正须新建更正事件。
- `Evidence.observation` 必须至少列出一个 `sourceRecordId`；`toConfirm` 不得触发负荷增加。
- 计划和 Mission 的版本替换永远保留 `supersedesId`；用户可查看“为什么变了”。
- 任何 `urgent` 决定都不能产出完整训练或进阶方案。

## 5. 首批可审查规则

规则只输出建议与限制，不替用户完成最终选择。实现时每条规则的 `ruleId`、输入、命中状态、输出和版本都要写入 `Decision`。

### 5.1 安全分流

| 规则 ID | 输入与条件 | 系统输出 | 禁止行为 |
|---|---|---|---|
| `SAFE-URGENT-01` | 用户选择：胸部不适 / 晕厥或接近晕厥 / 休息时或异常的呼吸困难 / 突发或持续加重的剧烈疼痛 | `riskLevel=urgent`；停止生成高强度和负荷进阶建议；显示“暂停训练并根据情况寻求合适专业支持” | 不诊断原因；不提供“忍一下完成”；不以奖励推动继续 |
| `SAFE-CAUTION-02` | 用户报告影响动作的明显不适、异常疲劳，或训练中标记不适 | `riskLevel=caution`；相关动作不再建议加负荷；提供记录、恢复版、跳过或暂停 | 不把不适解释成酸痛、康复进展或伤病 |
| `SAFE-CLEAR-03` | 用户无上述信号或选择暂不回答 | 允许进入后续选择，保留风险入口 | 不将“未回答”表述为“安全” |

### 5.2 完整、短版与恢复版

| 规则 ID | 条件 | 候选动作 | 说明 |
|---|---|---|---|
| `VARIANT-FULL-01` | 无 `urgent/caution` 限制；可用时长达到计划完整版本的 80% 以上；用户自评准备度为“可训练” | 推荐完整版本；短版和恢复版仍可选 | 完整只是时间与状态匹配，不是“更好” |
| `VARIANT-SHORT-02` | 无 `urgent`；可用时长为 20 分钟至完整版本的 79%，或用户选择“精力有限” | 推荐短版：保留 1-2 个 Mission 关键动作和记录点，删除非关键容量 | 短版保留训练意图，不把它称为失败版 |
| `VARIANT-RECOVERY-03` | `caution`，或用户自评“很疲劳 / 想动但不适合训练”，或可用时长少于 20 分钟 | 提供可退出的低压力恢复活动、呼吸 / 轻度活动记录、或直接休息 | 不声称恢复活动能治疗、修复或替代专业评估 |
| `VARIANT-USER-04` | 用户主动改变版本、动作或时长 | 保存其选择及可选理由；保留当日安全限制 | 不以弹窗迫使回到推荐版本 |

### 5.3 中断重返

| 规则 ID | 条件 | 系统输出 | 后续验证 |
|---|---|---|---|
| `RETURN-14D-01` | 距离最后一条 `completed`、`partial` 或 `recovery` Session 达 14 天，或用户主动声明中断 | 显示“重新确认今天”；询问时长、场地、准备度、不适；默认提供 20 分钟重返版 | 完成后收集主观难度 / 不适 / 下次意愿 |
| `RETURN-FIRST-02` | 重返后的第一节训练 | 不以历史负荷作为今天目标；关键动作采用当前保守目标区间或由用户选择 | 不适 / 过难则维持或恢复，不进入进阶 |
| `RETURN-NEXT-03` | 重返后至少一条完成记录且无 `urgent`、未解决 `caution` 信号 | 提供“重复同类训练”“间隔后第二次训练”“继续低门槛节奏”选项 | 用户确认节奏后再更新 Program |

### 5.4 周复盘与阶段调整

| 规则 ID | 条件 | 允许的观察 | 决策选项 |
|---|---|---|---|
| `REVIEW-WEEK-LOW-01` | 本周记录少于 1 次，或没有可比关键动作 | 只能陈述已发生训练、生活变化和缺失信息 | 暂停、保留短版、下周再采样、手动改计划 |
| `REVIEW-WEEK-SIGNAL-02` | 至少 2 次同动作、同口径的可比工作组，且无未解决 `caution` | 可陈述“在相近条件下的表现稳定 / 变化”；不得宣称整体能力已提升 | 维持、在下周尝试小范围渐进、维持并补更多记录、恢复一周 |
| `REVIEW-MISSION-03` | 到达 28-42 天复盘窗口，或用户主动发起 | 并列汇总训练表现、主观体验、身体观察、生活上下文；每项有证据范围 | 继续当前 Mission、进入下一 Mission、恢复 / 缩小范围、重设现实约束 |
| `REVIEW-BOUNDARY-04` | 体重、照片、围度等数据缺失或与训练信号不一致 | 标明它们不能单独解释计划效果或身体变化原因 | 用户可选择采样、忽略该指标或咨询合适专业人士 |

## 6. 原型数据与 UI 消费契约

`prototype-data-v1.js` 以浏览器全局 `window.FitnessPrototypeData` 提供演示数据。原型页面应只读使用它，不在渲染时改变 seed 数据。

```js
const data = window.FitnessPrototypeData;
const demo = data.personas.advance;

demo.state;              // 当前可训练条件与安全结果
demo.mission;            // 当前阶段唯一优先
demo.today.full;         // 完整版本
demo.today.short;        // 短版
demo.today.recovery;     // 恢复版
demo.session;            // 最近一条已发生的原始训练记录
demo.review.facts;       // 可陈述的事实
demo.review.observations;// 基于事实的有限观察
demo.review.unknowns;    // 仍待确认，不能被包装成结论
demo.decisions;          // 由规则生成、待用户选的路线
```

UI 必须遵循：

1. 先渲染 `facts`，再渲染 `observations` 与 `toConfirm`；
2. 推荐区显示 `ruleId` 的用户可读理由、至少一个替代选项及拒绝入口；
3. 分享卡只从 `review.shareable` 的事实和有限观察取文案，且仍显示“观察 / 待确认”标签；
4. 任何 `safety.result='urgent'` 的 persona 都不得显示开始完整训练按钮；
5. 不将 `completionRate`、体重或单次表现渲染为“价值 / 成功分数”。

## 7. 进入下一步前的验收

- 三条 demo 均可进入、完成 / 暂停行动、查看复盘和确认决定；
- 原型能明确展示 `fact`、`observation`、`toConfirm`、`userDecision` 四种类型；
- 每个推荐均可回溯到规则与输入证据；
- 疼痛或异常疲劳入口能抑制不适合的训练建议；
- 短版、恢复版、中断重返均不是隐藏分支，而是主流程的可见选择；
- 分享表现是“阶段现场记录”，不捏造改变、不引导体型焦虑，也不遮蔽数据局限。
