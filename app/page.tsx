"use client";

import { useState, useEffect } from "react";
import Prism from "@/components/Prism";
import Link from "next/link";
import Image from "next/image";
import CardNav from "@/components/CardNav";
import logo from "@/public/globe.svg";

export default function Home() {
  const [message, setMessage] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

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
    </div>
  );
}
