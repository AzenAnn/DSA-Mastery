import type { Locator, Page } from "playwright";
import { expect as vitestExpect } from "vitest";

/**
 * Playwright 的 web-first 断言在 vitest 里的等价实现。
 *
 * 导航用例有约五百处 `expect(locator).toX(...)`；逐个改写成 `await expect.poll(...)` 既冗长又容易改错，
 * 所以这里按 subject 分派：Locator / Page 走带重试的 poll 实现，其余原样透传给 vitest 的 expect。
 */

function isLocator(value: unknown): value is Locator {
  return Boolean(value) && typeof value === "object" && typeof (value as Locator).elementHandle === "function";
}

function isPage(value: unknown): value is Page {
  return Boolean(value) && typeof value === "object" && typeof (value as Page).goto === "function";
}

const normalize = (value: string | null): string => (value ?? "").replace(/\s+/gu, " ").trim();

type PollAssertion = ReturnType<typeof vitestExpect.poll>;

function match(assertion: PollAssertion, expected: string | RegExp): Promise<void> {
  return expected instanceof RegExp ? assertion.toMatch(expected) : assertion.toBe(expected);
}

function locatorMatchers(locator: Locator, negated = false) {
  const poll = <T>(read: () => Promise<T>): PollAssertion => {
    const assertion = vitestExpect.poll(read);

    return (negated ? assertion.not : assertion) as PollAssertion;
  };

  return {
    get not() {
      return locatorMatchers(locator, !negated);
    },
    toHaveCount: (count: number) => poll(() => locator.count()).toBe(count),
    toBeVisible: () => poll(() => locator.isVisible()).toBe(true),
    toBeHidden: () => poll(() => locator.isHidden()).toBe(true),
    toBeDisabled: () => poll(() => locator.isDisabled()).toBe(true),
    toBeEnabled: () => poll(() => locator.isEnabled()).toBe(true),
    toBeChecked: () => poll(() => locator.isChecked()).toBe(true),
    toBeFocused: () =>
      poll(() => locator.evaluate((element) => element === element.ownerDocument.activeElement)).toBe(true),
    toBeInViewport: () =>
      poll(() =>
        locator.evaluate((element) => {
          const box = element.getBoundingClientRect();

          return box.bottom > 0 && box.right > 0 && box.top < window.innerHeight && box.left < window.innerWidth;
        }),
      ).toBe(true),
    toHaveText: (expected: string | RegExp | (string | RegExp)[]) =>
      Array.isArray(expected)
        ? poll(() => locator.allTextContents().then((values) => values.map(normalize))).toEqual(expected)
        : match(
            poll(() => locator.textContent().then(normalize)),
            expected,
          ),
    toContainText: (expected: string | RegExp) =>
      expected instanceof RegExp
        ? poll(() => locator.textContent().then(normalize)).toMatch(expected)
        : poll(() => locator.textContent().then(normalize)).toContain(expected),
    toHaveClass: (expected: string | RegExp) =>
      match(
        poll(() => locator.getAttribute("class").then((value) => value ?? "")),
        expected,
      ),
    toHaveAttribute: (name: string, expected?: string | RegExp) =>
      expected === undefined
        ? poll(() => locator.getAttribute(name)).not.toBeNull()
        : match(
            poll(() => locator.getAttribute(name).then((value) => value ?? "")),
            expected,
          ),
    toHaveValue: (expected: string | RegExp) =>
      match(
        poll(() => locator.inputValue()),
        expected,
      ),
  };
}

function pageMatchers(page: Page, negated = false) {
  const poll = <T>(read: () => Promise<T>): PollAssertion => {
    const assertion = vitestExpect.poll(read);

    return (negated ? assertion.not : assertion) as PollAssertion;
  };

  return {
    get not() {
      return pageMatchers(page, !negated);
    },
    // Playwright 的 toHaveURL 除了字符串和正则，还接受 (url: URL) => boolean 形式的谓词。
    toHaveURL: (expected: string | RegExp | ((url: URL) => boolean)) =>
      typeof expected === "function"
        ? poll(async () => expected(new URL(page.url()))).toBe(true)
        : match(
            poll(async () => page.url()),
            expected,
          ),
    toHaveTitle: (expected: string | RegExp) =>
      match(
        poll(() => page.title()),
        expected,
      ),
  };
}

// 交集里的调用签名按顺序解析：Locator/Page 必须排在 vitest 的泛型 expect 之前，否则永远命中泛型那条。
type PlaywrightExpect = ((actual: Locator) => ReturnType<typeof locatorMatchers>) &
  ((actual: Page) => ReturnType<typeof pageMatchers>) &
  typeof vitestExpect;

export const expect = new Proxy(vitestExpect, {
  apply(target, thisArg, args: [unknown, string?]) {
    const [actual] = args;
    if (isLocator(actual)) return locatorMatchers(actual);
    if (isPage(actual)) return pageMatchers(actual);

    return Reflect.apply(target as (...args: unknown[]) => unknown, thisArg, args);
  },
}) as PlaywrightExpect;
