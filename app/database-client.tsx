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
};

type IndicatorStat = { code: string; presentCount: number; strongCount: number; evidenceCount: number };
type ProcessingSummary = { lawCount: number; articleCount: number; codingCount: number; evidenceCount: number; scoredCount: number };

type View = "overview" | "laws" | "indicators";

const statusLabel: Record<string, string> = {
  extracted: "已抽取",
  needs_review: "需校对",
  failed: "待重新读取",
  pending: "待处理",
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "本次工作区" : date.toLocaleString("zh-CN", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export function DatabaseClient({ laws, indicators, indicatorStats, processingSummary, generatedAt }: { laws: Law[]; indicators: Indicator[]; indicatorStats: IndicatorStat[]; processingSummary: ProcessingSummary; generatedAt: string }) {
  const [view, setView] = useState<View>("overview");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [selectedLaw, setSelectedLaw] = useState<Law | null>(null);
  const [selectedIndicator, setSelectedIndicator] = useState<Indicator | null>(null);

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
            <h1>{view === "overview" ? "历史文化名城保护法规数据库" : view === "laws" ? "法规目录与版本管理" : "十四项制度指标编码手册"}</h1>
          </div>
          <div className="top-actions"><span className="sync-dot" /> 数据目录已建立 · {formatDate(generatedAt)}</div>
        </header>

        {view === "overview" && (
          <div className="content overview">
            <section className="hero-panel">
              <div>
                <span className="section-kicker">从文件堆栈到可验证的制度数据</span>
                <h2>让每一个编码结论，<br />都能回到一条法规原文。</h2>
                <p>当前已收录北大法宝目录中的全部文件元数据。正文、条文和制度强度将在完成批量读取后进入证据审查流程。</p>
                <div className="hero-actions">
                  <button className="primary" onClick={() => setView("laws")}>浏览法规目录</button>
                  <button className="secondary" onClick={() => setView("indicators")}>查看编码手册</button>
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
              <article><span>地域单元</span><strong>{cityCount}</strong><small>按法规标题自动识别，待校核</small></article>
              <article><span>条文记录</span><strong>{articleCount}</strong><small>含4份修改决定的全文记录</small></article>
              <article><span>证据回链</span><strong>{processingSummary.evidenceCount}</strong><small>{processingSummary.codingCount}项机器初编 · 待人工复核</small></article>
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

        {view === "indicators" && (
          <div className="content">
            <section className="codebook-intro panel"><div><span className="eyebrow">CODING STANDARD · V0.1</span><h2>统一定义，分级判断，证据优先。</h2></div><p>每项指标记录 presence、strength、article_ref、evidence_text、coding_note、confidence 与 review_status。点击指标查看完整的 0—3 级判定标准。</p></section>
            <section className="indicator-grid">
              {indicators.map((indicator, index) => { const stat = indicatorStats.find((item) => item.code === indicator.code); return <button key={indicator.code} onClick={() => setSelectedIndicator(indicator)}><div className="indicator-top"><span>{String(index + 1).padStart(2, "0")}</span><em>{indicator.code}</em></div><strong>{indicator.name}</strong><p>{indicator.definition}</p><div className="indicator-metric"><small>{stat?.presentCount ?? 0} / {laws.length} 份检出 · {stat?.evidenceCount ?? 0}条证据</small></div><div><small>{indicator.category}</small><b>查看量表 →</b></div></button>; })}
            </section>
          </div>
        )}
      </section>

      {selectedLaw && <div className="modal-backdrop" onMouseDown={() => setSelectedLaw(null)}><section className="drawer" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="法规详情"><button className="close" onClick={() => setSelectedLaw(null)} aria-label="关闭">×</button><span className="eyebrow">LAW RECORD · {selectedLaw.id}</span><h2>{selectedLaw.title}</h2><div className="detail-grid"><div><span>地域</span><strong>{selectedLaw.jurisdiction}</strong></div><div><span>文件类型</span><strong>{selectedLaw.documentType === "amendment" ? "修改决定" : "保护条例"}</strong></div><div><span>条文数量</span><strong>{selectedLaw.articleCount}</strong></div><div><span>加工状态</span><strong>{statusLabel[selectedLaw.extractionStatus] ?? "待处理"}</strong></div><div><span>检出指标</span><strong>{selectedLaw.codedIndicators} / 14</strong></div><div><span>证据回链</span><strong>{selectedLaw.evidenceCount} 条</strong></div></div><h3>来源文件</h3><p className="source-path">北大法宝 / {selectedLaw.sourceFile}</p><div className="notice"><strong>证据状态</strong><p>正文与条文已结构化，制度强度均为关键词证据法生成的机器初编，必须经研究者逐条复核后才能作为正式数据使用。</p></div><button className="primary wide" onClick={() => setSelectedLaw(null)}>返回目录</button></section></div>}

      {selectedIndicator && <div className="modal-backdrop" onMouseDown={() => setSelectedIndicator(null)}><section className="drawer indicator-drawer" onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-label="指标编码标准"><button className="close" onClick={() => setSelectedIndicator(null)} aria-label="关闭">×</button><span className="eyebrow">{selectedIndicator.category} · {selectedIndicator.code}</span><h2>{selectedIndicator.name}</h2><p className="definition">{selectedIndicator.definition}</p><h3>0—3级判定量表</h3><ol className="rubric">{selectedIndicator.rubric.map((item, index) => <li key={item}><i>{index}</i><div><strong>{index === 0 ? "未建立" : index === 1 ? "原则规定" : index === 2 ? "程序明确" : "机制完整"}</strong><span>{item}</span></div></li>)}</ol><div className="notice"><strong>编码要求</strong><p>至少保存一条直接相关的法规原文；若多个条文共同构成制度，分别保存并说明其关系。</p></div></section></div>}
    </main>
  );
}
