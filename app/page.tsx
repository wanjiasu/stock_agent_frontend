"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Prism from "@/components/Prism";
import Link from "next/link";
import Image from "next/image";
import CardNav from "@/components/CardNav";
import logo from "@/public/globe.svg";

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
  const [llmModel, setLlmModel] = useState<string>("qwen-plus-latest");
  const [marketType, setMarketType] = useState<string>("美股");
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");

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
        return ["qwen-turbo", "qwen-plus-latest", "qwen-max"];
      case "deepseek":
        return ["deepseek-chat"];
      case "openai":
        return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"];
      default:
        return [] as string[];
    }
  }, [llmProvider]);

  // provider变化或当前模型不在选项中时，自动纠正模型
  useEffect(() => {
    if (!modelOptions.length) return;
    if (!modelOptions.includes(llmModel)) {
      // 首选 qwen-plus-latest，如不存在则取第一个
      const preferred = modelOptions.includes("qwen-plus-latest") ? "qwen-plus-latest" : modelOptions[0];
      setLlmModel(preferred);
    }
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
        let response = await fetch(localUrl);
        
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

  const submitAnalysis = async (e: any) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitLoading(true);
    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
      // If backend base is provided, match user's cURL path `/analyze`; fallback to same-origin router `/api/tradingagents/analyze`
      const endpoint = backendBase ? `${backendBase}/analyze` : "/api/tradingagents/analyze";

      const payload = {
        ticker,
        analysis_date: analysisDate,
        analysts: selectedAnalysts,
        research_depth: researchDepth,
        llm_provider: llmProvider,
        llm_model: llmModel,
        market_type: marketType,
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
      // Persist response for report page
      localStorage.setItem("ta_last_request", JSON.stringify(payload));
      localStorage.setItem("ta_last_response", JSON.stringify(data));
      router.push("/report");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "提交失败";
      setSubmitError(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* 顶部 CardNav（替换原固定导航） */}
      <CardNav
        logo={logo}
        logoAlt="React Bits Logo"
        appName="React Bits"
        topLinks={[
          { label: "Home", href: "/" },
          { label: "Blog", href: "/blog" },
          { label: "Contact", href: "/contact" }
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
          {/* 原 hello 接口显示块 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
              后端API响应
            </h2>

            {loading && (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">加载中...</span>
              </div>
            )}

            {error && (
              <div className="text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                错误: {error}
              </div>
            )}

            {!loading && !error && message && (
              <div className="text-green-600 dark:text-green-400 p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <strong>来自FastAPI的消息:</strong> {message}
              </div>
            )}

            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              这个页面调用了FastAPI后端的 <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">/api/hello</code> 接口
            </div>
          </div>

          {/* 新：交易分析表单 */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">交易分析</h2>
            <form onSubmit={submitAnalysis} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 市场类型 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">市场类型</label>
                  <select
                    value={marketType}
                    onChange={(e) => setMarketType(e.target.value)}
                    className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                    className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder={tickerConfig.placeholder}
                    pattern={tickerConfig.pattern}
                    title={tickerConfig.title}
                    inputMode={tickerConfig.inputMode}
                    required
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    示例: {tickerConfig.examples}
                  </div>
                </div>
                {/* 分析日期 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">分析日期 (YYYY-MM-DD)</label>
                  <input
                    type="date"
                    value={analysisDate}
                    onChange={(e) => setAnalysisDate(e.target.value)}
                    className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                    className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  />
                </div>
                {/* LLM Provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">LLM Provider</label>
                  <select
                    value={llmProvider}
                    onChange={(e) => setLlmProvider(e.target.value)}
                    className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
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
                    className="mt-1 w-full rounded border px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    {modelOptions.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    provider 切换时，模型列表将自动更新。
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">分析模块</label>
                <div className="mt-2 flex flex-wrap gap-3">
                  {[
                    { key: "market", label: "市场" },
                    { key: "fundamentals", label: "基本面" },
                    { key: "news", label: "新闻" },
                    { key: "social", label: "社媒" },
                  ].map((a) => (
                    <label key={a.key} className="inline-flex items-center space-x-2">
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
                <div className="text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                  提交错误: {submitError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitLoading}
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {submitLoading ? "提交中..." : "提交分析并查看报告"}
              </button>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                如果设置了 <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">NEXT_PUBLIC_API_URL</code>，将调用
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{`${process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || ""}/analyze`}</code>；否则调用同源的
                <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">/api/tradingagents/analyze</code>。
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
