# Architecture

> Project: Film Opportunity Radar  
> Version: v0.1 (MVP)  
> Status: In Development  
> Last Updated: 2026-07

---

# 1. 项目概述

## 1.1 项目目标

Film Opportunity Radar 是一个面向影视内容创作者的 AI 辅助工具。

它并不是一个电影资讯网站，而是帮助创作者回答一个更具体的问题：

> **今天有哪些值得做内容的话题？**

系统会自动收集来自影视行业的公开信息，整理成统一的数据，并结合规则计算内容机会（Opportunity），最终为创作者提供值得关注的话题及内容创作方向。

当前版本仅用于验证产品思路，并在个人及少量朋友之间进行测试。

---

## 1.2 MVP 目标

本项目遵循 **MVP（Minimum Viable Product）** 原则。

第一版只实现验证产品价值所需的最小功能。

### 包含功能

- 自动获取影视行业事件
- 整理不同来源的数据
- 获取电影基础信息
- 计算 Opportunity Score
- AI 生成内容创作角度
- Today 页面展示排序后的内容机会
- 本地 Watchlist

### 不包含功能

以下功能明确不属于 V1：

- 用户注册 / 登录
- 云端同步
- 评论系统
- 消息通知
- 推荐算法
- 数据分析后台
- 手机 App
- 支付功能
- 多语言支持

只有当 MVP 得到验证后，再考虑增加新的功能。

---

## 1.3 核心设计原则

整个项目遵循以下原则：

### 保持简单（Keep It Simple）

优先完成可运行的产品，而不是设计复杂架构。

### 单一职责（Single Responsibility）

每个模块只负责一件事情。

例如：

- Collector 负责采集
- AI 负责生成内容
- Opportunity Engine 负责评分

模块之间互不混杂职责。

### AI 负责生成，不负责决策

AI 可以：

- 总结内容
- 提供创作角度
- 生成标题建议

AI 不负责：

- 推荐排序
- Opportunity Score
- 业务规则判断

所有业务规则都由代码实现。

---

# 2. 技术栈

整个项目选择成熟、学习成本低、社区完善的技术方案，方便快速开发和后续维护。

| 层级 | 技术 | 选择原因 |
|------|------|----------|
| 前端 | Next.js | 同时支持页面和 API，降低项目复杂度 |
| UI | React | 主流前端框架 |
| 样式 | Tailwind CSS | 快速构建页面，减少 CSS 编写成本 |
| 组件库 | shadcn/ui | 与 Tailwind 配合良好，易于定制 |
| 后端 | Next.js Route Handlers | 无需额外搭建独立后端 |
| 数据库 | Supabase（PostgreSQL） | 免费额度充足，部署简单 |
| AI | Gemini Flash | 响应速度快，成本较低 |
| 电影数据 | TMDb API | 提供电影元数据 |
| 部署 | Vercel | 与 Next.js 集成简单 |
| 版本管理 | Git + GitHub | 标准开发流程 |

---

## 2.1 为什么选择这套技术

### Next.js

本项目规模较小。

使用 Next.js 可以同时完成：

- 页面开发
- API 开发
- 服务端逻辑

避免维护多个独立项目。

---

### Supabase

相比自行部署数据库，Supabase 更适合作为 MVP。

优势：

- 免费额度足够
- PostgreSQL 功能完整
- 管理界面友好
- 后续可以迁移

---

### Gemini Flash

AI 在本项目中只承担内容生成任务。

相比追求最高模型能力，更关注：

- 响应速度
- 调用成本
- 稳定性

因此选择 Gemini Flash。

如果未来需要更高质量生成，可以替换模型，而无需修改整体架构。

---

## 2.2 当前不会使用的技术

为了控制项目复杂度，当前版本不会引入以下技术：

- Docker
- Redis
- 微服务
- 消息队列
- 向量数据库
- LangChain
- Kubernetes

如果未来业务规模扩大，再重新评估是否需要这些技术。

---

# 3. 系统架构

整个系统采用 **单体架构（Monolithic）**。

前端页面、API 和业务逻辑都由同一个 Next.js 项目管理。

这样可以降低开发和维护成本，更适合个人项目。

整体流程如下：

```text
RSS / YouTube
        │
        ▼
 Event Collector
        │
        ▼
  Event Parser
        │
        ▼
  Rule Engine
        │
        ▼
 TMDb Metadata
        │
        ▼
 AI Generator
        │
        ▼
Opportunity Engine
        │
        ▼
 Today's Opportunities
```

---

## 3.1 架构说明

### Event Collector

负责采集公开数据。

例如：

- RSS
- 官方 YouTube

输出统一的原始事件。MVP RSS 实现位于 `lib/rss/`，临时只读验证端点为 `GET /api/rss`；具体来源、标准化、去重与失败处理规则见 `docs/RSS.md`。

---

### Event Parser

负责整理不同来源的数据。

例如：

- 字段统一
- 日期统一
- 来源统一

最终生成统一的 Event。

---

### Rule Engine

