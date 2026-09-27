import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { useLiveFilters } from "./useLiveFilters";

const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));
const initial = { q: "", status: "all" };
const href = (values: typeof initial) => `/items?${new URLSearchParams(values)}`;

beforeEach(() => { vi.useFakeTimers(); replace.mockClear(); });
afterEach(() => vi.useRealTimers());

test("debounces changes, combines filters, and replaces rather than pushes history", () => {
  const { result } = renderHook(() => useLiveFilters(initial, href));
  act(() => result.current.change({ q: "a" }));
  act(() => vi.advanceTimersByTime(200));
  act(() => result.current.change({ q: "alpha" }));
  act(() => vi.advanceTimersByTime(299));
  expect(replace).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(replace).toHaveBeenCalledExactlyOnceWith("/items?q=alpha&status=all", { scroll: false });
  act(() => result.current.change({ status: "read" }, true));
  expect(replace).toHaveBeenLastCalledWith("/items?q=alpha&status=read", { scroll: false });
});

test("preserves newer typing when an earlier search response arrives", () => {
  const { result, rerender } = renderHook(({ value }) => useLiveFilters(value, href), { initialProps: { value: initial } });
  act(() => result.current.change({ q: "a" }, true));
  act(() => result.current.change({ q: "alpha" }));
  rerender({ value: { ...initial, q: "a" } });
  expect(result.current.values.q).toBe("alpha");
  act(() => vi.advanceTimersByTime(300));
  rerender({ value: { ...initial, q: "alpha" } });
  expect(result.current.values.q).toBe("alpha");
  rerender({ value: { ...initial, q: "external" } });
  expect(result.current.values.q).toBe("external");
});

test("clear and Enter cancel a queued search, and back navigation cancels pending input", () => {
  const { result } = renderHook(() => useLiveFilters(initial, href));
  act(() => result.current.change({ q: "stale" }));
  act(() => result.current.change(initial, true));
  act(() => vi.advanceTimersByTime(400));
  expect(replace).toHaveBeenCalledExactlyOnceWith("/items?q=&status=all", { scroll: false });
  act(() => result.current.change({ q: "submit" }));
  const preventDefault = vi.fn();
  act(() => result.current.formProps.onSubmit({ preventDefault } as unknown as React.FormEvent<HTMLFormElement>));
  act(() => vi.advanceTimersByTime(400));
  expect(preventDefault).toHaveBeenCalledOnce();
  expect(replace).toHaveBeenCalledTimes(2);
  act(() => result.current.change({ q: "cancel" }));
  act(() => window.dispatchEvent(new PopStateEvent("popstate")));
  act(() => vi.advanceTimersByTime(400));
  expect(replace).toHaveBeenCalledTimes(2);
  expect(result.current.values.q).toBe("");
});

test("waits for composed text and clears timers when leaving the page", () => {
  const { result, unmount } = renderHook(() => useLiveFilters(initial, href));
  act(() => result.current.formProps.onCompositionStart());
  act(() => result.current.change({ q: "composed" }));
  act(() => vi.advanceTimersByTime(400));
  expect(replace).not.toHaveBeenCalled();
  act(() => result.current.formProps.onCompositionEnd());
  act(() => vi.advanceTimersByTime(300));
  expect(replace).toHaveBeenCalledExactlyOnceWith("/items?q=composed&status=all", { scroll: false });
  act(() => result.current.change({ q: "cancel" }));
  unmount();
  act(() => vi.advanceTimersByTime(400));
  expect(replace).toHaveBeenCalledOnce();
});
