export default function SiteFooter() {
  return (
    <footer id="contact" className="relative z-10 mt-0 w-full">
      <div className="w-full px-0">
        <div className="w-full rounded-none p-6 md:p-7 bg-white/80 dark:bg-gray-800/70 backdrop-blur-sm border-t border-gray-200/70 dark:border-gray-700/60 shadow-sm flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">TradingAgents</h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">多团队协作，一次生成可执行交易方案</p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">©2025 TradingAgents. All rights reserved.</p>
            <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">粤</div>
          </div>
          <div className="text-sm text-gray-700 dark:text-gray-300 flex flex-col gap-2">
            <span className="font-medium">联系方式</span>
            <a className="hover:underline" href="mailto:support@tradingagents.app">support@tradingagents.app</a>
            <a className="hover:underline" href="https://twitter.com/tradingagents" target="_blank" rel="noopener noreferrer">Twitter</a>
            <a className="hover:underline" href="https://www.linkedin.com/company/tradingagents" target="_blank" rel="noopener noreferrer">LinkedIn</a>
          </div>
        </div>
      </div>
    </footer>
  );
}