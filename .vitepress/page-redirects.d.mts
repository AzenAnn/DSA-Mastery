export interface PageRedirectRule {
  /** 旧 URL 路径（不含站点 base 前缀），例如 /learn/chapter-06-graph-foundations/00-overview/ */
  from: string;
  /** 主重定向目标（不含站点 base 前缀） */
  to: string;
  /** 附加目标链接，用于一页拆多页的场景 */
  also?: string[];
  /** 展示给读者的说明文字 */
  note?: string;
}

export declare const pageRedirects: PageRedirectRule[];

export declare function redirectPageHtml(
  to: string,
  options?: { base?: string; also?: string[]; note?: string },
): string;

export declare function emitRedirectPages(
  outDir: string,
  options?: { base?: string },
): Promise<void>;
