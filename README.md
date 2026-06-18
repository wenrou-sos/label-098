# 💑 婚恋市场数据分析看板系统

> Dating Market Analytics Dashboard - 全方位洞察婚恋市场趋势与规律

[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18.x-61DAFB?logo=react)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?logo=flask)](https://flask.palletsprojects.com/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite)](https://vitejs.dev/)
[![Ant Design](https://img.shields.io/badge/Ant%20Design-5.x-1677FF?logo=antdesign)](https://ant.design/)
[![ECharts](https://img.shields.io/badge/ECharts-5.x-13b2f4?logo=apacheecharts)](https://echarts.apache.org/)

---

## ✨ 系统特色

| 特色 | 说明 |
|------|------|
| 🎯 **5大核心分析模块** | 城市结构 / 择偶偏好 / 内容分析 / 焦虑指数 / 匹配规律 |
| 📊 **专业数据可视化** | 20+种图表类型，交互式展示，洞察直观清晰 |
| 🎨 **现代化UI设计** | Ant Design组件库 + 定制化主题，响应式布局 |
| 🚀 **前后端分离架构** | Flask API + React前端，松耦合、易扩展 |
| 📝 **完整文档体系** | 系统设计文档 + 使用说明，开箱即用 |
| 🔄 **一键数据刷新** | 重新生成模拟数据，验证分析模型鲁棒性 |

---

## 🚀 快速启动（3步）

### ① 启动后端
```bash
cd backend
pip install -r requirements.txt   # 首次运行
python app.py                     # 服务地址: http://localhost:5000
```

### ② 启动前端
```bash
cd frontend
npm install                       # 首次运行
npm run dev                       # 服务地址: http://localhost:3000
```

### ③ 访问系统
浏览器打开 → **http://localhost:3000**

---

## 📦 项目交付物清单

| 类型 | 文件 | 说明 |
|------|------|------|
| 🐍 **后端代码** | `backend/data_generator.py` | 数据生成器（5万用户模拟数据） |
| | `backend/analyzer.py` | 数据分析引擎（5大分析模块实现） |
| | `backend/app.py` | Flask API服务（RESTful接口） |
| | `backend/requirements.txt` | Python依赖清单 |
| ⚛️ **前端代码** | `frontend/src/App.jsx` | 主应用组件 |
| | `frontend/src/components/*.jsx` | 5个可视化分析组件 |
| | `frontend/src/services/api.js` | API请求封装 |
| | `frontend/package.json` | Node依赖清单 |
| 📊 **数据集** | `data/users.csv` | 5万用户基本信息 |
| | `data/preferences.csv` | 择偶偏好数据 |
| | `data/payments.csv` | 付费行为记录 |
| | `data/matches.csv` | 匹配成功记录 |
| 📚 **文档** | `docs/SYSTEM_DESIGN.md` | 系统设计文档（架构/算法/API） |
| | `docs/README.md` | 详细使用说明（FAQ/部署/扩展） |

---

## 🧩 5大分析模块概览

### 1. 🏙️ 城市人口结构分析
- 34个城市男女比例统计
- 识别"男多女少"/"女多男少"城市
- 年龄分布金字塔图对比
- 交互式筛选与排序表格

### 2. 💝 择偶要求差异分析
- 5年龄段 × 2性别 × 4要求类型 多维统计
- 雷达图、柱状图、趋势折线图
- 学历/收入/房产/身高硬性要求对比

### 3. 📝 自我介绍内容分析
- Jieba中文分词 + 停用词过滤
- Top20高频关键词提取
- 35+核心关注点提及率差异
- 男女差异化关注点排行榜

### 4. 😰 婚恋焦虑指数
- 多因素加权综合评分模型
- 各线城市焦虑等级仪表盘
- 付费意愿vs客单价散点分析
- VIP等级分布与城市付费榜

### 5. 💕 脱单成功规律
- 4000+成功案例深度挖掘
- 年龄差/学历差/收入差分布
- 5×5学历/收入组合热力图
- 核心规律指标汇总

---

## 📁 目录结构

```
label-098/
├── backend/           # 🐍 Python后端
├── frontend/          # ⚛️ React前端
├── data/              # 📊 CSV数据集（运行后生成）
├── docs/              # 📚 技术文档
└── .gitignore
```

---

## 📚 详细文档

- 💡 **使用说明**: [docs/README.md](docs/README.md) - 安装步骤、功能指南、FAQ、生产部署
- 🏗️ **系统设计**: [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md) - 架构设计、数据模型、核心算法、API接口

---

## 🛠️ 技术栈深度

### 后端技术选型理由
- **Flask**: 轻量级Web框架，学习成本低，扩展灵活
- **Pandas**: 业内标准数据分析库，向量化运算高效
- **Jieba**: 最优秀的中文分词引擎，处理自我介绍文本
- **NumPy**: 科学计算基础，支撑模拟数据生成与统计计算

### 前端技术选型理由
- **React 18**: 组件化开发，生态成熟，Hooks高效
- **Vite 5**: 极速热更新，开发体验优秀
- **Ant Design 5**: 企业级UI组件库，质量有保障
- **ECharts 5**: 百度开源可视化库，图表类型丰富，中文社区活跃

---

## 🎯 典型应用场景

| 场景 | 使用者 | 价值 |
|------|--------|------|
| 婚恋平台运营 | 产品/运营经理 | 了解用户结构，优化匹配算法 |
| 市场调研公司 | 数据分析师 | 快速生成婚恋市场报告 |
| 学术研究 | 社会学/心理学研究者 | 验证择偶偏好假设 |
| 培训教学 | 数据分析讲师 | 全栈数据分析教学案例 |
| 创业者 | 婚恋领域创业者 | 市场分析与决策依据 |

---

## 🔮 扩展方向

1. **接入真实数据** → 替换模拟数据生成器，对接生产数据库
2. **用户画像体系** → 引入K-Means聚类，构建多维用户标签
3. **智能匹配推荐** → 基于成功规律，训练协同过滤模型
4. **地域GIS地图** → 结合GeoJSON，展示全国婚恋热力分布
5. **时序趋势分析** → 按周/月/季度追踪指标变化
6. **报告导出** → 一键生成PDF/Excel分析报告

---

## ⚖️ 数据声明

⚠️ **本系统所有数据均为算法随机模拟生成的脱敏数据**，不代表任何真实用户或真实婚恋平台。
- 用户ID：U000001 ~ U050000（顺序编号）
- 自我介绍文本：10个模板随机分配（男女各5套）
- 城市、年龄、收入等：基于正态分布和权重随机生成
- 匹配结果：基于合理的年龄/学历/收入相似度加权计算

**使用场景**：仅限数据分析教学演示、可视化效果展示、算法模型验证等非商业用途。

---

## 📞 问题反馈

如遇到任何问题：
1. 先查阅 [docs/README.md](docs/README.md) 中的 **FAQ** 章节
2. 查阅 [docs/SYSTEM_DESIGN.md](docs/SYSTEM_DESIGN.md) 了解实现原理
3. 检查后端控制台日志 + 浏览器开发者工具

---

## 📄 许可证

本项目代码可自由学习、修改和使用。数据均为虚构，请勿用于任何商业目的。

---

**祝使用愉快！愿数据分析为婚恋行业创造更多价值 💝**

*版本: v1.0 | 发布日期: 2026-06-17*
