import rawData from "@/data/laws.raw.json";
import codingData from "@/data/codings.raw.json";
import { indicators } from "@/data/indicators";
import { DatabaseClient } from "./database-client";

export const metadata = {
  title: "城保法研｜法规数据库",
  description: "59份历史文化名城保护法规的结构化检索、比较与证据审查平台。",
};

type RawArticle = { ordinal: number; label: string; text: string };

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function structureArticles(fullText: string, articles: RawArticle[]) {
  const chapterPattern = /^第[一二三四五六七八九十百〇零两\d]+章[　\t ]*[^\r\n]*$/gm;
  const firstArticleAt = articles[0] ? fullText.indexOf(articles[0].label) : -1;
  const preamble = firstArticleAt >= 0 ? fullText.slice(0, firstArticleAt) : "";
  const preambleChapters = Array.from(preamble.matchAll(chapterPattern), (match) => match[0].trim());
  let currentTitle = preambleChapters.at(-1) || "正文";
  const chapters: { title: string; articles: { ordinal: number; label: string; content: string }[] }[] = [];

  for (const article of articles) {
    const followingChapters = Array.from(article.text.matchAll(chapterPattern), (match) => match[0].trim());
    const content = article.text
      .replace(chapterPattern, "")
      .replace(new RegExp(`^${escapeRegExp(article.label)}[　\\s]*`), "")
      .trim();

    let chapter = chapters.at(-1);
    if (!chapter || chapter.title !== currentTitle) {
      chapter = { title: currentTitle, articles: [] };
      chapters.push(chapter);
    }
    chapter.articles.push({ ordinal: article.ordinal, label: article.label, content });

    if (followingChapters.length) currentTitle = followingChapters.at(-1)!;
  }

  return chapters;
}

export default function Home() {
  const laws = rawData.laws.map((law) => ({
    ...(() => {
      const items = codingData.codings.filter((coding) => coding.lawId === law.id);
      return {
        codedIndicators: items.filter((coding) => coding.presence === 1).length,
        meanStrength: items.length ? items.reduce((sum, coding) => sum + coding.strength, 0) / items.length : 0,
        evidenceCount: items.reduce((sum, coding) => sum + coding.evidence.length, 0),
      };
    })(),
    id: law.id,
    title: law.title,
    jurisdiction: law.jurisdiction,
    versionYear: law.versionYear,
    versionType: law.versionType,
    documentType: law.documentType,
    sourceFile: law.sourceFile,
    sourceBytes: law.sourceBytes,
    extractionStatus: law.extractionStatus,
    extractionNote: law.extractionNote,
    articleCount: law.articles.length,
    textLength: law.text.length,
    chapters: structureArticles(law.text, law.articles),
  }));

  const indicatorStats = indicators.map((indicator) => {
    const items = codingData.codings.filter((coding) => coding.indicatorCode === indicator.code);
    return {
      code: indicator.code,
      presentCount: items.filter((coding) => coding.presence === 1).length,
      strongCount: items.filter((coding) => coding.strength === 3).length,
      evidenceCount: items.reduce((sum, coding) => sum + coding.evidence.length, 0),
    };
  });

  return <DatabaseClient laws={laws} indicators={indicators} indicatorStats={indicatorStats} processingSummary={codingData.summary} generatedAt={rawData.generatedAt} />;
}
