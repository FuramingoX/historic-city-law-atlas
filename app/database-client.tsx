"use client";

import { useMemo, useState } from "react";
import type { Indicator } from "@/data/indicators";

type Law = {
  id: string;
  title: string;
  jurisdiction: string;
  versionYear: number | null;
  versionType: string;
  documentType: string;
  sourceFile: string;
  sourceBytes: number;
  extractionStatus: string;
  extractionNote: string;
  articleCount: number;
  textLength: number;
  codedIndicators: number;
  meanStrength: number;
  evidenceCount: number;
  chapters: {
    title: string;
    articles: { ordinal: number; label: string; content: string }[];
  }[];
};

type IndicatorStat = { code: string; presentCount: number; strongCount: number; evidenceCount: number };
type ProcessingSummary = { lawCount: number; articleCount: number; codingCount: number; evidenceCount: number; scoredCount: number };
type FieldworkReport = {
  id: string;
  city: string;
  mark: string;
  sample: string;
  method: string;
  overview: string;
  highlights: string[];
  challenges: string[];
  implications: string[];
};

type View = "overview" | "laws" | "research" | "indicators";

const indexDimensions = [
  { name: "保护对象与规范完备", score: 10.5, total: 15 },
  { name: "责任主体与职权配置", score: 11.0, total: 15 },
  { name: "保护措施与程序控制", score: 8.9, total: 20 },
  { name: "资金保障与权益补偿", score: 5.9, total: 15 },
  { name: "合理利用与活化传承", score: 7.7, total: 12 },
  { name: "公众参与与监督问责", score: 6.5, total: 13 },
  { name: "数字治理与动态监测", score: 1.3, total: 10 },
];

const tainingTools = [
  ["协同工单", "把部门职责转化为牵头、配合、时限与反馈节点"],
  ["修缮与补助", "衔接修缮程序、技术服务、资金补助与权益保障"],
  ["业态清单", "以绿、黄、红三级清单引导兼容经营与负面约束"],
  ["一处一档一码", "关联对象档案、修缮记录、巡查信息与公众查询"],
  ["风险闭环", "形成发现、分级、处置、复核和销号的巡查链条"],
  ["居民参与", "嵌入意见收集、办理反馈、绩效公开与社会监督"],
];

