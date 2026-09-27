import { useEffect } from "react";

export default function AdBanner() {
  useEffect(() => {
    const script1 = document.createElement("script");
    script1.src = "https://a.magsrv.com/ad-provider.js";
    script1.async = true;
    document.body.appendChild(script1);

    const script2 = document.createElement("script");
    script2.innerHTML = `(AdProvider = window.AdProvider || []).push({"serve": {}});`;
    document.body.appendChild(script2);
  }, []);

  return <ins className="eas6a97888e2" data-zoneid="6041584"></ins>;
}