"use client";
import Script from "next/script";

declare global {
  interface Window {
    chatwootSDK?: {
      run: (opts: { websiteToken: string; baseUrl: string }) => void;
    };
  }
}

export default function SupportWidget() {
  const baseUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL;
  const websiteToken = process.env.NEXT_PUBLIC_CHATWOOT_TOKEN;

  if (!baseUrl || !websiteToken) {
    // 安全回退：如果没有配置，就不渲染脚本，避免报错
    return null;
  }

  return (
    <Script
      src={`${baseUrl}/packs/js/sdk.js`}
      strategy="afterInteractive"
      onLoad={() => {
        try {
          window.chatwootSDK?.run({ websiteToken, baseUrl });
        } catch (e) {
          // 静默失败，避免影响用户页面
          console.error("Chatwoot SDK init error:", e);
        }
      }}
    />
  );
}