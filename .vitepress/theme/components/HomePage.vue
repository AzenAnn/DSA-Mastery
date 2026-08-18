<script setup lang="ts">
import {
  ArrowRight,
  BookOpen,
  Braces,
  CheckCircle2,
  FlaskConical,
  GitPullRequest,
  RefreshCw,
  Sparkles,
} from "@lucide/vue";
import { withBase } from "vitepress";
import { courseIndex } from "../course";

const learningLoop = ["理解", "推导", "实现", "测试", "练习", "讲解", "复盘", "迁移"];
const curriculumGroups = [
  { id: "foundations", label: "基础部分", chapters: courseIndex.curriculum.foundations },
  ...courseIndex.curriculum.parts.map((part) => ({ id: part.id, label: `Part ${part.numeral} · ${part.title}`, chapters: part.chapters })),
];
const chapterEntryCount = curriculumGroups.reduce((total, group) => total + group.chapters.length, 0);
const firstLessonUrl = courseIndex.curriculum.url;

function courseHref(path: string): string {
  return withBase(path);
}
</script>

<template>
  <main class="course-home">
    <section class="course-hero">
      <div class="course-hero-grid">
        <div class="course-hero-copy">
          <div class="course-eyebrow">
            <Sparkles aria-hidden="true" :size="15" />
            面向课程高水平掌握的理论与实验教程
          </div>
          <h1>把数据结构与算法<br /><span>学透、做实、用活</span></h1>
          <p>
            DSA Mastery 面向课程学习者，把定义、推导、实现、测试与典型问题训练连成一条完整路径，帮助读者建立能够应对课堂、考试、实验和综合应用的扎实能力。项目由两名学生共同维护，并通过交叉 Review 持续校正内容。
          </p>
          <div class="course-hero-actions">
            <a class="course-button course-button-primary" :href="courseHref(firstLessonUrl)">
              从第 0 章开始 <ArrowRight aria-hidden="true" :size="18" />
            </a>
            <a class="course-button course-button-secondary" :href="courseHref('/labs/')">
              <FlaskConical aria-hidden="true" :size="18" />浏览实验
            </a>
          </div>
          <div class="course-hero-proof">
            <span><CheckCircle2 aria-hidden="true" :size="16" />核心理论与复杂度推导</span>
            <span><CheckCircle2 aria-hidden="true" :size="16" />动手 Lab 与边界测试任务</span>
            <span><CheckCircle2 aria-hidden="true" :size="16" />同伴复核与来源核验</span>
          </div>
        </div>

        <div class="course-hero-visual" aria-label="课程能力形成路径示意" role="img">
          <div aria-hidden="true">
            <div class="course-code-window">
              <div class="course-window-bar"><i /><i /><i /><span>chapter-01-linear-list.md</span></div>
              <div class="course-code-lines">
                <p><b>---</b></p>
                <p><em>title:</em> <span>线性表</span></p>
                <p><em>chapter:</em> <span>1</span></p>
                <p><em>status:</em> <span>draft</span></p>
                <p><b>---</b></p>
                <p class="course-code-heading">## 学习目标</p>
                <p>- 描述线性表 ADT</p>
                <p>- 比较顺序表与链表</p>
              </div>
            </div>
            <div class="course-flow-card course-flow-card-top">
              <RefreshCw :size="19" /><span>理解理论</span><strong>推导性质与复杂度</strong>
            </div>
            <div class="course-flow-card course-flow-card-bottom">
              <Braces :size="19" /><span>完成实验</span><strong>实现并检查边界</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="course-hero-stats">
        <div><strong>{{ chapterEntryCount }}</strong><span>个章节入口</span></div>
        <div><strong>{{ courseIndex.lessons.length }}</strong><span>篇教程页面</span></div>
        <div><strong>{{ courseIndex.labs.length }}</strong><span>个动手实验</span></div>
        <div><strong>1</strong><span>条理论到实践的路径</span></div>
      </div>
    </section>

    <section class="course-section course-learning-section">
      <div class="course-section-heading is-centered">
        <div class="course-eyebrow">理论 × 实验 × 综合训练</div>
        <h2>从理解概念，到独立解决问题</h2>
        <p>每章同时训练定义与推导、算法实现、边界验证和问题迁移；能讲清、能写出、能验证，才算真正掌握。</p>
      </div>
      <ol class="course-learning-loop">
        <li v-for="(step, index) in learningLoop" :key="step">
          <span>{{ String(index + 1).padStart(2, "0") }}</span>
          <strong>{{ step }}</strong>
          <ArrowRight v-if="index < learningLoop.length - 1" aria-hidden="true" :size="16" />
        </li>
      </ol>
    </section>

    <section class="course-section course-chapters-section">
      <div class="course-section-heading is-split">
        <div>
          <div class="course-eyebrow">课程结构</div>
          <h2>从内存基础，到算法思想</h2>
        </div>
        <p>基础部分建立共同语言，六个 Part 依次组织线性结构、树、图、查找、排序与算法思想。</p>
      </div>
      <div v-for="group in curriculumGroups" :key="group.id" class="course-curriculum-group">
        <h3>{{ group.label }}</h3>
        <div class="course-chapter-grid">
          <article v-for="chapter in group.chapters" :key="chapter.id" class="course-chapter-card">
            <div class="course-chapter-number">{{ chapter.label.toUpperCase() }}</div>
            <BookOpen aria-hidden="true" class="course-chapter-icon" :size="25" />
            <h3>{{ chapter.title }}</h3>
            <p>{{ chapter.description }}</p>
            <ul>
              <li v-for="lesson in chapter.lessons.slice(0, 3)" :key="lesson.url">{{ lesson.title }}</li>
              <li v-if="!chapter.lessons.length">内容待完善</li>
            </ul>
            <a :href="courseHref(chapter.url)">
              进入本章 <ArrowRight aria-hidden="true" :size="16" />
            </a>
          </article>
        </div>
      </div>
      <a class="course-button course-button-secondary course-curriculum-link" :href="courseHref(courseIndex.curriculum.url)">
        查看课程总目录 <ArrowRight aria-hidden="true" :size="16" />
      </a>
    </section>

    <section class="course-section course-labs-preview">
      <div class="course-section-heading is-split">
        <div>
          <div class="course-eyebrow">Learning by building</div>
          <h2>每章都有可验收的 Lab</h2>
        </div>
        <a class="course-text-link" :href="courseHref('/labs/')">
          查看全部实验 <ArrowRight aria-hidden="true" :size="16" />
        </a>
      </div>
      <div class="course-lab-grid">
        <a v-for="lab in courseIndex.labs.slice(0, 4)" :key="lab.url" class="course-lab-card" :href="courseHref(lab.url)">
          <span class="course-lab-icon"><FlaskConical aria-hidden="true" :size="20" /></span>
          <span class="course-lab-copy">
            <small>第 {{ lab.chapter }} 章 · {{ lab.difficulty || "基础" }}</small>
            <strong>{{ lab.title }}</strong>
            <span>{{ lab.description }}</span>
          </span>
          <ArrowRight aria-hidden="true" :size="18" />
        </a>
      </div>
    </section>

    <section class="course-section course-update-section">
      <div class="course-update-panel">
        <div>
          <div class="course-eyebrow">为长期更新而设计</div>
          <h2>新增一篇 Markdown，网站就认识它</h2>
          <p>章节正文不复制进页面代码。只要按契约放入内容目录，构建器会发现、排序、索引并生成对应网址。</p>
          <a class="course-button course-button-secondary" :href="courseHref(firstLessonUrl)">
            查看教程体验 <ArrowRight aria-hidden="true" :size="17" />
          </a>
        </div>
        <ol class="course-update-steps">
          <li><span>01</span><div><strong>创建 Markdown</strong><p>复制相邻页面，填写标题、章节号、顺序与更新时间。</p></div></li>
          <li><span>02</span><div><strong>本地检查</strong><p>保存后检查导航、公式、代码和相对链接是否正确。</p></div></li>
          <li><span>03</span><div><strong>Review 后合并</strong><p>另一名成员验证内容与 Lab，合并后由同一内容源统一构建网站。</p></div></li>
        </ol>
      </div>
    </section>

    <section class="course-section course-manifesto">
      <GitPullRequest aria-hidden="true" :size="30" />
      <h2>用扎实理论与过硬实验，走向课程高水平</h2>
      <p>项目不提供押题捷径或分数保证；我们用严谨理论、可复现实验和综合训练，帮助读者把能力练到可以独立验证和迁移。</p>
    </section>
  </main>
</template>
