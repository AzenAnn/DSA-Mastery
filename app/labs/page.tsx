import { ArrowRight, Clock3, FlaskConical, Target } from "lucide-react";
import type { Metadata } from "next";
import { SiteLink as Link } from "@/components/site-link";
import { getChapterGroups, getLabs } from "@/lib/content";

export const metadata: Metadata = {
  title: "动手实验",
  description: "用动手实现、边界测试和对比实验验证数据结构与算法理论。",
};

export default function LabsIndexPage() {
  const groups = getChapterGroups(getLabs());

  return (
    <div className="labs-index">
      <header className="labs-hero">
        <div className="eyebrow"><FlaskConical aria-hidden="true" size={15} />DSA Mastery Labs</div>
        <h1>用实验把理解落到代码上</h1>
        <p>每个 Lab 都与理论章节相互对应，通过实现、测试、观察和复盘，把抽象定义与复杂度分析转化为可以独立验证的能力。</p>
      </header>

      {groups.map((group) => (
        <section className="lab-group" key={group.chapter}>
          <div className="lab-group-heading">
            <span>0{group.chapter}</span>
            <div><small>第 {group.chapter} 章</small><h2>{group.title}</h2></div>
          </div>
          <div className="labs-list">
            {group.entries.map((lab) => (
              <Link className="labs-list-card" href={lab.url} key={lab.url}>
                <span className="lab-card-icon"><FlaskConical aria-hidden="true" size={20} /></span>
                <div className="labs-list-content">
                  <small>{lab.difficulty || "基础"}</small>
                  <h3>{lab.title}</h3>
                  <p>{lab.description}</p>
                  <span><Clock3 aria-hidden="true" size={14} />{lab.duration || "按自己的节奏完成"}<i>·</i><Target aria-hidden="true" size={14} />带验收标准</span>
                </div>
                <ArrowRight aria-hidden="true" size={19} />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
