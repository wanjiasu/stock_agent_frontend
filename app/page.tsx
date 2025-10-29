"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import Prism from "@/components/Prism";
import Link from "next/link";
import Image from "next/image";
import CardNav from "@/components/CardNav";
import logo from "@/public/globe.svg";
import { toast } from "sonner";

export default function Home() {
  const router = useRouter();

  // Existing hello API demo state
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // New: Analysis form state
  const [ticker, setTicker] = useState<string>("AAPL");
  const [analysisDate, setAnalysisDate] = useState<string>(() => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  });
  const [selectedAnalysts, setSelectedAnalysts] = useState<string[]>(["market", "fundamentals", "news"]);
  const [researchDepth, setResearchDepth] = useState<number>(1);
  const [llmProvider, setLlmProvider] = useState<string>("dashscope");
  const [llmModel, setLlmModel] = useState<string>("qwen-turbor");
  const [marketType, setMarketType] = useState<string>("美股");
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [waitRange, setWaitRange] = useState<string>("");

  // 新增：邮箱弹窗与表单引用
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string>("");
  const [emailError, setEmailError] = useState<string>("");
  const formRef = useRef<HTMLFormElement>(null);

  // 根据市场类型动态设置 Ticker 输入模板（参考 CLI analyze）
  const tickerConfig = useMemo(() => {
    switch (marketType) {
      case "A股":
        return {
          placeholder: "如: 600036 或 000001",
          pattern: "^\\d{6}$",
          title: "A股: 6位数字，例如 600036、000001",
          inputMode: "numeric",
          examples: "000001, 600036, 000858",
        } as const;
      case "港股":
        return {
          placeholder: "如: 0700.HK 或 09988.HK",
          pattern: "^\\d{4,5}(\\.HK)?$",
          title: "港股: 4-5位数字（可选 .HK 后缀），例如 0700.HK",
          inputMode: "numeric",
          examples: "0700.HK, 09988.HK, 03690.HK",
        } as const;
      default:
        return {
          placeholder: "如: AAPL 或 MSFT",
          pattern: "^[A-Za-z]{1,5}$",
          title: "美股: 1-5位字母，例如 AAPL、MSFT",
          inputMode: "text",
          examples: "AAPL, MSFT, NVDA",
        } as const;
    }
  }, [marketType]);

  // 根据 provider 联动模型选项
  const modelOptions = useMemo(() => {
    switch (llmProvider) {
      case "dashscope":
        return ["qwen-turbor", "qwen-plus-latest", "qwen-max"];
      case "deepseek":
        return ["deepseek-chat"];
      case "openai":
        return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"];
      default:
        return [] as string[];
    }
  }, [llmProvider]);

  // provider 变化时，根据映射重置为该 provider 的默认模型（若默认不存在则取第一个）
  useEffect(() => {
    if (!modelOptions.length) return;
    const providerDefaults: Record<string, string> = {
      dashscope: "qwen-turbor",
      openai: "gpt-4o-mini",
    };
    let preferred = providerDefaults[llmProvider];
    if (!preferred || !modelOptions.includes(preferred)) {
      preferred = modelOptions[0];
    }
    setLlmModel(preferred);
  }, [llmProvider, modelOptions]);

  useEffect(() => {
    const fetchHello = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const localUrl = "/api/hello";
        const remoteUrl = apiUrl ? `${apiUrl.replace(/\/$/, "")}/api/hello` : null;
        console.log("🔍 Debug Info:");
        console.log("- API URL:", apiUrl ?? "(same-origin)");
        console.log("- First request URL:", localUrl);
        console.log("- Fallback request URL:", remoteUrl ?? "(none)");
        console.log("- Environment:", process.env.NODE_ENV);
        
        // Try local API first
        const response = await fetch(localUrl);
        
        if (!response.ok) {
          throw new Error(`Local API error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setMessage(data.message);
      } catch (localErr) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        const remoteUrl = apiUrl ? `${apiUrl.replace(/\/$/, "")}/api/hello` : null;
        
        if (remoteUrl) {
          try {
            console.log("➡️ Local API failed, attempting remote:", remoteUrl);
            const response = await fetch(remoteUrl);
            if (!response.ok) {
              throw new Error(`Remote API error! status: ${response.status}`);
            }
            const data = await response.json();
            setMessage(data.message);
            return;
          } catch (remoteErr) {
            console.error("🚨 Detailed Error Info:");
            console.error("- Local API error:", localErr);
            console.error("- Remote API error:", remoteErr);
            setError(remoteErr instanceof Error ? remoteErr.message : "获取数据失败");
          }
        } else {
          console.error("🚨 Detailed Error Info:");
          console.error("- Local API error:", localErr);
          setError(localErr instanceof Error ? localErr.message : "获取数据失败");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchHello();
  }, []);

  const toggleAnalyst = (name: string) => {
    setSelectedAnalysts((prev) => {
      if (prev.includes(name)) {
        return prev.filter((x) => x !== name);
      }
      return [...prev, name];
    });
  };

  const submitAnalysis = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitLoading(true);
    const range = researchDepth === 1 ? "3-5min" : researchDepth === 2 ? "7-12min" : "12-15min";
    setWaitRange(range);
    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
      const endpoint = backendBase ? `${backendBase}/analyze-and-email` : "/api/tradingagents/analyze-and-email";

      const payload = {
        ticker,
        analysis_date: analysisDate,
        analysts: selectedAnalysts,
        research_depth: researchDepth,
        llm_provider: llmProvider,
        llm_model: llmModel,
        market_type: marketType,
        notify_email: userEmail || undefined,
      };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        let detail = await res.text();
        try {
          const json = JSON.parse(detail);
          detail = (json.detail && json.detail.message) ? json.detail.message : (json.detail || detail);
        } catch {}
        throw new Error(`分析请求失败: ${res.status} ${detail}`);
      }

      const data = await res.json();
      localStorage.setItem("ta_last_request", JSON.stringify(payload));
      localStorage.setItem("ta_last_response", JSON.stringify(data));
      if (userEmail) localStorage.setItem("ta_notify_email", userEmail);

      const taskId = data?.task_id as string | undefined;
      const message = data?.message || "任务已进入队列，请稍后";
      toast.success(message, { description: taskId ? `任务ID: ${taskId}` : undefined });
      if (taskId) {
        localStorage.setItem("ta_task_id", taskId);
      }
      // 不跳转到 /report（该端点返回队列任务，不包含报告数据）
      // 用户可稍后访问 /report/task_id 来查看进度/结果
    } catch (err) {
      const msg = err instanceof Error ? err.message : "提交失败";
      setSubmitError(msg);
    } finally {
      setSubmitLoading(false);
      setWaitRange("");
    }
  };

  // 新增：邮箱弹窗提交处理
  const handleEmailSubmit = () => {
    setEmailError("");
    const email = userEmail.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setEmailError("请输入有效邮箱，例如 you@example.com");
      return;
    }
    // 关闭弹窗并触发表单提交
    setShowEmailModal(false);
    formRef.current?.requestSubmit();
  };

  return (
    <div className="relative min-h-screen">
      {/* 顶部 CardNav（替换原固定导航） */}
      <CardNav
        logo={logo}
        logoAlt="TradingAgents"
        appName="TradingAgents"
        topLinks={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: "Contact", href: "#contact" }
        ]}
        items={[
          {
            label: "About",
            bgColor: "#0D0716",
            textColor: "#fff",
            links: [
              { label: "Company", ariaLabel: "About Company", href: "#" },
              { label: "Careers", ariaLabel: "About Careers", href: "#" },
            ],
          },
          {
            label: "Projects",
            bgColor: "#170D27",
            textColor: "#fff",
            links: [
              { label: "Featured", ariaLabel: "Featured Projects", href: "#" },
              { label: "Case Studies", ariaLabel: "Project Case Studies", href: "#" },
            ],
          },
          {
            label: "Contact",
            bgColor: "#271E37",
            textColor: "#fff",
            links: [
              { label: "Email", ariaLabel: "Email us", href: "#" },
              { label: "Twitter", ariaLabel: "Twitter", href: "#" },
              { label: "LinkedIn", ariaLabel: "LinkedIn", href: "#" },
            ],
          },
        ]}
        baseColor="rgba(255, 255, 255, 0.08)"
        menuColor="#fff"
        buttonBgColor="#111"
        buttonTextColor="#fff"
        ease="power3.out"
        showHamburger={false}
      />

      {/* 背景效果层：全屏 Prism */}
      <div className="absolute inset-0 h-full w-full -z-10 pointer-events-none">
        <Prism
          animationType="rotate"
          timeScale={0.5}
          height={3.5}
          baseWidth={5.5}
          scale={3.6}
          hueShift={0}
          colorFrequency={1}
          noise={0}
          glow={1}
          bloom={1}
        />
      </div>

      {/* 前景内容层 */}
      <div className="relative z-10 flex flex-col items-center justify-center p-8 min-h-screen pt-32">
        <div className="max-w-2xl w-full space-y-6">
          {/* slogan和描述展示区块 */}
          <div className="text-center py-8">
            <h1 className="mt-6 text-4xl md:text-5xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
              多团队协作，一次生成可执行交易方案
            </h1>
            <p className="mt-3 text-sm md:text-base text-gray-600 dark:text-gray-300">
              集成研究、风险与交易计划，统一 Markdown 报告，随时复盘
            </p>
          </div>
          

          {/* 新：交易分析表单 */}
          <div className="rounded-2xl p-6 md:p-7 bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm border border-gray-200/70 dark:border-gray-700/60 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">交易分析</h2>
            <form ref={formRef} onSubmit={submitAnalysis} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 市场类型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">市场类型</label>
                  <select
                    value={marketType}
                    onChange={(e) => {
                      const v = e.target.value;
                      setMarketType(v);
                      if (v === "美股") setTicker("AAPL");
                      else if (v === "港股") setTicker("0700.HK");
                      else if (v === "A股") setTicker("000001");
                    }}
                    className="mt-1 w-full rounded-full border border-gray-300/70 dark:border-gray-600/60 px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
                  >
                    <option value="美股">美股</option>
                    <option value="A股">A股</option>
                    <option value="港股">港股</option>
                  </select>
                </div>
                {/* Ticker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Ticker</label>
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      // 统一大写（美股/港股的字母部分）
                      if (marketType === "美股" || marketType === "港股") {
                        setTicker(v.toUpperCase());
                      }
                    }}
                    className="mt-1 w-full rounded-full border border-gray-300/70 dark:border-gray-600/60 px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
                    placeholder={tickerConfig.placeholder}
                    pattern={tickerConfig.pattern}
                    title={tickerConfig.title}
                    inputMode={tickerConfig.inputMode}
                    required
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">示例: {tickerConfig.examples}</div>
                </div>
                {/* 分析日期 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">分析日期 (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={analysisDate}
                    onChange={(e) => setAnalysisDate(e.target.value)}
                    className="mt-1 w-full rounded-full border border-gray-300/70 dark:border-gray-600/60 px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
                    required
                  />
                </div>
                {/* 研究深度 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">研究深度</label>
                  <input
                    type="number"
                    min={1}
                    max={3}
                    step={1}
                    value={researchDepth}
                    onChange={(e) => {
                      const v = parseInt(e.target.value || "1", 10);
                      const clamped = Math.min(3, Math.max(1, isNaN(v) ? 1 : v));
                      setResearchDepth(clamped);
                    }}
                    title="范围：1-3"
                    className="mt-1 w-full rounded-full border border-gray-300/70 dark:border-gray-600/60 px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
                  />
                </div>
                {/* LLM Provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">LLM Provider</label>
                  <select
                    value={llmProvider}
                    onChange={(e) => {
                      const next = e.target.value;
                      setLlmProvider(next);
                      if (next === "dashscope") setLlmModel("qwen-turbor");
                      else if (next === "openai") setLlmModel("gpt-4o-mini");
                    }}
                    className="mt-1 w-full rounded-full border border-gray-300/70 dark:border-gray-600/60 px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
                  >
                    <option value="dashscope">dashscope (阿里百炼)</option>
                    <option value="deepseek">deepseek</option>
                    <option value="openai">openai</option>
                  </select>
                </div>
                {/* LLM Model */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">LLM Model</label>
                  <select
                    value={llmModel}
                    onChange={(e) => setLlmModel(e.target.value)}
                    className="mt-1 w-full rounded-full border border-gray-300/70 dark:border-gray-600/60 px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
                  >
                    {modelOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">provider 切换时，模型列表将自动更新。</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">分析模块</label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {[
                    { key: "market", label: "市场" },
                    { key: "fundamentals", label: "基本面" },
                    { key: "news", label: "新闻" },
                    //{ key: "social", label: "社媒" },
                  ].map((a) => (
                    <label key={a.key} className="inline-flex items-center gap-2 rounded-full border border-gray-300/60 dark:border-gray-600/60 px-3 py-1 text-sm text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={selectedAnalysts.includes(a.key)}
                        onChange={() => toggleAnalyst(a.key)}
                      />
                      <span className="text-gray-700 dark:text-gray-300">{a.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {submitError && (
                <div className="text-red-700 dark:text-red-400 p-3 rounded-lg border border-red-300/60 dark:border-red-700/60 bg-red-50/60 dark:bg-red-900/20">
                  提交错误: {submitError}
                </div>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  disabled={submitLoading}
                  onClick={() => setShowEmailModal(true)}
                  className="rounded-full px-6 md:px-8 py-3 md:py-3.5 bg白 text-gray-900 shadow-sm ring-1 ring-black/5 hover:bg-white/90 disabled:opacity-60"
                >
                  {submitLoading ? "提交中..." : "提交分析并查看报告"}
                </button>
                {submitLoading && (
                  <div className="flex items-center text-gray-700 dark:text-gray-300">
                    <svg
                      className="animate-spin h-4 w-4 mr-2 text-gray-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4A4 4 0 004 12z"></path>
                    </svg>
                    <span className="text-sm">请稍等（预计 {waitRange}）</span>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* 新增：邮箱弹窗 */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg border border-gray-200/70 dark:border-gray-700/60">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">留下邮箱以便提醒</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              生成报告预计需要 10–30 分钟。为了便于我们在结果就绪后及时通知你，请留下你的邮箱。我们仅用于通知，不会泄露或用于其他用途。
            </p>
            <div className="mt-4">
              <input
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="例如：you@example.com"
                className="w-full rounded-full border border-gray-300/70 dark:border-gray-600/60 px-4 py-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm ring-1 ring-black/5 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-500"
              />
              {emailError && (
                <div className="mt-2 text-xs text-red-600 dark:text-red-400">{emailError}</div>
              )}
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="rounded-full px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 ring-1 ring-black/5 hover:bg-gray-200/80"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleEmailSubmit}
                className="rounded-full px-5 py-2.5 bg-black text-white dark:bg-white dark:text-black shadow-sm ring-1 ring-black/5 hover:opacity-90"
              >
                提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
