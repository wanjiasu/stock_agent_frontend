"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface FormattedResults {
  stock_symbol: string;
  analysis_date: string;
  analysts: string[];
  research_depth: number;
  llm_provider: string;
  llm_model: string;
  decision: Record<string, any>;
  state: Record<string, any>;
  metadata?: Record<string, any>;
}

export default function ReportPage() {
  const [data, setData] = useState<FormattedResults | null>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ta_last_response");
      if (!raw) {
        setError("没有找到报告数据，请先在首页提交分析。");
        return;
      }
      const resp = JSON.parse(raw);
      const formatted: FormattedResults | undefined = resp?.formatted_results;
      if (!formatted) {
        setError("分析已完成，但未返回格式化报告。请检查后端或网络配置。");
        return;
      }
      setData(formatted);
    } catch (e) {
      setError("报告数据读取失败");
    }
  }, []);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">分析报告</h1>
          <Link href="/" className="text-blue-600 hover:underline">返回首页</Link>
        </div>

        {error && (
          <div className="text-red-600 bg-red-50 p-3 rounded">{error}</div>
        )}

        {data && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded shadow p-6">
              <h2 className="text-xl font-semibold">基本信息</h2>
              <div className="mt-3 text-sm text-gray-700 dark:text-gray-300">
                <div>Ticker: <code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">{data.stock_symbol}</code></div>
                <div>分析日期: <code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">{data.analysis_date}</code></div>
                <div>模型提供商: <code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">{data.llm_provider}</code></div>
                <div>模型: <code className="px-2 py-1 rounded bg-gray-100 dark:bg-gray-700">{data.llm_model}</code></div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded shadow p-6">
              <h2 className="text-xl font-semibold">最终决策</h2>
              <pre className="mt-3 whitespace-pre-wrap text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto">{JSON.stringify(data.decision, null, 2)}</pre>
            </div>

            {Object.entries(data.state || {}).map(([key, value]) => (
              <div key={key} className="bg-white dark:bg-gray-800 rounded shadow p-6">
                <h3 className="text-lg font-semibold">{key}</h3>
                {typeof value === "string" ? (
                  <div className="mt-2 text-sm whitespace-pre-wrap">{value}</div>
                ) : (
                  <pre className="mt-2 text-sm bg-gray-50 dark:bg-gray-900 p-3 rounded overflow-auto">{JSON.stringify(value, null, 2)}</pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}