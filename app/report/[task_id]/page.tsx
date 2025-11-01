"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./Markdown.module.css";

// ---------------- Typed result structures ----------------
type Decision = {
  action?: string;
  target_price?: number;
  confidence?: number;
  reasoning?: string;
  [key: string]: unknown;
};

type RiskDebateState = {
  risky_history?: string;
  safe_history?: string;
  neutral_history?: string;
  judge_decision?: string;
};

type InvestmentDebateState = {
  bull_history?: string;
  bear_history?: string;
  judge_decision?: string;
};

type ReportState = {
  market_report?: string;
  fundamentals_report?: string;
  sentiment_report?: string;
  news_report?: string;
  risk_assessment?: string;
  investment_plan?: string;
  investment_debate_state?: InvestmentDebateState | string;
  trader_investment_plan?: string;
  risk_debate_state?: RiskDebateState | string;
  final_trade_decision?: string;
  [key: string]: unknown;
};

interface FormattedResults {
  stock_symbol: string;
  analysis_date: string;
  analysts: string[];
  research_depth: number;
  llm_provider: string;
  llm_model: string;
  decision: Decision;
  state: ReportState;
  metadata?: Record<string, unknown>;
}

// 新增：将后端 reports 的键规范化为前端 state 键
function normalizeReportsToState(reports: Record<string, string>): ReportState {
  const map: Record<string, string> = {
    technical_report: "market_report",
    market_report: "market_report",
    fundamentals_report: "fundamentals_report",
    market_sentiment_report: "sentiment_report",
    sentiment_report: "sentiment_report",
    news_report: "news_report",
    news_analysis_report: "news_report",
    risk_assessment_report: "risk_assessment",
    risk_assessment: "risk_assessment",
    investment_plan: "investment_plan",
    investment_debate_state: "investment_debate_state",
    trader_investment_plan: "trader_investment_plan",
    risk_debate_state: "risk_debate_state",
    final_trade_decision: "final_trade_decision",
  };

  const state: ReportState = {};
  Object.entries(reports || {}).forEach(([k, v]) => {
    const nk = map[k] || k; // 未知键保持原样，后续chips会过滤
    // 仅接受字符串Markdown内容
    if (typeof v === "string") {
      // @ts-ignore
      state[nk] = v;
    }
  });
  return state;
}

const MODULE_META: Record<string, { label: string; icon: string }> = {
  market_report: { label: "市场技术分析", icon: "📈" },
  fundamentals_report: { label: "基本面分析", icon: "💰" },
  sentiment_report: { label: "市场情绪分析", icon: "💭" },
  news_report: { label: "新闻事件分析", icon: "📰" },
  risk_assessment: { label: "风险评估", icon: "⚠️" },
  investment_plan: { label: "投资建议", icon: "📋" },
  investment_debate_state: { label: "研究团队决策", icon: "🔬" },
  trader_investment_plan: { label: "交易团队计划", icon: "💼" },
  risk_debate_state: { label: "风险管理团队", icon: "⚖️" },
  final_trade_decision: { label: "最终交易决策", icon: "🎯" },
};

