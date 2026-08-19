/*
 * 第一阶段原型的只读演示数据。
 * 所有表达按 fact / observation / toConfirm / userDecision 明确标记；
 * 数据为虚构原型人物，不构成医疗、康复或训练处方。
 */
(function attachFitnessPrototypeData(global) {
  "use strict";

  const now = "2026-08-14T18:32:00+08:00";

  const copy = {
    safetyBoundary: "本产品不诊断疼痛、伤病、疾病、动作质量或体重变化原因。出现急性或持续加重的不适时，请暂停高强度训练并根据情况寻求合适的专业支持。",
    classificationLabels: {
      fact: "事实",
      observation: "观察",
      toConfirm: "待确认",
      userDecision: "你的决定"
    },
    explanationOrder: ["fact", "observation", "toConfirm", "userDecision"],
    decisionTemplate: "先说明发生了什么，再说明当前可观察到什么、仍不确定什么，最后提供你可以选择的下一步。"
  };

  function item(id, classification, statement, extra) {
    return Object.assign({ id: id, classification: classification, statement: statement }, extra || {});
  }

  function fact(id, statement, extra) {
    return item(id, "fact", statement, Object.assign({ confidence: "direct" }, extra || {}));
  }

  function observation(id, statement, sourceRecordIds, extra) {
    return item(id, "observation", statement, Object.assign({ confidence: "limited", sourceRecordIds: sourceRecordIds }, extra || {}));
  }

  function toConfirm(id, statement, extra) {
    return item(id, "toConfirm", statement, Object.assign({ confidence: "insufficient" }, extra || {}));
  }

  function userDecision(id, statement, extra) {
    return item(id, "userDecision", statement, extra || {});
  }

  function action(id, label, impact, evidenceIds, unknowns, extra) {
    return Object.assign({
      id: id,
      label: label,
      impact: impact,
      evidenceIds: evidenceIds,
      unknowns: unknowns,
      requiresUserConfirmation: true
    }, extra || {});
  }

  const returnProgram = {
    id: "program-return-01",
    missionId: "mission-return-01",
    version: 1,
    status: "draft",
    weeklyRhythm: {
      recommendedSessions: 2,
      suggestedDays: ["周二", "周六"],
      minimumViableRhythm: "先完成一次重返版，再由你决定下一次。",
      noStreakTracking: true
    },
    rationale: {
      statement: "先用一节可退出的短训练重新确认今天的状态；历史记录会保留，但不作为今天必须达到的负荷。",
      evidenceIds: ["return-f-absence", "return-f-time", "return-f-readiness"]
    },
    safetyConstraints: ["出现 urgent 信号时停止本计划。", "任何明显不适都不作为加负荷依据。"],
    variants: {
      full: {
        id: "return-full",
        label: "完整重返版",
        estimatedMinutes: 35,
        available: false,
        unavailableReason: "今天只有 20 分钟可用；这不是失败。",
        preserves: ["全身基础活动", "主观难度记录"],
        removes: ["额外容量动作"],
        blocks: []
      },
      short: {
        id: "return-short",
        label: "20 分钟重返版",
        estimatedMinutes: 20,
        available: true,
        preserves: ["下肢推的熟悉感", "拉的熟悉感", "当前感受记录"],
        removes: ["历史负荷目标", "训练容量要求"],
        blocks: [
          { id: "return-leg-press", name: "腿举或无负重坐站", target: "由你选择舒适阻力，2 组，每组 6-10 次", reason: "重新熟悉动作，不以历史成绩为目标。" },
          { id: "return-row", name: "坐姿划船或弹力带划船", target: "由你选择舒适阻力，2 组，每组 6-10 次", reason: "保留基础拉的动作模式。" },
          { id: "return-checkout", name: "结束确认", target: "记录是否有不适、主观难度与下次意愿", reason: "为下一次决定提供必要信息。" }
        ]
      },
      recovery: {
        id: "return-recovery",
        label: "恢复活动或今天先暂停",
        estimatedMinutes: 8,
        available: true,
        preserves: ["重新建立联系", "当前状态记录"],
        removes: ["负荷训练"],
        blocks: [
          { id: "return-walk", name: "轻松步行或轻度活动", target: "按舒适程度活动，随时结束", reason: "不把活动当作治疗或完成任务。" }
        ]
      }
    },
    progressionRules: ["RETURN-14D-01", "RETURN-FIRST-02", "RETURN-NEXT-03"]
  };

  const routineProgram = {
    id: "program-routine-01",
    missionId: "mission-routine-01",
    version: 1,
    status: "active",
    weeklyRhythm: {
      recommendedSessions: 2,
      suggestedDays: ["周三", "周日"],
      minimumViableRhythm: "每周任意一次基础训练也会保留下一步。",
      noStreakTracking: true
    },
    rationale: {
      statement: "两种重复的全身基础训练，先降低决定成本；每次都能改为短版，不需要补偿漏掉的训练。",
      evidenceIds: ["routine-f-frequency", "routine-f-time", "routine-f-equipment"]
    },
    safetyConstraints: ["出现 urgent 信号时停止本计划。", "标记不适的动作不推荐加负荷。"],
    variants: {
      full: {
        id: "routine-full-a",
        label: "基础全身训练 A",
        estimatedMinutes: 40,
        available: true,
        preserves: ["蹲 / 推 / 拉的基础模式", "每组主观难度"],
        removes: [],
        blocks: [
          { id: "routine-squat", name: "高脚杯深蹲或坐站", target: "2-3 组，每组 6-10 次；以动作舒适和可控为前提", reason: "建立下肢基础动作模式。" },
          { id: "routine-press", name: "器械胸推或墙壁俯卧撑", target: "2-3 组，每组 6-10 次", reason: "建立上肢推的基础动作模式。" },
          { id: "routine-pull", name: "坐姿划船", target: "2-3 组，每组 6-10 次", reason: "建立上肢拉的基础动作模式。" }
        ]
      },
      short: {
        id: "routine-short-a",
        label: "20 分钟基础短版",
        estimatedMinutes: 20,
        available: true,
        preserves: ["一项下肢动作", "一项上肢动作", "下次可比较的记录"],
        removes: ["第三个动作", "额外组数"],
        blocks: [
          { id: "routine-short-squat", name: "高脚杯深蹲或坐站", target: "2 组，每组 6-10 次", reason: "保留下肢基础动作。" },
          { id: "routine-short-row", name: "坐姿划船", target: "2 组，每组 6-10 次", reason: "保留上肢拉的基础动作。" }
        ]
      },
      recovery: {
        id: "routine-recovery-a",
        label: "恢复活动或今天先暂停",
        estimatedMinutes: 10,
        available: true,
        preserves: ["身体状态记录"],
        removes: ["训练容量与进阶"],
        blocks: [
          { id: "routine-move", name: "轻度活动与舒适范围活动", target: "以舒适程度为界，随时结束", reason: "让你可以记录当前状态，而不是要求完成训练。" }
        ]
      }
    },
    progressionRules: ["VARIANT-FULL-01", "VARIANT-SHORT-02", "VARIANT-RECOVERY-03", "REVIEW-WEEK-LOW-01", "REVIEW-WEEK-SIGNAL-02"]
  };

  const progressionProgram = {
    id: "program-progression-03",
    missionId: "mission-progression-01",
    version: 3,
    status: "active",
    weeklyRhythm: {
      recommendedSessions: 4,
      suggestedDays: ["周一", "周二", "周四", "周五"],
      minimumViableRhythm: "保留两次关键下肢 / 上肢训练，其他日可重新排布。",
      noStreakTracking: true
    },
    rationale: {
      statement: "本阶段先为下肢训练建立连续、可比较的表现证据；体重继续被记录，但不单独决定计划成败。",
      evidenceIds: ["progress-f-schedule", "progress-f-lower-gap", "progress-f-available-time"]
    },
    safetyConstraints: ["出现 urgent 信号时停止本计划。", "腰部不适或明确不适时，相关动作不作为加负荷依据。", "RPE 与动作舒适度不用于诊断动作质量。"],
    variants: {
      full: {
        id: "progress-lower-full",
        label: "完整下肢训练",
        estimatedMinutes: 55,
        available: true,
        preserves: ["下肢推", "髋伸", "可比较工作组", "下次调整所需的 RPE"],
        removes: [],
        blocks: [
          { id: "progress-leg-press", name: "腿举", target: "3 组，每组 8-10 次；今天目标 80 kg", previousComparable: "上次 80 kg x 10", reason: "累积相近条件下的下肢推表现。" },
          { id: "progress-hip-thrust", name: "臀推", target: "3 组，每组 8-10 次；以舒适、可控为前提", previousComparable: "上次 45 kg x 8", reason: "保留下肢后侧 / 髋伸训练意图。" },
          { id: "progress-split-squat", name: "分腿蹲或替代动作", target: "2 组，每侧 8 次；不适时改为腿屈伸或跳过", previousComparable: "本动作记录不足", reason: "补足下肢单侧控制的练习机会。" },
          { id: "progress-accessory", name: "髋外展", target: "2 组，每组 10-12 次", previousComparable: "上次 35 kg x 12", reason: "作为辅助容量，不用于单独判断能力。" }
        ]
      },
      short: {
        id: "progress-lower-short",
        label: "25 分钟下肢短版",
        estimatedMinutes: 25,
        available: true,
        preserves: ["腿举可比工作组", "一项髋伸动作", "RPE 与不适记录"],
        removes: ["辅助容量动作", "额外热身以外的训练量"],
        blocks: [
          { id: "progress-short-leg-press", name: "腿举", target: "2 组，每组 8-10 次；可按状态降负荷", reason: "保留本阶段最关键的可比信号。" },
          { id: "progress-short-hip", name: "臀推或替代动作", target: "2 组，每组 8-10 次", reason: "保留髋伸训练意图。" }
        ]
      },
      recovery: {
        id: "progress-lower-recovery",
        label: "恢复活动或今天先暂停",
        estimatedMinutes: 12,
        available: true,
        preserves: ["当前不适与准备度记录"],
        removes: ["负荷进阶", "可比表现判断"],
        blocks: [
          { id: "progress-easy-walk", name: "轻松步行或舒适范围活动", target: "按舒适程度活动，随时结束", reason: "给你一个可选择的低压力行动；不作为治疗建议。" }
        ]
      }
    },
    progressionRules: ["SAFE-CAUTION-02", "VARIANT-FULL-01", "VARIANT-SHORT-02", "VARIANT-RECOVERY-03", "REVIEW-WEEK-SIGNAL-02", "REVIEW-MISSION-03"]
  };

  const returningPersona = {
    id: "returningAfterInterruption",
    label: "重返：林遥",
    journey: "returning",
    profile: {
      summary: "虚构演示人物。此前每周训练 2-3 次，因项目上线中断约 7 周。",
      preferredName: "林遥",
      declaredGoal: "先重新找回能规律活动的感觉。"
    },
    currentState: {
      id: "state-return-01",
      entryMode: "returning",
      availability: { minutesToday: 20, environment: "公司附近健身房", equipment: ["器械", "自重"], nextPossibleWindows: ["周二午休", "周六上午"] },
      experience: { selfSelected: "熟悉基础器械，但想从简单开始", preferences: ["不想补偿以前没练的量"] },
      readiness: { selected: "可以尝试", energy: "一般", confidence: "有点犹豫", source: "user" },
      discomfort: { level: "none", text: null, source: "user" },
      constraints: [{ id: "return-c-work", statement: "今天只剩 20 分钟", source: "user", expiresAt: "2026-08-14T23:59:59+08:00" }],
      safety: { checkVersion: "v1", result: "clear", answeredAt: now, unansweredIsNotClear: false },
      source: "user"
    },
    mission: {
      id: "mission-return-01",
      title: "重新开始，但不补课",
      userIntent: "先完成两次低门槛训练，再决定要不要恢复原来的节奏。",
      startDate: "2026-08-14",
      reviewDate: "2026-09-04",
      successEvidence: ["完成一节重返版后记录主观感受", "在 3 周内由自己选择至少两次可行的训练或恢复行动"],
      notTheJudge: ["以前的训练重量", "断练天数", "体重"],
      timeAndEnvironment: "工作日午休 20 分钟；器械与自重可用。",
      boundaries: ["任何不适都可选择暂停或恢复活动"],
      assumptions: ["20 分钟版本能适应当前生活节奏，仍待用户体验确认"],
      status: "proposed"
    },
    program: returnProgram,
    sessions: [
      { id: "session-return-last", programId: null, plannedSessionId: null, startedAt: "2026-06-24T12:10:00+08:00", endedAt: "2026-06-24T12:44:00+08:00", outcome: "completed", selectedVariant: "selfDirected", actualBlocks: [], adjustments: [], checkOut: { discomfort: "未记录", willingness: "未记录" }, safetyEvents: [], provenance: [{ source: "manual", authorized: true }] }
    ],
    evidence: [
      fact("return-f-absence", "距离最近一次已保存训练约 7 周。", { kind: "trainingPerformance", value: 7, unit: "weeks", recordedAt: now, source: "session-return-last", scope: "mission" }),
      fact("return-f-time", "今天可用 20 分钟，场地为公司附近健身房。", { kind: "lifeContext", value: 20, unit: "minutes", recordedAt: now, source: "user", scope: "session" }),
      fact("return-f-readiness", "你选择“可以尝试”，并表示有点犹豫。", { kind: "subjectiveExperience", value: null, unit: null, recordedAt: now, source: "user", scope: "session" }),
      observation("return-o-context", "目前的信息支持先提供低门槛重返版；它不说明你需要或不需要恢复到以前的训练量。", ["return-f-absence", "return-f-time", "return-f-readiness"], { kind: "subjectiveExperience", scope: "session" }),
      toConfirm("return-q-response", "完成第一节后，当前阻力是否舒适、是否出现不适、以及你是否愿意在本周安排下一次，仍待确认。", { kind: "subjectiveExperience", scope: "mission" })
    ],
    review: {
      id: "review-return-entry",
      scope: "session",
      periodStart: "2026-08-14T00:00:00+08:00",
      periodEnd: now,
      factEvidenceIds: ["return-f-absence", "return-f-time", "return-f-readiness"],
      observations: ["return-o-context"],
      toConfirm: ["return-q-response"],
      coverage: { recordedSessions: 0, plannedSessions: 1, comparableKeyBlocks: 0 },
      interpretationBoundary: "尚未发生新的训练，不能根据历史记录判断今天适合的负荷或恢复速度。",
      recommendationIds: ["return-action-short", "return-action-recovery", "return-action-defer"],
      shareable: { enabled: false, reason: "重返入口不生成成果宣传内容。" }
    },
    decisionOptions: {
      id: "decision-return-entry",
      trigger: "returningEntry",
      ruleId: "RETURN-14D-01",
      riskLevel: "none",
      nonNegotiables: ["如出现急性风险信号，停止高强度训练建议。"],
      inputEvidenceIds: ["return-f-absence", "return-f-time", "return-f-readiness", "return-o-context", "return-q-response"],
      recommendedOptionId: "return-action-short",
      options: [
        action("return-action-short", "开始 20 分钟重返版", "保留两种基础动作和结束确认；不要求达到历史重量。", ["return-f-time", "return-o-context"], ["当前可接受阻力仍未知"], { variantId: "return-short" }),
        action("return-action-recovery", "改为恢复活动", "保留状态记录，去掉负荷训练。", ["return-f-readiness"], ["恢复活动不会说明训练能力"], { variantId: "return-recovery" }),
        action("return-action-defer", "今天先不开始，选一个下次时段", "保留历史与 Mission 草案，不产生失败记录。", ["return-f-time"], ["下次的时间和状态仍待确认"])
      ],
      userChoice: userDecision("return-d-pending", "尚未选择今天的行动。", { status: "deferred", chosenOptionId: null, reason: null, recordedAt: null }),
      effectiveFrom: null,
      followUpEvidence: ["return-q-response"],
      explanation: copy.decisionTemplate
    }
  };

  const routinePersona = {
    id: "buildingRoutine",
    label: "建立规律：周安",
    journey: "routine",
    profile: {
      summary: "虚构演示人物。此前偶尔跟练，想每周稳定去两次，不希望每天记录饮食或体重。",
      preferredName: "周安",
      declaredGoal: "先让训练成为下班后可以完成的事。"
    },
    currentState: {
      id: "state-routine-01",
      entryMode: "routine",
      availability: { minutesToday: 35, environment: "小区健身房", equipment: ["坐姿划船", "胸推", "哑铃", "自重"], nextPossibleWindows: ["周三 19:00", "周日 10:00"] },
      experience: { selfSelected: "刚开始熟悉器械", preferences: ["动作少一点", "不想每天打卡"] },
      readiness: { selected: "可以训练", energy: "一般", confidence: "愿意试试", source: "user" },
      discomfort: { level: "none", text: null, source: "user" },
      constraints: [{ id: "routine-c-time", statement: "工作日最多 35-40 分钟", source: "user", expiresAt: null }],
      safety: { checkVersion: "v1", result: "clear", answeredAt: now, unansweredIsNotClear: false },
      source: "user"
    },
    mission: {
      id: "mission-routine-01",
      title: "建立每周两次的可重复训练节奏",
      userIntent: "在下班后或周末完成基础训练，而不是追求一开始练很多。",
      startDate: "2026-08-12",
      reviewDate: "2026-09-09",
      successEvidence: ["在 4 周内由自己选择并完成 4-6 次训练或短版", "每次能记录至少一个动作的主观难度", "能说出短版和完整版本分别适合何时"],
      notTheJudge: ["连续打卡", "每天体重", "单次动作重量"],
      timeAndEnvironment: "每周二次，工作日 35-40 分钟；小区健身房器械有限。",
      boundaries: ["只收集下一次判断必要数据", "没有精力时可用短版或暂停"],
      assumptions: ["周三和周日是可维持的训练窗口，仍待每周复盘确认"],
      status: "active"
    },
    program: routineProgram,
    sessions: [
      {
        id: "session-routine-01",
        programId: "program-routine-01",
        plannedSessionId: "routine-full-a",
        startedAt: "2026-08-12T19:08:00+08:00",
        endedAt: "2026-08-12T19:41:00+08:00",
        outcome: "partial",
        selectedVariant: "short",
        actualBlocks: [
          { blockId: "routine-short-squat", sets: [{ load: 8, loadUnit: "kg", reps: 8, rpe: "合适" }, { load: 8, loadUnit: "kg", reps: 7, rpe: "合适" }] },
          { blockId: "routine-short-row", sets: [{ load: 20, loadUnit: "kg", reps: 10, rpe: "偏难" }, { load: 20, loadUnit: "kg", reps: 8, rpe: "偏难" }] }
        ],
        adjustments: [{ type: "variantChange", from: "full", to: "short", reason: "临时加班后时间不足", source: "user" }],
        checkOut: { discomfort: "无", energy: "一般", confidence: "完成后感觉可以", willingness: "愿意在周日再练一次" },
        safetyEvents: [],
        provenance: [{ source: "manual", authorized: true }]
      }
    ],
    evidence: [
      fact("routine-f-frequency", "你选择每周两次作为当前可行节奏。", { kind: "lifeContext", value: 2, unit: "sessionsPerWeek", recordedAt: "2026-08-12T18:45:00+08:00", source: "user", scope: "mission" }),
      fact("routine-f-time", "上次只有 33 分钟，主动改为短版并完成两个动作。", { kind: "trainingPerformance", value: 33, unit: "minutes", recordedAt: "2026-08-12T19:41:00+08:00", source: "session-routine-01", scope: "week" }),
      fact("routine-f-equipment", "小区健身房可使用坐姿划船、胸推、哑铃和自重。", { kind: "lifeContext", value: null, unit: null, recordedAt: now, source: "user", scope: "mission" }),
      observation("routine-o-fit", "一次短版在当前工作日内被完成，说明短版可能比完整版本更贴近当天时间；还不能说明这个节奏已稳定。", ["routine-f-time", "routine-f-frequency"], { kind: "trainingPerformance", scope: "week" }),
      toConfirm("routine-q-repeat", "周日是否仍能训练、划船的“偏难”感是否重复出现，以及训练日是否需要调整，仍待确认。", { kind: "subjectiveExperience", scope: "week" })
    ],
    review: {
      id: "review-routine-week-01",
      scope: "week",
      periodStart: "2026-08-10T00:00:00+08:00",
      periodEnd: now,
      factEvidenceIds: ["routine-f-frequency", "routine-f-time", "routine-f-equipment"],
      observations: ["routine-o-fit"],
      toConfirm: ["routine-q-repeat"],
      coverage: { recordedSessions: 1, plannedSessions: 2, comparableKeyBlocks: 0 },
      interpretationBoundary: "本周只有一次记录，且没有同条件可比动作；不能据此判断力量变化或训练习惯已经形成。",
      recommendationIds: ["routine-action-short", "routine-action-schedule", "routine-action-pause"],
      shareable: { enabled: false, reason: "规律建立阶段优先形成私人复盘，而不是对外成果叙事。" }
    },
    decisionOptions: {
      id: "decision-routine-week-01",
      trigger: "weeklyReview",
      ruleId: "REVIEW-WEEK-LOW-01",
      riskLevel: "none",
      nonNegotiables: ["不把本周少一次训练标为失败。"],
      inputEvidenceIds: ["routine-f-frequency", "routine-f-time", "routine-o-fit", "routine-q-repeat"],
      recommendedOptionId: "routine-action-short",
      options: [
        action("routine-action-short", "周日继续用 20 分钟短版", "优先再采集一次贴近现实的训练记录。", ["routine-f-time", "routine-o-fit"], ["两次是否可持续仍未知"], { variantId: "routine-short-a" }),
        action("routine-action-schedule", "把第二次训练改到更合适的时段", "保留本周目标，只改变现实安排。", ["routine-f-frequency"], ["新的时段是否可行仍待确认"]),
        action("routine-action-pause", "本周先暂停，下周再选一次", "不补偿本周训练量；保留 Mission。", ["routine-f-time"], ["下周的状态尚未知"])
      ],
      userChoice: userDecision("routine-d-pending", "尚未选择周日的下一步。", { status: "deferred", chosenOptionId: null, reason: null, recordedAt: null }),
      effectiveFrom: null,
      followUpEvidence: ["routine-q-repeat"],
      explanation: copy.decisionTemplate
    }
  };

  const progressingPersona = {
    id: "progressingPlateau",
    label: "进阶：陈溪",
    journey: "progressing",
    profile: {
      summary: "虚构演示人物。已有规律力量训练，想让下肢更均衡；体重近期变化不明显，因此希望理解训练是否在积累。",
      preferredName: "陈溪",
      declaredGoal: "下肢训练更有方向，逐步建立匀称、清晰的肌肉线条。"
    },
    currentState: {
      id: "state-progress-01",
      entryMode: "progressing",
      availability: { minutesToday: 55, environment: "商业健身房", equipment: ["腿举", "臀推架", "哑铃", "拉力器"], nextPossibleWindows: ["周一午休", "周四午休", "周五午休"] },
      experience: { selfSelected: "已能独立完成常见器械动作", preferences: ["知道每次为什么这样练", "不把体重当成唯一答案"] },
      readiness: { selected: "可以训练", energy: "一般", confidence: "愿意继续下肢训练", source: "user" },
      discomfort: { level: "none", text: "曾有腰部不适，目前未报告急性或持续加重症状。", source: "user" },
      constraints: [
        { id: "progress-c-time", statement: "工作日午休约 55 分钟", source: "user", expiresAt: null },
        { id: "progress-c-preference", statement: "出现腰部不适时不以完成预设重量为目标", source: "user", expiresAt: null }
      ],
      safety: { checkVersion: "v1", result: "clear", answeredAt: now, unansweredIsNotClear: false },
      source: "user"
    },
    mission: {
      id: "mission-progression-01",
      title: "建立可比较的下肢训练证据",
      userIntent: "在不靠体重单独裁判的前提下，稳定完成下肢训练，理解是否应该调整。",
      startDate: "2026-08-03",
      reviewDate: "2026-09-07",
      successEvidence: ["每周 1-2 次下肢训练中保留至少一个可比工作组", "记录关键动作的 RPE / 不适", "阶段末能对比至少两次相近条件下的下肢表现"],
      notTheJudge: ["单日体重", "一次训练表现", "外观照片的即时变化"],
      timeAndEnvironment: "工作日午休 55 分钟，商业健身房器械可用；周末安排可变化。",
      boundaries: ["腰部或其他明显不适时可以改短版、恢复版或暂停", "不强制记录饮食重量或每日照片"],
      assumptions: ["相近时间和器械条件足以逐步积累下肢关键动作证据", "下肢频率可与工作节奏匹配"],
      status: "active"
    },
    program: progressionProgram,
    sessions: [
      {
        id: "session-progress-0807",
        programId: "program-progression-03",
        plannedSessionId: "progress-lower-full",
        startedAt: "2026-08-07T12:06:00+08:00",
        endedAt: "2026-08-07T13:02:00+08:00",
        outcome: "completed",
        selectedVariant: "full",
        actualBlocks: [
          { blockId: "progress-leg-press", sets: [{ load: 80, loadUnit: "kg", reps: 10, rpe: "合适" }, { load: 80, loadUnit: "kg", reps: 9, rpe: "合适" }, { load: 80, loadUnit: "kg", reps: 8, rpe: "偏难" }] },
          { blockId: "progress-hip-thrust", sets: [{ load: 45, loadUnit: "kg", reps: 8, rpe: "合适" }, { load: 45, loadUnit: "kg", reps: 8, rpe: "偏难" }] },
          { blockId: "progress-accessory", sets: [{ load: 35, loadUnit: "kg", reps: 12, rpe: "合适" }, { load: 35, loadUnit: "kg", reps: 11, rpe: "合适" }] }
        ],
        adjustments: [{ type: "skip", blockId: "progress-split-squat", reason: "当天时间不足", source: "user" }],
        checkOut: { discomfort: "无新增不适", energy: "一般", confidence: "下肢动作更熟悉", willingness: "愿意保持本周节奏" },
        safetyEvents: [],
        provenance: [{ source: "manual", authorized: true }]
      },
      {
        id: "session-progress-0811",
        programId: "program-progression-03",
        plannedSessionId: "progress-lower-full",
        startedAt: "2026-08-11T12:03:00+08:00",
        endedAt: "2026-08-11T13:01:00+08:00",
        outcome: "completed",
        selectedVariant: "full",
        actualBlocks: [
          { blockId: "progress-leg-press", sets: [{ load: 80, loadUnit: "kg", reps: 10, rpe: "合适" }, { load: 80, loadUnit: "kg", reps: 10, rpe: "合适" }, { load: 80, loadUnit: "kg", reps: 8, rpe: "偏难" }] },
          { blockId: "progress-hip-thrust", sets: [{ load: 45, loadUnit: "kg", reps: 9, rpe: "合适" }, { load: 45, loadUnit: "kg", reps: 8, rpe: "偏难" }] },
          { blockId: "progress-accessory", sets: [{ load: 35, loadUnit: "kg", reps: 12, rpe: "合适" }, { load: 35, loadUnit: "kg", reps: 12, rpe: "合适" }] }
        ],
        adjustments: [{ type: "replace", blockId: "progress-split-squat", replacement: "腿屈伸", reason: "用户选择更稳定的器械版本", source: "user" }],
        checkOut: { discomfort: "无新增不适", energy: "一般", confidence: "完成后状态稳定", willingness: "愿意在周四重复下肢训练" },
        safetyEvents: [],
        provenance: [{ source: "manual", authorized: true }]
      }
    ],
    evidence: [
      fact("progress-f-schedule", "本周已保存两次完整下肢训练记录。", { kind: "trainingPerformance", value: 2, unit: "sessions", recordedAt: now, source: "session-progress-0807,session-progress-0811", scope: "week" }),
      fact("progress-f-lower-gap", "你主动选择把下肢训练作为当前阶段重点。", { kind: "subjectiveExperience", value: null, unit: null, recordedAt: "2026-08-03T12:00:00+08:00", source: "user", scope: "mission" }),
      fact("progress-f-available-time", "今天可用 55 分钟，且腿举、臀推架可使用。", { kind: "lifeContext", value: 55, unit: "minutes", recordedAt: now, source: "user", scope: "session" }),
      fact("progress-f-legpress-0807", "8 月 7 日腿举 80 kg 的三组实际完成次数为 10、9、8。", { kind: "trainingPerformance", value: [10, 9, 8], unit: "reps", recordedAt: "2026-08-07T13:02:00+08:00", source: "session-progress-0807", comparisonKey: "legPress|80kg|3-work-sets|manual-v1", scope: "week" }),
      fact("progress-f-legpress-0811", "8 月 11 日腿举 80 kg 的三组实际完成次数为 10、10、8。", { kind: "trainingPerformance", value: [10, 10, 8], unit: "reps", recordedAt: "2026-08-11T13:01:00+08:00", source: "session-progress-0811", comparisonKey: "legPress|80kg|3-work-sets|manual-v1", scope: "week" }),
      fact("progress-f-checkout", "两次训练结束时均记录“无新增不适”；精力为一般。", { kind: "subjectiveExperience", value: null, unit: null, recordedAt: now, source: "session-progress-0807,session-progress-0811", scope: "week" }),
      fact("progress-f-weight", "本周记录的体重在 56.7-57.0 kg 区间。", { kind: "bodyObservation", value: [56.7, 57.0], unit: "kg", recordedAt: now, source: "manual", comparisonKey: "bodyWeight|userManual|week", scope: "week" }),
      observation("progress-o-legpress", "两次相近条件下的腿举完成度相近，当前可描述为表现稳定；这不足以判断下肢能力已经提升。", ["progress-f-legpress-0807", "progress-f-legpress-0811"], { kind: "trainingPerformance", comparisonKey: "legPress|80kg|3-work-sets|manual-v1", scope: "week" }),
      observation("progress-o-consistency", "本周两次下肢训练都完成，且结束时未报告新增不适；这支持继续积累相近条件下的记录。", ["progress-f-schedule", "progress-f-checkout"], { kind: "trainingPerformance", scope: "week" }),
      observation("progress-o-weight-boundary", "本周体重区间变化很小；结合当前记录，不能据此解释训练是否无效、脂肪是否变化或肌肉是否增加。", ["progress-f-weight", "progress-f-schedule"], { kind: "bodyObservation", scope: "week" }),
      toConfirm("progress-q-next-load", "若下次仍在相近条件下完成目标区间且主观难度可接受，是否要尝试小范围调整负荷，仍需要下一次训练和你的确认。", { kind: "trainingPerformance", scope: "mission" }),
      toConfirm("progress-q-body", "围度、照片或衣物感受尚未形成可比较的阶段记录；它们是可选信息，不是完成 Mission 的前提。", { kind: "bodyObservation", scope: "mission" })
    ],
    review: {
      id: "review-progress-week-02",
      scope: "week",
      periodStart: "2026-08-07T00:00:00+08:00",
      periodEnd: now,
      factEvidenceIds: ["progress-f-schedule", "progress-f-legpress-0807", "progress-f-legpress-0811", "progress-f-checkout", "progress-f-weight"],
      observations: ["progress-o-legpress", "progress-o-consistency", "progress-o-weight-boundary"],
      toConfirm: ["progress-q-next-load", "progress-q-body"],
      coverage: { recordedSessions: 2, plannedSessions: 2, comparableKeyBlocks: 2 },
      interpretationBoundary: "两次可比工作组支持“相近表现稳定”，不足以判断整体能力、体型或体重变化的原因。",
      recommendationIds: ["progress-action-maintain", "progress-action-small-progress", "progress-action-recovery", "progress-action-rescope"],
      shareable: {
        enabled: true,
        title: "下肢路线 · 第 2 周现场记录",
        allowedEvidenceIds: ["progress-f-schedule", "progress-f-legpress-0807", "progress-f-legpress-0811", "progress-f-checkout", "progress-o-legpress"],
        prohibitedClaims: ["身体改变已被证明", "能力已显著提升", "战胜自己", "体重变化代表成败"],
        footer: "观察基于两次相近条件下的训练记录；下一段路线仍待继续确认。"
      }
    },
    decisionOptions: {
      id: "decision-progress-week-02",
      trigger: "weeklyReview",
      ruleId: "REVIEW-WEEK-SIGNAL-02",
      riskLevel: "none",
      nonNegotiables: ["本周体重不作为计划成败依据。", "没有新的可比记录与用户确认时，不自动提高负荷。"],
      inputEvidenceIds: ["progress-f-legpress-0807", "progress-f-legpress-0811", "progress-f-checkout", "progress-f-weight", "progress-o-legpress", "progress-o-consistency", "progress-o-weight-boundary", "progress-q-next-load"],
      recommendedOptionId: "progress-action-maintain",
      options: [
        action("progress-action-maintain", "下次保持相近重量，继续采集一节可比记录", "最大化当前 Mission 的证据连续性，不把稳定误读成停滞。", ["progress-o-legpress", "progress-o-consistency"], ["整体能力与体型变化仍未知"], { variantId: "progress-lower-full" }),
        action("progress-action-small-progress", "下次尝试一项小范围渐进", "只对一项关键动作尝试小调整，并继续记录 RPE / 不适。", ["progress-o-legpress", "progress-f-checkout"], ["是否适合调整需在训练现场再次确认"], { variantId: "progress-lower-full", requiresFreshReadinessCheck: true }),
        action("progress-action-recovery", "本周加入一次恢复版或减少辅助容量", "保留关键动作记录，降低额外训练量。", ["progress-f-checkout"], ["疲劳是否影响训练仍未被充分记录"], { variantId: "progress-lower-recovery" }),
        action("progress-action-rescope", "提前复盘并改写 Mission", "把重点改为恢复、上肢或训练安排；保留本周证据。", ["progress-f-lower-gap"], ["新 Mission 的现实约束需要重新确认"])
      ],
      userChoice: userDecision("progress-d-pending", "尚未确认下次下肢训练采用哪条路线。", { status: "deferred", chosenOptionId: null, reason: null, recordedAt: null }),
      effectiveFrom: null,
      followUpEvidence: ["progress-q-next-load", "progress-q-body"],
      explanation: copy.decisionTemplate
    }
  };

  const personas = [returningPersona, routinePersona, progressingPersona];
  const personaById = personas.reduce(function indexPersona(index, persona) {
    index[persona.id] = persona;
    return index;
  }, {});

  function withAudit(object, userId, fallbackStatus) {
    return Object.assign({
      userId: userId,
      createdAt: now,
      updatedAt: now,
      status: fallbackStatus
    }, object);
  }

  function buildPrototypePersona(persona) {
    const evidence = persona.evidence.map(function normalizeEvidence(entry) {
      const recordIds = entry.sourceRecordIds || (entry.source ? String(entry.source).split(",") : []);
      return withAudit(Object.assign({ comparisonKey: null, sourceRecordIds: recordIds }, entry), persona.id, "recorded");
    });
    const facts = evidence.filter(function onlyFacts(entry) { return entry.classification === "fact"; });
    const observations = evidence.filter(function onlyObservations(entry) { return entry.classification === "observation"; });
    const unknowns = evidence.filter(function onlyUnknowns(entry) { return entry.classification === "toConfirm"; });
    const variants = persona.program.variants;
    return {
      id: persona.id,
      label: persona.label,
      intro: persona.profile.summary,
      state: withAudit(persona.currentState, persona.id, "active"),
      mission: withAudit(persona.mission, persona.id, persona.mission.status),
      today: {
        recommendedOptionId: persona.decisionOptions.recommendedOptionId,
        full: variants.full,
        short: variants.short,
        recovery: variants.recovery,
        rationale: persona.program.rationale,
        safetyConstraints: persona.program.safetyConstraints
      },
      session: withAudit(persona.sessions[persona.sessions.length - 1], persona.id, "saved"),
      sessions: persona.sessions.map(function auditSession(session) { return withAudit(session, persona.id, "saved"); }),
      evidence: evidence,
      review: withAudit(Object.assign({}, persona.review, {
        facts: facts,
        observations: observations,
        unknowns: unknowns
      }), persona.id, "ready"),
      decisions: withAudit(persona.decisionOptions, persona.id, "pending"),
      program: withAudit(persona.program, persona.id, persona.program.status)
    };
  }

  const prototypes = {
    restart: buildPrototypePersona(returningPersona),
    routine: buildPrototypePersona(routinePersona),
    advance: buildPrototypePersona(progressingPersona)
  };

  const safety = {
    urgentSignals: ["胸部不适", "晕厥或接近晕厥", "休息时或异常的呼吸困难", "突发或持续加重的剧烈疼痛"],
    urgentAction: "暂停高强度训练；产品不会诊断原因，并建议根据情况寻求合适的专业支持。",
    cautionAction: "相关动作不建议加负荷；可以选择记录、恢复版、跳过或暂停。",
    clearBoundary: "未报告风险信号不等于产品确认安全；用户仍可随时标记不适。"
  };

  const ruleLabels = {
    "SAFE-URGENT-01": "急性风险分流",
    "SAFE-CAUTION-02": "明显不适或异常疲劳",
    "VARIANT-FULL-01": "完整版本",
    "VARIANT-SHORT-02": "短版",
    "VARIANT-RECOVERY-03": "恢复版",
    "RETURN-14D-01": "14 天重返",
    "RETURN-FIRST-02": "重返第一节",
    "RETURN-NEXT-03": "重返后下一步",
    "REVIEW-WEEK-LOW-01": "周复盘证据不足",
    "REVIEW-WEEK-SIGNAL-02": "周复盘有可比信号",
    "REVIEW-MISSION-03": "阶段复盘"
  };

  const data = {
    version: "1.0.0",
    generatedAt: now,
    disclaimer: copy.safetyBoundary,
    contentContract: copy,
    safety: safety,
    ruleLabels: ruleLabels,
    personas: prototypes,
    ruleCatalog: [
      { id: "SAFE-URGENT-01", label: "急性风险分流", effect: "停止生成高强度与负荷进阶建议。" },
      { id: "SAFE-CAUTION-02", label: "明显不适或异常疲劳", effect: "相关动作不建议加负荷，提供恢复 / 跳过 / 暂停。" },
      { id: "VARIANT-FULL-01", label: "完整版本", effect: "时间和准备度匹配时可推荐，仍保留替代选项。" },
      { id: "VARIANT-SHORT-02", label: "短版", effect: "保留 Mission 关键动作，不以短版标记失败。" },
      { id: "VARIANT-RECOVERY-03", label: "恢复版", effect: "提供低压力活动或暂停，不作治疗承诺。" },
      { id: "RETURN-14D-01", label: "14 天重返", effect: "重新确认状态，默认提供低门槛重返版。" },
      { id: "RETURN-FIRST-02", label: "重返第一节", effect: "不以历史负荷作为今天目标。" },
      { id: "RETURN-NEXT-03", label: "重返后下一步", effect: "完成且无未解决风险时，用户选择下一次节奏。" },
      { id: "REVIEW-WEEK-LOW-01", label: "周复盘证据不足", effect: "只陈述事实和缺失信息，不评判进步。" },
      { id: "REVIEW-WEEK-SIGNAL-02", label: "周复盘有可比信号", effect: "可描述相近条件下的稳定或变化，不宣称整体能力已提升。" },
      { id: "REVIEW-MISSION-03", label: "阶段复盘", effect: "在 4-6 周窗口汇总多源证据，用户确认下一 Mission。" }
    ],
    allPersonas: personas,
    personaById: personaById,
    getPersona: function getPersona(id) {
      return prototypes[id] || personaById[id] || null;
    },
    getRule: function getRule(id) {
      return this.ruleCatalog.find(function findRule(rule) { return rule.id === id; }) || null;
    }
  };

  Object.freeze(data.ruleCatalog);
  Object.freeze(data.personas);
  Object.freeze(data);
  global.FitnessPrototypeData = data;
})(window);
