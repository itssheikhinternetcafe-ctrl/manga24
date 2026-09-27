import { useEffect } from "react";

interface AdBannerProps {
  zoneId: string;
  className?: string;
}

export default function AdBanner({ zoneId, className = "eas6a97888e2" }: AdBannerProps) {
  useEffect(() => {
    if (!document.getElementById("magsrv-ad-provider")) {
      const script1 = document.createElement("script");
      script1.id = "magsrv-ad-provider";
      script1.src = "https://a.magsrv.com/ad-provider.js";
      script1.async = true;
      document.body.appendChild(script1);
    }

    const script2 = document.createElement("script");
    script2.innerHTML = `(AdProvider = window.AdProvider || []).push({"serve": {}});`;
    document.body.appendChild(script2);
  }, [zoneId]);

  return <ins className={className} data-zoneid={zoneId}></ins>;
}