const fieldworkReports: FieldworkReport[] = [
  {
    id: "xuzhou",
    city: "徐州",
    mark: "徐",
    sample: "地级市综合保护样本",
    method: "条例全文、配套文件与公开资料分析，结合当地工作人员访谈",
    overview: "徐州以全区域、全要素保护为基础，将历史文化街区、名镇名村、运河遗产、地下文物、红色资源、农业与水利遗产等纳入统一名录，并通过预先保护、部门协同、渐进式微改造和数字化平台推动制度落地。",
    highlights: [
      "建立保护名录与分布图动态调整机制，并对尚未入册但具有价值的资源实施预先保护。",
      "形成市级统筹、部门协同、属地落实的工作格局，住建、文旅文物、自然资源等部门分工衔接。",
      "以“彭城七里”为核心推进微更新，串联黄楼、文庙、回龙窝、户部山等历史节点。",
      "建设古城数字图谱、三维重建与数字体验场景，为档案管理、隐患台账和规划审批提供支撑。",
    ],
    challenges: [
      "偏远点位巡查频次和基层专业能力不足，部分文物本体仍面临积水、边坡与安防等问题。",
      "预先保护的认定时限、产权人沟通及配套细则仍需完善，部门数据标准与共享机制尚未完全统一。",
      "修缮成本、审批流程、基础设施和复杂产权关系，持续影响居民与经营者参与。",
    ],
    implications: [
      "保护范围全面覆盖与保护对象精准认定应同步推进。",
      "明确部门职责的同时，需要把协同机制转化为稳定流程。",
      "刚性保护底线应为适度利用、民生改善和渐进更新保留空间。",
    ],
  },
  {
    id: "chengdu",
    city: "成都",
    mark: "成",
    sample: "首批国家历史文化名城样本",
    method: "政府公开文件、工作报告与权威报道研究，结合四川大学博物馆实地考察",
    overview: "成都的保护实践呈现法规体系、数字治理、跨部门协作、专业力量、资金激励与活化利用相互支撑的特征，为县级名城破解人手、资金和协同不足提供了可拆解的制度参照。",
    highlights: [
      "构建“文物一张图”、安全监测预警、历史建筑数字档案与“锦点”平台等多层次数字体系。",
      "通过法规分工、区级联合巡查和街道—社区—商居联盟，形成跨部门与基层协同网络。",
      "引入高校开展测绘建档、条例论证、文物普查和公众教育，补充专业能力。",
      "以财政预算、专项资金、容积率奖励、修缮奖补和文物保险形成多元保障。",
      "少城、祠堂街与城厢古城以空间管控、业态引导和原住民参与探索活化利用。",
    ],
    challenges: [
      "县级样本普遍存在数字平台、人力配置与常态化协同能力不足的问题。",
      "资金条款若只作原则规定，难以形成稳定、可执行的修缮补助和社会激励。",
      "业态准入需要同时避免过度商业化与简单禁止，兼顾社区生活延续。",
    ],
    implications: [
      "县级立法宜明确数字档案库、监测预警平台及其更新责任。",
      "通过常态化联合巡查和基层协同机制解决多头管理与职责交叉。",
      "以规划刚性管控配合业态柔性引导，实现保护、利用与民生改善的平衡。",
    ],
  },
  {
    id: "linzi",
    city: "淄博·临淄",
    mark: "淄",
    sample: "地下大遗址型县区样本",
    method: "以淄博市临淄区为对象，对保护规划、制度文件与实践资料进行比较研究",
    overview: "临淄区以齐国故城为核心，形成地下大遗址、历史街区、工业遗产与非遗并存的复合体系。其“先考古、后出让”、刚性财政、全域数字监测和司法协同具有鲜明特色，但区级专项条例缺失仍是制度刚性的核心短板。",
    highlights: [
      "建立全域—历史城区—历史文化街区—单体遗产四层空间体系，并以城市紫线实施刚性管控。",
      "在建设用地出让前完成考古勘探，按风险等级差异化管理，发现遗存后采取避让、置换或原址保护。",
      "设置年度专项资金并拓展补助、捐赠、罚没返还和文创反哺等来源。",
      "对重点遗址实施三维扫描、BIM建模和传感监测，配套专职巡查队与网格管理。",
      "通过公安驻队、联席会议、司法保护令、公益诉讼和有奖举报构成协同保护链条。",
    ],
    challenges: [
      "现有成熟机制主要依靠规划和行政文件，缺少区级地方性法规固化。",
      "地下遗址与城市开发冲突时，法定复核、土地置换和补偿程序仍不完整。",
      "原住民修缮补贴、收益分配、社区听证以及齐文化特色业态扶持缺少固定标准。",
      "数字化运维、专业人才和监测经费仍依赖年度安排，长效性不足。",
    ],
    implications: [
      "应区分地下大遗址型与地上活态古城型名城，设置差异化保护、开发和补偿规则。",
      "可将考古前置、量化财政、数字监管、司法协同和紫线管控逐步上升为稳定制度。",
      "泰宁等县域可借鉴其建设前置调查和复合遗产分类保护，同时补强原住民权益。",
    ],
  },
];

const modelThemes = [
  "保护对象体系", "修缮与权利平衡", "传统村落与原住居民",
  "活化利用与业态规制", "数字建档与风险监测", "公众参与与监督问责",
];

const statusLabel: Record<string, string> = {
  extracted: "已抽取",
  needs_review: "需校对",
  failed: "待重新读取",
  pending: "待处理",
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "本次工作区";
  const chinaTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const part = (number: number) => String(number).padStart(2, "0");
  return `${part(chinaTime.getUTCMonth() + 1)}/${part(chinaTime.getUTCDate())} ${part(chinaTime.getUTCHours())}:${part(chinaTime.getUTCMinutes())}`;
}

