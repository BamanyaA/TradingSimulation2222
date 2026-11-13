import React, { useMemo } from "react";

interface TradingViewWidgetProps {
  symbol: string;
}

export function TradingViewWidget({ symbol }: TradingViewWidgetProps) {
  const containerId = useMemo(() => `tradingview_${Math.random().toString(36).slice(2, 11)}`, []);

  // Construct iframe URL for the widget
  const iframeUrl = useMemo(() => {
    const baseUrl = "https://s.tradingview.com/widgetembed/";
    const params = new URLSearchParams({
      frameElementId: containerId,
      symbol: symbol,
      interval: "1",
      hidesidetoolbar: "1",
      symboledit: "1",
      saveimage: "1",
      toolbarbg: "f1f3f6",
      theme: "light",
      style: "1",
      timezone: "Etc/UTC",
      locale: "en",
      utm_source: window.location.hostname,
      utm_medium: "widget",
      utm_campaign: "chart"
    });
    return `${baseUrl}?${params.toString()}`;
  }, [symbol, containerId]);

  return (
    <div className="tradingview-widget-container h-full w-full bg-gray-50 flex items-center justify-center relative overflow-hidden">
      <iframe
        id={containerId}
        src={iframeUrl}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        {...{ allowtransparency: "true" } as any}
        scrolling="no"
        allowFullScreen
        title="TradingView Chart"
        className="absolute inset-0"
      />
    </div>
  );
}