对标准化后的 Event 做轻量过滤，减少进入后续付费环节（TMDb、AI Generator）的事件数量。

例如：

- 去重（重复报道同一事件）
- 过滤与电影无关的内容
- 过滤过旧的事件
- 过滤价值明显很低的简讯

过滤逻辑完全由代码实现，不依赖 AI。这一层不判断"值不值得做内容"，只负责排除明显不需要进入分析环节的事件。

---

### TMDb Metadata

根据电影名称获取更多信息。

例如：

- 海报
- 类型
- 导演
- 演员
- 上映日期

丰富事件内容，为 AI Generator 提供分析所需的上下文。只对通过 Rule Engine 的事件查询，避免浪费调用。

---

### AI Generator

根据 Event 和 TMDb 上下文生成：

- 创作角度
- 内容切入点
- 标题建议
- 简要分析
- 一个定性的编辑重要性信号（`editorialWeight`，如 high / medium / low）

AI 只负责内容生成和提供参考性的定性判断，不计算最终分数，不决定排序。

---

### Opportunity Engine

根据固定规则计算 Opportunity Score。

评分依据包括发布时间、事件类型、时效性等代码规则，并将 AI Generator 产出的 `editorialWeight` 作为其中一个参考因子。

最终的 Score 和 Signal（Peak / Rising / Emerging）完全由代码计算，AI 不直接给出分数或排序。

---

## 3.2 模块关系

模块之间采用单向数据流。

即：

```text
Collector
    ↓
Parser
    ↓
Rule Engine
    ↓
Metadata
    ↓
AI
    ↓
Score
    ↓
Page
```

后面的模块不会反向修改前面的数据。

这样能够保证系统逻辑清晰，也方便后续排查问题。

---

# 4. 数据流（Data Flow）

整个系统的数据处理流程如下。

## Step 1：采集事件

Collector 从公开来源获取原始信息。

输入：

- RSS
- YouTube

输出：

Raw Event

---

## Step 2：标准化

Parser 将不同来源的数据转换成统一格式。

例如统一：

- 标题
- 时间
- 来源
- 描述

输出：

Event

---

## Step 3：规则过滤

Rule Engine 对 Event 做去重和过滤。

排除：

- 与电影无关的内容
- 重复报道
- 过旧的事件
- 价值明显很低的简讯

只有通过过滤的 Event 才会进入下一步。这样可以减少 TMDb 和 AI Generator 的调用量。

---

## Step 4：补充电影信息

根据电影名称查询 TMDb。

补充：

- Poster
- Genres
- Release Date
- Director
- Cast

输出：

完整的 Movie Metadata，供 AI Generator 使用。

---

## Step 5：AI 生成内容建议

AI 根据 Event 和 Movie Metadata 输出：

- 内容创作方向
- 可讨论的话题
- 标题建议
- 简短分析
- 定性的编辑重要性信号（`editorialWeight`）

AI 不输出最终分数，也不判断是否为机会。

---

## Step 6：计算 Opportunity

Opportunity Engine 根据预设规则计算：

Opportunity Score

评分主要参考：

- 事件类型
- 发布时间
- 热度
- 内容价值
- AI Generator 提供的 `editorialWeight`

最终的分数和排序由代码控制，AI 的判断只是其中一个参考因子。

最终结果展示在 Today 页面。

---

# 5. 项目目录

```text
film-opportunity-radar/
│
├── app/                 # 页面与 API
├── components/          # 通用组件
├── services/            # 外部服务（RSS、TMDb、AI）
├── lib/                 # 工具函数
├── types/               # TypeScript 类型
├── public/              # 静态资源
├── docs/                # 项目文档
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   ├── DATA_MODEL.md
│   ├── DESIGN.md
│   └── RSS.md
│
├── README.md
├── AGENTS.md
└── package.json
```

---

## 5.1 目录职责

### app/

负责：

- 页面
- API Route
- 服务端逻辑入口

不负责：

- AI Prompt
- 数据处理逻辑

---

### components/

存放可复用组件。

例如：

- Event Card
- Movie Card
- Opportunity Badge
- Navigation

组件尽量保持独立，避免耦合。

---

### services/

负责所有第三方服务。

例如：

- RSS
- TMDb
- Gemini

所有外部请求统一放在这里。

---

### lib/

存放公共工具函数。

例如：

- 日期处理
- 分数计算
- 文本处理
- 数据转换

避免重复代码。

---

### types/

统一维护 TypeScript 类型。

例如：

- Event
- Movie
- Opportunity

保证整个项目使用一致的数据结构。

字段级契约见 `docs/DATA_MODEL.md`。`lib/mock-opportunities.ts` 中的 mock 数据直接使用 `types/index.ts` 的共享 `Opportunity` 类型；后续实现必须继续扩展该类型，不得创建新的并行模型。

---

### docs/

存放项目文档。

包括：

- 产品需求（PRD）
- 技术架构（Architecture）
- 其他开发文档

所有开发前，应优先阅读此目录中的文档。

# 6. 核心模块

