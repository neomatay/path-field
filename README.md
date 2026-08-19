# PATH / FIELD

一个训练旅程向导类的健身工具：**把训练决策建立在分级证据上**——发生了什么（事实）、能观察到什么（观察）、还不能下什么结论（待确认）、由你决定（决策）——用带编号的透明规则陪你做每一个决定：今天练完整版还是短版、这周该不该加重。

> 服务训练旅程所有阶段的人：还没开始的、中断后想回来的、想建立规律的、想精进的。你在哪个阶段由你自己声明，产品不定级、不筛选用户。

## 在线试用

**https://neomatay.github.io/path-field/**

本地优先：数据只存在你设备的浏览器里（IndexedDB），可随时导出 JSON。建议手机浏览器打开后"添加到主屏幕"当 App 用。

## 仓库结构

```
├── app/                        # v0.2 应用（React 19 + TS + Vite PWA）
│   └── src/
│       ├── core/               # 领域核心：7 个领域对象 + 规则引擎（纯 TS，100% 单测）
│       ├── data/               # 动作库（要点/起始建议/替换表）+ 三条路径的计划模板
│       ├── store/              # IndexedDB 本地存储
│       └── ui/                 # 屏幕：今天 / 旅程（路线地图）/ 记录 / 训练 / 收据
├── V1_PRODUCT_CONTRACT.md      # 产品合同（对象模型、安全红线、规则清单）
├── DESIGN.md                   # 视觉系统：国家公园海报语言 + 证据几何标记
├── ROADMAP_v0_2.md             # 当前版本范围与里程碑
├── 05-decisions/               # 架构决策记录（ADR）
├── *-v0-*.html                 # 设计原型（海报样稿、流程原型，可直接浏览器打开）
└── *.md                        # 产品框架 / 市场研究 / 验证计划
```

## 本地开发

```bash
cd app
npm install
npm run dev        # http://localhost:5173/path-field/
npm test           # 领域规则单元测试（vitest）
npm run build      # 生产构建（含 PWA）
```

## 核心规则（可审计）

每条规则带编号，UI 上可追溯，核心包 23 个单元测试覆盖红线：

- `SAFE-URGENT-01/02/03` — 安全分流：urgent 锁死完整版、caution 阻断加重、"未回答"≠安全
- `VARIANT-FULL/SHORT/RECOVERY/USER-04` — 完整/短版/恢复版推荐（三个版本都是主路）
- `RETURN-14D/FIRST/NEXT` — 中断重返（不显示断练天数、不补债）
- `REVIEW-WEEK-LOW/SIGNAL/BOUNDARY` — 周复盘（可比较条件、单次不做结论）
- 进阶：同 RPE 档完成目标次数上限 → 候选 +2.5kg，**永不自动生效，由用户确认**