export function DatabaseClient({ laws, indicators, indicatorStats, processingSummary, generatedAt }: { laws: Law[]; indicators: Indicator[]; indicatorStats: IndicatorStat[]; processingSummary: ProcessingSummary; generatedAt: string }) {
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [selectedLaw, setSelectedLaw] = useState<Law | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);
  const [selectedFieldwork, setSelectedFieldwork] = useState<FieldworkReport | null>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return laws.filter((law) => {
      const matchesQuery = !needle || `${law.title} ${law.jurisdiction} ${law.id}`.toLowerCase().includes(needle);
      const matchesType = type === "all" || law.documentType === type;
      return matchesQuery && matchesType;
    });
  }, [laws, query, type]);

  const regulationCount = laws.filter((law) => law.documentType === "regulation").length;
  const amendmentCount = laws.filter((law) => law.documentType === "amendment").length;
  const articleCount = processingSummary.articleCount;
  const cityCount = new Set(laws.map((law) => law.jurisdiction)).size;
  const categories = Array.from(new Set(indicators.map((item) => item.category)));

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="seal" aria-hidden="true">城</div>
          <div><strong>城保法研</strong><span>法规与制度证据库</span></div>
        </div>
        <nav aria-label="主要导航">
          <button className={view === "overview" ? "active" : ""} onClick={() => setView("overview")}><span>概览</span><b>01</b></button>
          <button className={view === "laws" ? "active" : ""} onClick={() => setView("laws")}><span>法规目录</span><b>{laws.length}</b></button>
          <button className={view === "research" ? "active" : ""} onClick={() => setView("research")}><span>研究成果</span><b>05</b></button>
          <button className={view === "indicators" ? "active" : ""} onClick={() => setView("indicators")}><span>指标体系</span><b>{indicators.length}</b></button>
        </nav>
        <div className="sidebar-note">
          <span className="eyebrow">数据原则</span>
          <p>所有制度判断必须回链到具体条款。机器初编与人工复核分开标记。</p>
        </div>
        <div className="sidebar-foot">研究原型 · 内部审核版</div>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <span className="eyebrow">HISTORIC CITY LAW ATLAS</span>
            <h1>{view === "overview" ? "历史文化名城保护法规数据库" : view === "laws" ? "法规目录与版本管理" : view === "research" ? "从法规证据到制度方案" : "十四项制度指标编码手册"}</h1>
          </div>
          <div className="top-actions"><span className="sync-dot" /> 数据目录已建立 · {formatDate(generatedAt)}</div>
        </header>

        {view === "overview" && (
          <div className="content overview">
            <section className="hero-panel">
              <div>
                <span className="section-kicker">从文件堆栈到可验证的制度数据</span>
                <h2>让每一个结论，<br />都能回到一条法规原文。</h2>
                <p>以法规全文和条文证据为底座，连接指标编码、立法质量评价、地方调研与制度设计，呈现项目从资料加工到成果转化的完整路径。</p>
                <div className="hero-actions">
                  <button className="primary" onClick={() => setView("laws")}>浏览法规目录</button>
                  <button className="secondary" onClick={() => setView("research")}>查看研究成果</button>
                </div>
              </div>
              <div className="status-card">
                <div className="status-head"><span>加工流水线</span><b>第 1 / 4 阶段</b></div>
                <ol>
                  <li className="done"><i>1</i><div><strong>法规目录建库</strong><span>59份文件已登记</span></div></li>
                  <li className="done"><i>2</i><div><strong>正文与条文抽取</strong><span>{articleCount}条记录已结构化</span></div></li>
                  <li className="done"><i>3</i><div><strong>十四指标机器初编</strong><span>{processingSummary.evidenceCount}条证据已回链</span></div></li>
                  <li className="current"><i>4</i><div><strong>双人复核与发布</strong><span>机器初编待人工确认</span></div></li>
                </ol>
              </div>
            </section>

            <section className="stats" aria-label="数据库统计">
              <article><span>法规文件</span><strong>{laws.length}</strong><small>{regulationCount} 部条例 · {amendmentCount} 份修改决定</small></article>
              <article><span>地域单元</span><strong>{cityCount}</strong><small>按法规标题自动识别</small></article>
              <article><span>条文记录</span><strong>{articleCount}</strong><small>含4份修改决定的全文记录</small></article>
              <article><span>证据回链</span><strong>{processingSummary.evidenceCount}</strong><small>{processingSummary.codingCount}项机器初编</small></article>
            </section>

            <section className="research-path panel">
              <div className="path-intro"><span className="eyebrow">RESEARCH PATH</span><h3>一条清晰的成果主线</h3><p>网站不把附件平行堆放，而是按照研究过程将每项成果连接起来。</p></div>
              <button onClick={() => setView("laws")}><i>01</i><strong>法规证据</strong><span>全文、版本与条文回链</span></button>
              <button onClick={() => setView("indicators")}><i>02</i><strong>结构化编码</strong><span>14项核心指标快速检视</span></button>
              <button onClick={() => setView("research")}><i>03</i><strong>质量评价</strong><span>40项指标与全国试测</span></button>
              <button onClick={() => setView("research")}><i>04</i><strong>制度转化</strong><span>实施细则与示范条款</span></button>
            </section>

            <section className="split-grid">
              <article className="panel recent-panel">
                <div className="panel-head"><div><span className="eyebrow">CATALOG</span><h3>最近入库法规</h3></div><button onClick={() => setView("laws")}>查看全部</button></div>
                <div className="compact-list">
                  {laws.slice(0, 6).map((law) => <button key={law.id} onClick={() => setSelectedLaw(law)}><span className="city-mark">{law.jurisdiction.slice(0, 1)}</span><div><strong>{law.title}</strong><small>{law.id} · {(law.sourceBytes / 1024).toFixed(0)} KB</small></div><em>{statusLabel[law.extractionStatus] ?? "待处理"}</em></button>)}
                </div>
              </article>
              <article className="panel framework-panel">
                <div className="panel-head"><div><span className="eyebrow">CODEBOOK</span><h3>制度分析框架</h3></div><button onClick={() => setView("indicators")}>完整手册</button></div>
                <div className="category-grid">
                  {categories.map((category, index) => <div key={category}><span>{String(index + 1).padStart(2, "0")}</span><strong>{category}</strong><small>{indicators.filter((item) => item.category === category).map((item) => item.short).join(" · ")}</small></div>)}
                </div>
              </article>
            </section>
          </div>
        )}

        {view === "laws" && (
          <div className="content">
            <section className="toolbar">
              <label className="search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索法规名称、城市或北大法宝编号" aria-label="搜索法规" /></label>
              <label className="select-label">类型<select value={type} onChange={(event) => setType(event.target.value)}><option value="all">全部文件</option><option value="regulation">保护条例</option><option value="amendment">修改决定</option></select></label>
              <div className="result-count">显示 <b>{filtered.length}</b> / {laws.length}</div>
            </section>
            <section className="law-table panel">
              <div className="table-row table-header"><span>法规与地域</span><span>版本</span><span>类型</span><span>条文</span><span>加工状态</span></div>
              {filtered.map((law) => (
                <button className="table-row" key={law.id} onClick={() => setSelectedLaw(law)}>
                  <span className="law-name"><i>{law.jurisdiction.slice(0, 1)}</i><span><strong>{law.title}</strong><small>{law.id}</small></span></span>
                  <span>{law.versionYear ?? "—"}<small>{law.versionType === "revised" ? "修订" : law.versionType === "amended" ? "修正" : "现有版本"}</small></span>
                  <span>{law.documentType === "amendment" ? "修改决定" : "保护条例"}</span>
                  <span>{law.articleCount || "—"}<small>{law.evidenceCount}条证据</small></span>
                  <span><em className={`status ${law.extractionStatus}`}>{statusLabel[law.extractionStatus] ?? "待处理"}</em></span>
                </button>
              ))}
            </section>
          </div>
        )}

        {view === "research" && (
          <div className="content research-page">
            <section className="research-hero panel">
              <div><span className="eyebrow">PROJECT OUTPUTS</span><h2>研究成果不只是附件汇集，<br />更是研究过程的完整呈现。</h2></div>
              <p>数据库回答“法规写了什么”，评价指数识别“制度强弱在哪里”，地方调研检验“运行中发生了什么”，实施细则与示范条款再把发现转化为可执行方案。</p>
              <nav aria-label="研究成果页内导航"><a href="#index">评价框架</a><a href="#findings">全国发现</a><a href="#conversion">制度转化</a><a href="#fieldwork">地方调研</a></nav>
            </section>

            <section className="result-section" id="index">
              <div className="result-heading"><span>01</span><div><em>附件一</em><h2>历史文化名城保护指数 · 试测版 1.2</h2><p>在网站的14项核心制度编码之上，建立适合深度评价的40项三级指标，并把立法质量与实施效能分开测量。</p></div></div>
              <div className="index-architecture">
                <article><span>数据库快速编码</span><strong>14</strong><p>用于大样本检索、横向比较和条文证据定位。</p></article>
                <article><span>立法质量子指数</span><strong>100<small>分 · 70%</small></strong><p>七个维度、40项三级指标，采用A—E等级评分。</p></article>
                <article><span>实施效能子指数</span><strong>100<small>分 · 30%</small></strong><p>通过访谈、现场观察和多级证据补足“纸面规则”之外的运行表现。</p></article>
              </div>
              <div className="method-note"><strong>质量控制</strong><span>证据分为 I—IV 级；区分缺失与不适用；实行双人编码，并以加权 Kappa / ICC 检验一致性，开展权重 ±20% 敏感性分析。</span></div>
            </section>

            <section className="result-section findings-section" id="findings">
              <div className="result-heading"><span>02</span><div><em>附件二</em><h2>中国历史文化名城保护立法指数报告</h2><p>对现有法规进行去重、校核与试测，呈现立法质量的总体水平、结构差异与共同短板。</p></div></div>
              <div className="findings-layout">
                <div className="finding-summary panel"><div><span>有效现行文本</span><strong>53</strong></div><div><span>平均得分</span><strong>51.8</strong></div><div><span>中位数</span><strong>52.9</strong></div><p>试测样本含11部县域法规与42部省、市法规。县域样本平均46.1分，省、市样本平均53.3分。</p></div>
                <div className="dimension-bars panel">{indexDimensions.map((item) => <div key={item.name}><div><span>{item.name}</span><b>{item.score.toFixed(1)} / {item.total}</b></div><i><em style={{ width: `${item.score / item.total * 100}%` }} /></i></div>)}</div>
              </div>
              <div className="finding-callout"><strong>共同薄弱环节</strong><span>资金与补偿、公众意见反馈、数字治理。报告据此提出权利保障、协同流程、风险闭环、参与反馈、数字治理和周期评估六类改进方向。</span></div>
            </section>

            <section className="result-section" id="conversion">
              <div className="result-heading"><span>03</span><div><em>附件三</em><h2>泰宁：从法规接口到执行闭环</h2><p>以《三明市泰宁历史文化名城保护条例》为基础，将“原则上有规定”进一步拆解为责任人、办理时限、执行标准、留痕证据与逾期升级机制。</p></div></div>
              <div className="conversion-grid">{tainingTools.map(([title, description], index) => <article key={title}><span>{String(index + 1).padStart(2, "0")}</span><strong>{title}</strong><p>{description}</p></article>)}</div>
              <div className="legal-boundary"><strong>成果定位</strong><p>实施细则及配套材料为项目研究稿，建议以县级政府规范性文件等适当形式承接；不得脱离上位法新增行政许可、处罚或减损权利。</p></div>
            </section>

            <section className="result-section" id="fieldwork">
              <div className="result-heading"><span>04</span><div><em>附件四</em><h2>徐州、成都与淄博·临淄调研报告</h2><p>以地级市综合保护、超大城市系统治理和地下大遗址型县区为三类样本，检验法规制度在协同、数字化、资金、活化利用与权益保障中的实际运行。</p></div></div>
              <div className="fieldwork-grid">
                {fieldworkReports.map((report) => <article key={report.id}><i>{report.mark}</i><span>{report.sample}</span><h3>{report.city}</h3><p>{report.overview}</p><button onClick={() => setSelectedFieldwork(report)}>阅读调研报告 <b aria-hidden="true">→</b></button></article>)}
              </div>
            </section>

            <section className="result-section model-section">
              <div className="result-heading"><span>05</span><div><em>附件五</em><h2>县域历史文化名城保护示范条款库</h2><p>围绕县域治理特点整理可组合、可检索的制度模块，为地方立法论证提供条款素材，而不是将研究稿冒充现行法规。</p></div></div>
              <div className="model-themes">{modelThemes.map((theme, index) => <article key={theme}><span>{String(index + 1).padStart(2, "0")}</span><strong>{theme}</strong></article>)}</div>
              <div className="legal-boundary"><strong>使用说明</strong><p>本成果属于研究建议稿。具体采用时，应结合地方立法权限、上位法依据、行政资源和本地保护对象实际进行逐条论证。</p></div>
            </section>
          </div>
        )}

        {view === "indicators" && (
          <div className="content">
            <section className="codebook-intro panel"><div><span className="eyebrow">CODING STANDARD · V0.1</span><h2>统一定义，分级判断，证据优先。</h2></div><p>每项指标记录 presence、strength、article_ref、evidence_text、coding_note、confidence 与 review_status。点击指标查看完整的 0—3 级判定标准。</p></section>
            <section className="indicator-grid">
              {indicators.map((indicator, index) => { const stat = indicatorStats.find((item) => item.code === indicator.code); return <button key={indicator.code} onClick={() => setSelectedIndicator(indicator)}><div className="indicator-top"><span>{String(index + 1).padStart(2, "0")}</span><em>{indicator.code}</em></div><strong>{indicator.name}</strong><p>{indicator.definition}</p><div className="indicator-metric"><small>{stat?.presentCount ?? 0} / {laws.length} 份检出 · {stat?.evidenceCount ?? 0}条证据</small></div><div><small>{indicator.category}</small><b>查看量表 →</b></div></button>; })}
            </section>
          </div>
        )}
      </section>

      {selectedLaw && <div className="modal-backdrop"><button className="modal-dismiss" onClick={() => setSelectedLaw(null)} aria-label="关闭法规全文" /><section className="drawer law-drawer" role="dialog" aria-modal="true" aria-label="法规全文"><button className="close" onClick={() => setSelectedLaw(null)} aria-label="关闭">×</button><span className="eyebrow">LAW RECORD · {selectedLaw.id}</span><h2>{selectedLaw.title}</h2><div className="detail-grid"><div><span>地域</span><strong>{selectedLaw.jurisdiction}</strong></div><div><span>文件类型</span><strong>{selectedLaw.documentType === "amendment" ? "修改决定" : "保护条例"}</strong></div><div><span>条文数量</span><strong>{selectedLaw.articleCount}</strong></div><div><span>加工状态</span><strong>{statusLabel[selectedLaw.extractionStatus] ?? "待处理"}</strong></div><div><span>检出指标</span><strong>{selectedLaw.codedIndicators} / 14</strong></div><div><span>证据回链</span><strong>{selectedLaw.evidenceCount} 条</strong></div></div><div className="fulltext-head"><div><span className="eyebrow">FULL TEXT</span><h3>法规全文</h3></div><span>共 {selectedLaw.articleCount} 条</span></div><nav className="chapter-index" aria-label="章节目录">{selectedLaw.chapters.map((chapter, index) => <a key={`${chapter.title}-${index}`} href={`#law-${selectedLaw.id}-chapter-${index}`}>{chapter.title}<small>{chapter.articles.length} 条</small></a>)}</nav><div className="law-fulltext">{selectedLaw.chapters.map((chapter, index) => <section key={`${chapter.title}-${index}`} id={`law-${selectedLaw.id}-chapter-${index}`} className="law-chapter"><h3>{chapter.title}</h3>{chapter.articles.map((article) => <article key={article.ordinal} className="law-article"><strong>{article.label}</strong><div>{article.content.split("\n").filter(Boolean).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}</div></article>)}</section>)}</div><h3>来源文件</h3><p className="source-path">北大法宝 / {selectedLaw.sourceFile}</p><div className="notice"><strong>文本说明</strong><p>本页展示数据库从来源文件中结构化提取的全部条文。研究引用前请与正式公布文本复核。</p></div><button className="primary wide" onClick={() => setSelectedLaw(null)}>返回目录</button></section></div>}

      {selectedIndicator && <div className="modal-backdrop"><button className="modal-dismiss" onClick={() => setSelectedIndicator(null)} aria-label="关闭指标编码标准" /><section className="drawer indicator-drawer" role="dialog" aria-modal="true" aria-label="指标编码标准"><button className="close" onClick={() => setSelectedIndicator(null)} aria-label="关闭">×</button><span className="eyebrow">{selectedIndicator.category} · {selectedIndicator.code}</span><h2>{selectedIndicator.name}</h2><p className="definition">{selectedIndicator.definition}</p><h3>0—3级判定量表</h3><ol className="rubric">{selectedIndicator.rubric.map((item, index) => <li key={item}><i>{index}</i><div><strong>{index === 0 ? "未建立" : index === 1 ? "原则规定" : index === 2 ? "程序明确" : "机制完整"}</strong><span>{item}</span></div></li>)}</ol><div className="notice"><strong>编码要求</strong><p>至少保存一条直接相关的法规原文；若多个条文共同构成制度，分别保存并说明其关系。</p></div></section></div>}

      {selectedFieldwork && <div className="modal-backdrop"><button className="modal-dismiss" onClick={() => setSelectedFieldwork(null)} aria-label="关闭调研报告" /><section className="drawer fieldwork-drawer" role="dialog" aria-modal="true" aria-label={`${selectedFieldwork.city}调研报告`}><button className="close" onClick={() => setSelectedFieldwork(null)} aria-label="关闭">×</button><span className="eyebrow">ATTACHMENT 04 · FIELDWORK</span><h2>{selectedFieldwork.city}调研报告</h2><div className="fieldwork-meta"><span>样本定位</span><strong>{selectedFieldwork.sample}</strong><span>材料与方法</span><strong>{selectedFieldwork.method}</strong></div><p className="fieldwork-overview">{selectedFieldwork.overview}</p><section className="report-section"><h3>核心制度与实践</h3><ul>{selectedFieldwork.highlights.map((item) => <li key={item}>{item}</li>)}</ul></section><section className="report-section"><h3>观察到的难点</h3><ul>{selectedFieldwork.challenges.map((item) => <li key={item}>{item}</li>)}</ul></section><section className="report-section"><h3>对县级立法的启示</h3><ul>{selectedFieldwork.implications.map((item) => <li key={item}>{item}</li>)}</ul></section><div className="notice"><strong>研究说明</strong><p>本页对项目调研成果进行结构化整理，保留报告的样本边界与研究方法，不将调研材料表述为现行法规结论。</p></div><button className="primary wide" onClick={() => setSelectedFieldwork(null)}>返回研究成果</button></section></div>}
    </main>
  );
}