export default function ReportPage() {
  const [data, setData] = useState<FormattedResults | null>(null);
  const [error, setError] = useState<string>("");
  const params = useParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // 从后端按 task_id 获取报告数据
  useEffect(() => {
    const task_id = (params?.task_id as string) || "";
    if (!task_id) {
      setError("缺少任务ID参数");
      return;
    }

    const url = `${API_URL}/reports/by-task/${task_id}`;

    (async () => {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          const detail = await res.json().catch(() => ({} as any));
          throw new Error(detail?.detail || `后端返回错误(${res.status})`);
        }
        const doc = await res.json();
        const state = normalizeReportsToState(doc?.reports || {});

        const formatted: FormattedResults = {
          stock_symbol: doc?.stock_symbol || "",
          analysis_date: doc?.analysis_date || "",
          analysts: Array.isArray(doc?.analysts) ? doc.analysts : [],
          research_depth: Number(doc?.research_depth ?? 0),
          llm_provider: "n/a",
          llm_model: "n/a",
          decision: {},
          state,
          metadata: {
            task_id: doc?.task_id,
            analysis_id: doc?.analysis_id,
            timestamp: doc?.timestamp,
            status: doc?.status,
            source: "fastapi-mongodb",
          },
        };

        setData(formatted);
        setError("");
      } catch (e: any) {
        console.error(e);
        setError(e?.message || "报告数据读取失败");
        // 兼容旧逻辑：如果后端失败，尝试本地缓存
        try {
          const raw = localStorage.getItem("ta_last_response");
          if (raw) {
            const resp = JSON.parse(raw);
            const formatted: FormattedResults | undefined = resp?.formatted_results;
            if (formatted) setData(formatted);
          }
        } catch (_) {}
      }
    })();
  }, [params?.task_id]);

  const chips = useMemo(() => {
    if (!data) return [] as { key: string; label: string; icon: string }[];
    const keys = Object.keys(data.state || {});
    return keys
      .filter((k) => MODULE_META[k])
      .map((k) => ({ key: k, label: MODULE_META[k].label, icon: MODULE_META[k].icon }));
  }, [data]);

  // 英文建议映射（用于括号内显示）
  const englishAction = (action?: string) => {
    if (!action) return "";
    const map: Record<string, string> = { 买入: "Buy", 卖出: "Sell", 持有: "Hold" };
    return map[action] || action;
  };

  // 将文本中的 HTML 换行等替换为 Markdown 友好的换行
  const toMd = (str: string) => {
    return String(str)
      .replace(/\r\n/g, "\n")
      .replace(/<br\s*\/?>(\n)?/gi, "\n")
      .replace(/&nbsp;/gi, " ")
      .trim();
  };

  // 当前激活的模块（默认优先风险管理团队，否则第一个有数据的模块）
  const [activeKey, setActiveKey] = useState<string>("risk_debate_state");

  useEffect(() => {
    if (!data) return;
    const available = Object.keys(data.state || {}).filter((k) => MODULE_META[k]);
    if (!available.length) return;
    if (!available.includes(activeKey)) {
      setActiveKey(available.includes("risk_debate_state") ? "risk_debate_state" : available[0]);
    }
  }, [data]);

  // 渲染函数与UI结构保持不变
  const renderActiveContent = () => {
    if (!data) return null;

    if (activeKey === "risk_debate_state") {
      const v = data.state?.risk_debate_state;
      if (!v) return <div className="text-sm text-gray-500">暂无该模块内容</div>;
      if (typeof v === "string") {
        return (
          <div className={styles.markdownBody}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {toMd(v)}
            </ReactMarkdown>
          </div>
        );
      }
      return (
        <div className="space-y-4 text-sm">
          {v.risky_history && (
            <div>
              <h3 className="font-semibold mb-1">🚀 激进分析师评估</h3>
              <div className={styles.markdownBody}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {toMd(v.risky_history)}
                </ReactMarkdown>
              </div>
            </div>
          )}
          {v.safe_history && (
            <div>
              <h3 className="font-semibold mb-1">🛡️ 保守分析师评估</h3>
              <div className={styles.markdownBody}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {toMd(v.safe_history)}
                </ReactMarkdown>
              </div>
            </div>
          )}
          {v.neutral_history && (
            <div>
              <h3 className="font-semibold mb-1">⚖️ 中性分析师评估</h3>
              <div className={styles.markdownBody}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {toMd(v.neutral_history)}
                </ReactMarkdown>
              </div>
            </div>
          )}
          {v.judge_decision && (
            <div>
              <h3 className="font-semibold mb-1">🎯 投资组合经理最终决策</h3>
              <div className={styles.markdownBody}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {toMd(v.judge_decision)}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      );
    }

    if (activeKey === "investment_debate_state") {
      const v = data.state?.investment_debate_state;
      if (!v) return <div className="text-sm text-gray-500">暂无该模块内容</div>;
      if (typeof v === "string") {
        return (
          <div className={styles.markdownBody}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {toMd(v)}
            </ReactMarkdown>
          </div>
        );
      }
      return (
        <div className="space-y-4 text-sm">
          {v.bull_history && (
            <div>
              <h3 className="font-semibold mb-1">📈 多头研究员分析</h3>
              <div className={styles.markdownBody}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {toMd(v.bull_history)}
                </ReactMarkdown>
              </div>
            </div>
          )}
          {v.bear_history && (
            <div>
              <h3 className="font-semibold mb-1">📉 空头研究员分析</h3>
              <div className={styles.markdownBody}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {toMd(v.bear_history)}
                </ReactMarkdown>
              </div>
            </div>
          )}
          {v.judge_decision && (
            <div>
              <h3 className="font-semibold mb-1">🎯 研究经理综合决策</h3>
              <div className={styles.markdownBody}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {toMd(v.judge_decision)}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      );
    }

    const value = data.state?.[activeKey] as unknown;
    if (!value) return <div className="text-sm text-gray-500">暂无该模块内容</div>;

    if (typeof value === "string") {
      return (
        <div className={styles.markdownBody}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {toMd(value)}
          </ReactMarkdown>
        </div>
      );
    }

    return (
      <pre className="mt-2 text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto">
        {JSON.stringify(value, null, 2)}
      </pre>
    );
  };

  return (
    <div
      className="relative min-h-screen bg-gray-50 dark:bg-gray-900"
      style={{
        backgroundImage:
          "linear-gradient(rgba(0,0,0,0.08), rgba(0,0,0,0.14)), url('/background.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <SiteNav />


      <div className="relative z-10 flex flex-col items-center justify-center p-8 min-h-screen pt-24 md:pt-32">
        <div className="max-w-4xl w-full space-y-6">
          {error && (
            <div className="text-red-600 bg-red-50 p-3 rounded">{error}</div>
          )}

          {data && (
            <div className="space-y-6">
              {/* 顶部：交易团队计划卡片 */}
              <div className="rounded-2xl p-6 md:p-7 bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/70 dark:border-gray-700/60 shadow-sm h-[320px] overflow-y-auto">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">💼</span>
                  <h2 className="text-xl font-semibold">交易团队计划</h2>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">专业交易员制定的具体交易执行计划</p>
                <div className="text-sm">
                  {typeof data.state?.trader_investment_plan === "string" ? (
                    <div className={styles.markdownBody}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {toMd(data.state.trader_investment_plan)}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    "暂无交易团队计划"
                  )}
                </div>
              </div>

              {/* 主报告头部与要点 */}
              <div className="rounded-2xl p-6 md:p-7 bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/70 dark:border-gray-700/60 shadow-sm">
                <h2 className="text-xl font-semibold mb-1">交易分析报告：{data.stock_symbol}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">分析日期：{data.analysis_date}</p>
                <div className="mt-4 text-sm space-y-2">
                  <div>
                    1. 投资建议：<span className="font-medium">{data.decision?.action}</span>
                    {data.decision?.action && (
                      <span className="text-gray-500 ml-1">({englishAction(data.decision.action)})</span>
                    )}
                  </div>
                  <div>
                    2. 目标价位：<span className="font-medium">{data.decision?.target_price != null ? `¥${data.decision.target_price}` : "暂无"}</span>
                  </div>
                  <div>
                    3. 置信度：<span className="font-medium">{data.decision?.confidence != null ? data.decision.confidence : "未知"}</span>
                  </div>
                  {data.decision?.reasoning && (
                    <div className="pt-2 text-gray-700 dark:text-gray-300">
                      <div className={styles.markdownBody}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {toMd(data.decision.reasoning)}
                        </ReactMarkdown>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 模块标签（点击切换下方模块内容） */}
              {chips.length > 0 && (
                <div className="rounded-2xl px-4 py-3 md:px-5 md:py-4 bg-white/70 dark:bg-gray-800/60 backdrop-blur-sm border border-gray-200/70 dark:border-gray-700/60 shadow-sm">
                  <div className="flex flex-wrap gap-2">
                    {chips.map((c) => {
                      const active = c.key === activeKey;
                      return (
                        <button
                          type="button"
                          onClick={() => setActiveKey(c.key)}
                          key={c.key}
                          className={
                            "inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm border transition-colors " +
                            (active
                              ? "bg-purple-600 text-white border-purple-600"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600")
                          }
                        >
                          <span>{c.icon}</span>
                          <span>{c.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 动态模块内容区：根据激活标签展示对应模块内容 */}
              <div className="rounded-2xl p-6 md:p-7 bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/70 dark:border-gray-700/60 shadow-sm h-[420px] overflow-y-auto">
                 <div className="flex items-center gap-2 mb-2">
                   <span className="text-2xl">{MODULE_META[activeKey]?.icon ?? "📄"}</span>
                   <h2 className="text-xl font-semibold">{MODULE_META[activeKey]?.label ?? "报告"}</h2>
                 </div>
                 {activeKey === "risk_debate_state" && (
                   <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">守住净值并优化风险敞口，挖掘适配的投资策略</p>
                 )}
                 {activeKey === "trader_investment_plan" && (
                   <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">专业交易员制定的具体交易执行计划</p>
                 )}
                 <div className="mt-2">{renderActiveContent()}</div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}