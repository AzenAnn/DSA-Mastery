import {
  ArrowRight,
  BookOpen,
  Braces,
  CheckCircle2,
  FlaskConical,
  GitPullRequest,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { getChapterGroups, getLabs, getLessons } from "@/lib/content";

const learningLoop = ["学习", "理解", "解释", "实现", "测试", "讲授", "评审", "改进"];

export default function Home() {
  const lessons = getLessons();
  const labs = getLabs();
  const chapters = getChapterGroups(lessons);

  return (
    <main className="home-page">
      <section className="hero-section">
        <div className="hero-grid">
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles aria-hidden="true" size={15} />一个会随学习一起生长的开源教程</div>
            <h1>把“我好像懂了”<br />变成<span>可以被检验的作品</span></h1>
            <p>
              DSA Lab 是两名学生共同维护的数据结构与算法学习工程。每个知识点都要经历解释、实现、测试与同伴 Review，网站只是这条学习链路的公开出口。
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href={lessons[0]?.url || "/labs"}>
                从第 0 章开始 <ArrowRight aria-hidden="true" size={18} />
              </Link>
              <Link className="button button-secondary" href="/labs">
                <FlaskConical aria-hidden="true" size={18} />浏览实验
              </Link>
            </div>
            <div className="hero-proof">
              <span><CheckCircle2 aria-hidden="true" size={16} />Markdown 单一内容源</span>
              <span><CheckCircle2 aria-hidden="true" size={16} />自动目录与全文搜索</span>
              <span><CheckCircle2 aria-hidden="true" size={16} />人工最终审核</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="项目学习闭环示意">
            <div className="code-window">
              <div className="window-bar"><i /><i /><i /><span>chapter-01-linear-list.md</span></div>
              <div className="code-lines">
                <p><b>---</b></p>
                <p><em>title:</em> <span>线性表</span></p>
                <p><em>chapter:</em> <span>1</span></p>
                <p><em>status:</em> <span>draft</span></p>
                <p><b>---</b></p>
                <p className="code-heading">## 学习目标</p>
                <p>- 描述线性表 ADT</p>
                <p>- 比较顺序表与链表</p>
              </div>
            </div>
            <div className="flow-card flow-card-top"><RefreshCw aria-hidden="true" size={19} /><span>保存 MD</span><strong>自动更新导航</strong></div>
            <div className="flow-card flow-card-bottom"><Braces aria-hidden="true" size={19} /><span>构建网站</span><strong>渲染公式与代码</strong></div>
          </div>
        </div>
        <div className="hero-stats">
          <div><strong>{chapters.length}</strong><span>个起步章节</span></div>
          <div><strong>{lessons.length}</strong><span>篇教程页面</span></div>
          <div><strong>{labs.length}</strong><span>个动手实验</span></div>
          <div><strong>1</strong><span>份内容，多端生长</span></div>
        </div>
      </section>

      <section className="section learning-loop-section">
        <div className="section-heading centered">
          <div className="eyebrow">主动输出，不做笔记仓库</div>
          <h2>每一章都走完完整学习闭环</h2>
          <p>写作与工程实践都服务于理解；如果不能解释、实现和测试，就还没有真正掌握。</p>
        </div>
        <ol className="learning-loop">
          {learningLoop.map((step, index) => (
            <li key={step}><span>{String(index + 1).padStart(2, "0")}</span><strong>{step}</strong>{index < learningLoop.length - 1 ? <ArrowRight aria-hidden="true" size={16} /> : null}</li>
          ))}
        </ol>
      </section>

      <section className="section chapters-section">
        <div className="section-heading split-heading">
          <div>
            <div className="eyebrow">当前内容</div>
            <h2>从共同语言，到第一种结构</h2>
          </div>
          <p>当前只建设第 0 章与第 1 章，用真实的小闭环验证协作方式。通过后再扩展后续章节。</p>
        </div>
        <div className="chapter-card-grid">
          {chapters.map((chapter) => (
            <article className="chapter-card" key={chapter.chapter}>
              <div className="chapter-number">CHAPTER {String(chapter.chapter).padStart(2, "0")}</div>
              <BookOpen aria-hidden="true" className="chapter-icon" size={25} />
              <h3>{chapter.title}</h3>
              <p>{chapter.entries[0]?.description}</p>
              <ul>
                {chapter.entries.slice(0, 4).map((entry) => <li key={entry.url}>{entry.title}</li>)}
              </ul>
              <Link href={chapter.entries[0]?.url || "/"}>进入本章 <ArrowRight aria-hidden="true" size={16} /></Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section labs-preview-section">
        <div className="section-heading split-heading">
          <div>
            <div className="eyebrow">Learning by building</div>
            <h2>每章都有可验收的 Lab</h2>
          </div>
          <Link className="text-link" href="/labs">查看全部实验 <ArrowRight aria-hidden="true" size={16} /></Link>
        </div>
        <div className="lab-card-grid">
          {labs.slice(0, 4).map((lab) => (
            <Link className="lab-card" href={lab.url} key={lab.url}>
              <span className="lab-card-icon"><FlaskConical aria-hidden="true" size={20} /></span>
              <div><small>第 {lab.chapter} 章 · {lab.difficulty || "基础"}</small><h3>{lab.title}</h3><p>{lab.description}</p></div>
              <ArrowRight aria-hidden="true" size={18} />
            </Link>
          ))}
        </div>
      </section>

      <section className="section update-section">
        <div className="update-panel">
          <div>
            <div className="eyebrow">为长期更新而设计</div>
            <h2>新增一篇 Markdown，网站就认识它</h2>
            <p>章节正文不复制进页面代码。只要按契约放入内容目录，构建器会发现、排序、索引并生成对应网址。</p>
            <Link className="button button-secondary" href="/learn/chapter-00-introduction/00-overview">查看教程体验 <ArrowRight aria-hidden="true" size={17} /></Link>
          </div>
          <ol className="update-steps">
            <li><span>01</span><div><strong>创建 Markdown</strong><p>复制相邻页面，填写标题、章节号、顺序与更新时间。</p></div></li>
            <li><span>02</span><div><strong>本地检查</strong><p>保存后检查导航、公式、代码和相对链接是否正确。</p></div></li>
            <li><span>03</span><div><strong>Review 后合并</strong><p>另一名成员验证内容与 Lab，合并后即可自动发布。</p></div></li>
          </ol>
        </div>
      </section>

      <section className="section manifesto-section">
        <GitPullRequest aria-hidden="true" size={30} />
        <h2>正确性 &gt; 更新速度，学习价值 &gt; GitHub Star</h2>
        <p>这个 demo 是一次团队讨论的起点，不是过度承诺的最终产品。</p>
      </section>
    </main>
  );
}
