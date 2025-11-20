import { useState } from "react";

export default function QrCodeCopy({ guest }: any) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(guest.qr_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center gap-2">
      <div
        onClick={copy}
        className="bg-zinc-700 px-2 py-1 rounded text-xs cursor-pointer select-none"
      >
        {guest.qr_code}
      </div>
      {copied && <span className="text-green-400 text-xs">Copied!</span>}
    </div>
  );
}