整个系统由六个核心模块组成，各模块职责明确，通过统一的数据结构进行协作。

---

## 6.1 Event Collector

### 职责

负责从公开数据源获取影视事件。

### 输入

- RSS Feed
- 官方 YouTube

### 输出

Raw Event

### 不负责

- AI 分析
- 去重
- 评分
- 数据展示

---

## 6.2 Event Parser

### 职责

将不同来源的数据转换为统一格式。

### 工作内容

- 字段标准化
- 日期格式统一
- 来源统一
- 基础数据清洗

### 输出

Event

Parser 不负责业务判断，只负责数据整理。

---

## 6.3 Rule Engine

### 职责

对 Event 做轻量过滤和去重，减少进入 TMDb 和 AI Generator 的事件数量。

### 工作内容

- 过滤与电影无关的内容
- 去除重复报道
- 过滤过旧的事件
- 过滤价值明显很低的简讯

### 输出

过滤后的 Event 子集

### 不负责

- 判断事件是否值得做内容（这是 AI Generator 和 Opportunity Engine 的工作）
- 计算分数

过滤逻辑全部由代码实现，不依赖 AI。

---

## 6.4 Metadata Service

### 职责

根据电影名称查询 TMDb，补充电影信息。

### 获取内容

- 海报
- 上映日期
- 类型
- 导演
- 演员
- 简介

只对通过 Rule Engine 的 Event 查询。如果未查询到电影，则保留已有事件信息，不中断整个流程。

---

## 6.5 AI Generator

### 职责

基于 Event 和 Movie Metadata 生成适合创作者参考的内容建议。

输出内容包括：

- 创作角度
- 可讨论的话题
- 标题建议
- 简要分析
- 定性的编辑重要性信号（`editorialWeight`：high / medium / low），供 Opportunity Engine 参考

AI 不计算最终分数，不决定排序，不判断事件是否为机会。这些仍然是代码的职责。

---

## 6.6 Opportunity Engine

### 职责

计算每条事件的 Opportunity Score。

评分依据包括：

- 发布时间
- 事件类型
- 内容价值
- 时效性
- AI Generator 提供的 `editorialWeight`（作为参考因子之一，不是唯一依据）

评分逻辑全部由代码实现。AI 的判断只是输入之一，不直接产出最终分数或排序。

---

# 7. 数据库

MVP 使用简单的关系型数据库。

目前仅保留实际需要的数据。

| 数据表 | 用途 |
| ------- | ---- |
| events | 保存标准化后的影视事件 |
| movies | 保存电影元数据 |
| opportunities | 保存评分及 AI 生成内容 |

---

## 数据关系

```text
movies
   │
   │ 1
   │
events
   │
   │ 1
   │
opportunities
```

每个 Event 对应一部电影。

每个 Event 对应一条 Opportunity 记录。

随着项目发展，可以再扩展新的数据表，而不是提前设计复杂数据库。

RSS、Gemini 与 Supabase 之间的最小字段契约见 `docs/DATA_MODEL.md`。RSS 必须保留原始来源 URL 和 ISO 8601 发布时间；Gemini 只生成分析内容，不生成评分或排序。

---

# 8. 开发规范

## 基本原则

- 优先保证代码可读性。
- 保持模块职责单一。
- 避免重复代码。
- 优先简单实现，再考虑优化。

---

## 命名规范

统一使用英文命名。

例如：

- Event
- Movie
- Opportunity
- Collector
- Parser

避免同一概念出现多个名称。

---

## TypeScript

整个项目统一使用 TypeScript。

尽量避免使用 `any`。

公共数据结构统一维护在 `types/` 目录。

---

## 文件组织

每个文件尽量只负责一个功能。

如果一个文件职责明显扩大，应拆分为多个文件。

---

## 第三方依赖

新增依赖前需要确认：

- 是否确实需要？
- 是否已有方案可以实现？
- 是否会增加维护成本？

避免为了一个小功能引入大型库。

---

# 9. AI 协作规范

本项目可能由多个 AI Coding 工具共同开发。

为了保持一致性，所有 AI 都应遵守以下规则。

## 开发前

开始任务前应先阅读：

- README.md
- docs/PRD.md
- docs/ARCHITECTURE.md
- docs/DATA_MODEL.md
- docs/DESIGN.md
- docs/RSS.md
- AGENTS.md（如果存在）

---

## 开发原则

- 仅实现当前任务。
- 不主动修改无关模块。
- 不主动增加新功能。
- 不主动修改技术栈。
- 不主动重构整个项目。

---

## 修改代码时

完成任务后，应说明：

- 修改了哪些文件
- 修改原因
- 是否影响其他模块

---

## 遇到冲突时

如果实现方式与 PRD 或 Architecture 不一致，应优先保持文档一致，并说明原因，而不是自行更改设计。

---

## MVP 原则

始终优先完成最小可用版本。

如果某项功能不影响当前测试，则可以暂缓实现，而不是提前开发。

---

**Architecture.md 到此结束。**
