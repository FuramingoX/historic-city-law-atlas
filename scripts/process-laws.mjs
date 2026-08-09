import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const lawsPath = resolve(root, "data/laws.raw.json");
const codingsPath = resolve(root, "data/codings.raw.json");
const raw = JSON.parse(readFileSync(lawsPath, "utf8").replace(/^\uFEFF/, ""));

const configs = [
  { code: "OBJ", core: ["历史文化街区", "历史地段", "文物保护单位", "历史建筑", "传统风貌建筑", "非物质文化遗产", "古树名木", "历史环境要素"], support: ["保护对象", "传统格局", "历史风貌", "工业遗产", "文化景观"] },
  { code: "BND", core: ["保护范围", "核心保护范围", "建设控制地带", "保护界线", "保护边界"], support: ["划定", "公布", "保护标志", "调整", "图则"] },
  { code: "RESP", core: ["主管部门", "保护责任人", "所有权人", "使用权人", "市人民政府", "县级人民政府"], support: ["负责", "职责", "履行", "管理责任", "第一责任人"] },
  { code: "COORD", core: ["联席会议", "协调机制", "部门协同", "信息共享", "联合执法", "协调机构"], support: ["会同", "有关部门", "按照各自职责", "共同做好", "定期会商"] },
  { code: "PLAN", core: ["保护规划", "专项保护规划"], support: ["编制", "审批", "报批", "公布", "修改", "评估", "国土空间规划"] },
  { code: "PRE", core: ["预先保护", "预保护", "临时保护", "先予保护", "尚未核定公布"], support: ["保护名录", "建议列入", "公告", "期限", "解除"] },
  { code: "REPAIR", core: ["修缮", "迁移", "拆除", "改建", "扩建"], support: ["审批", "批准", "施工方案", "技术审查", "竣工验收", "修复"] },
  { code: "FUND", core: ["保护资金", "专项资金", "财政预算", "保护经费"], support: ["社会资本", "捐赠", "基金", "资金使用", "政府购买服务", "多渠道"] },
  { code: "COMP", core: ["征收补偿", "补偿", "补助", "资助", "奖励"], support: ["税费优惠", "产权置换", "容积率", "利益补偿", "优惠政策"] },
  { code: "RES", core: ["原住居民", "居民参与", "公众参与", "征求意见", "听证"], support: ["利害关系人", "居住条件", "社区", "生活延续", "反馈"] },
  { code: "BIZ", core: ["业态", "经营活动", "商业", "准入", "经营项目"], support: ["负面清单", "禁止经营", "鼓励经营", "限制", "退出"] },
  { code: "DIG", core: ["数字化", "数据库", "电子档案", "动态监测", "监测预警", "信息平台"], support: ["档案", "测绘信息", "信息共享", "数据更新", "风险预警"] },
  { code: "SUP", core: ["社会监督", "公众监督", "举报", "投诉", "信息公开", "专家委员会"], support: ["公开征求意见", "咨询委员会", "处理结果", "监督检查", "社会公众"] },
  { code: "LIAB", core: ["法律责任", "罚款", "没收违法所得", "责令改正", "恢复原状"], support: ["行政处分", "处分", "刑事责任", "信用记录", "赔偿损失"] },
];

function cleanText(text) {
  return text
    .replace(/\n\s*无相关内容\s*\n[\s\S]*$/, "")
    .replace(/\n\s*\*?注：本文格式遵循[\s\S]*$/, "")
    .trim();
}

function splitArticles(text, documentType) {
  const expression = /^\s*(第[〇零一二三四五六七八九十百千两\d]+条(?:之一)?)\s*/gm;
  const matches = [...text.matchAll(expression)];
  if (!matches.length) {
    return documentType === "amendment" && text ? [{ ordinal: 1, label: "全文", text }] : [];
  }
  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? text.length) : text.length;
    return { ordinal: index + 1, label: match[1], text: text.slice(start, end).trim() };
  });
}

function excerptFor(article, term) {
  const index = article.text.indexOf(term);
  const start = Math.max(0, index - 45);
  const end = Math.min(article.text.length, index + term.length + 110);
  return `${start > 0 ? "…" : ""}${article.text.slice(start, end).replace(/\s+/g, " ")}${end < article.text.length ? "…" : ""}`;
}

function encode(law, config) {
  const candidates = law.articles.map((article) => {
    const coreMatches = config.core.filter((term) => article.text.includes(term));
    const supportMatches = config.support.filter((term) => article.text.includes(term));
    return { article, coreMatches, supportMatches, distinct: new Set([...coreMatches, ...supportMatches]) };
  }).filter((item) => item.coreMatches.length > 0);

  const distinctTerms = new Set(candidates.flatMap((item) => [...item.distinct]));
  const coreTerms = new Set(candidates.flatMap((item) => item.coreMatches));
  let strength = 0;
  if (coreTerms.size > 0) strength = 1;
  if (coreTerms.size >= 2 || (coreTerms.size >= 1 && distinctTerms.size >= 3)) strength = 2;
  if (coreTerms.size >= 3 && distinctTerms.size >= 5 && candidates.length >= 2) strength = 3;

  const ranked = [...candidates].sort((a, b) => b.distinct.size - a.distinct.size || a.article.ordinal - b.article.ordinal).slice(0, 3);
  const evidence = ranked.map((item) => {
    const term = item.coreMatches[0];
    return { articleOrdinal: item.article.ordinal, articleLabel: item.article.label, excerpt: excerptFor(item.article, term), matchedTerms: [...item.distinct] };
  });

  return {
    lawId: law.id,
    indicatorCode: config.code,
    presence: strength > 0 ? 1 : 0,
    strength,
    confidence: strength === 0 ? "low" : evidence.length >= 2 && distinctTerms.size >= 3 ? "medium" : "low",
    reviewStatus: "machine_draft",
    codingNote: strength === 0 ? "未检出该指标的核心制度用语，需人工复核是否存在同义表达。" : `机器初编检出 ${coreTerms.size} 个核心用语、${distinctTerms.size} 个相关用语，关联 ${candidates.length} 条证据条文。`,
    evidence,
  };
}

for (const law of raw.laws) {
  law.text = cleanText(law.text);
  law.articles = splitArticles(law.text, law.documentType);
  law.extractionStatus = law.text.length > 500 ? "extracted" : "needs_review";
  law.extractionNote = law.extractionStatus === "extracted" ? "" : "Extracted text is unexpectedly short.";
}

const codings = raw.laws.flatMap((law) => configs.map((config) => encode(law, config)));
const summary = {
  lawCount: raw.laws.length,
  articleCount: raw.laws.reduce((sum, law) => sum + law.articles.length, 0),
  codingCount: codings.length,
  evidenceCount: codings.reduce((sum, coding) => sum + coding.evidence.length, 0),
  scoredCount: codings.filter((coding) => coding.presence === 1).length,
};

raw.generatedAt = new Date().toISOString();
raw.processingSummary = summary;
writeFileSync(lawsPath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");
writeFileSync(codingsPath, `${JSON.stringify({ generatedAt: raw.generatedAt, methodology: "keyword_evidence_v0.1", reviewStatus: "machine_draft", summary, codings }, null, 2)}\n`, "utf8");
console.log(JSON.stringify(summary));
