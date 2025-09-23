"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchHello = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        console.log("🔍 Debug Info:");
        console.log("- API URL:", apiUrl);
        console.log("- Full request URL:", `${apiUrl}/api/hello`);
        console.log("- Environment:", process.env.NODE_ENV);
        
        const response = await fetch(`${apiUrl}/api/hello`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setMessage(data.message);
      } catch (err) {
        console.error("🚨 Detailed Error Info:");
        console.error("- Error type:", err instanceof Error ? err.constructor.name : typeof err);
        console.error("- Error message:", err instanceof Error ? err.message : String(err));
        console.error("- Full error object:", err);
        
        setError(err instanceof Error ? err.message : "获取数据失败");
      } finally {
        setLoading(false);
      }
    };

    fetchHello();
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-6 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          欢迎来到首页
        </h1>
        
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
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          这个页面调用了FastAPI后端的 <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">/api/hello</code> 接口
        </div>
      </div>
    </div>
  );
}
