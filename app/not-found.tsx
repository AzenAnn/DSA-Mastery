import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found">
      <span>404</span>
      <h1>这页还没有写进教材</h1>
      <p>链接可能已经调整，或者对应 Markdown 尚未加入内容目录。</p>
      <Link className="button button-primary" href="/"><ArrowLeft aria-hidden="true" size={17} />回到首页</Link>
    </main>
  );
}
