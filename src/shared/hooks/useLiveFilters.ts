"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function useLiveFilters<T extends Record<string, string>>(initial: T, href: (values: T) => string) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [source, setSource] = useState(JSON.stringify(initial));
  const [dirty, setDirty] = useState(false);
  const [pending, startTransition] = useTransition();
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const composing = useRef(false);
  const signature = JSON.stringify(initial);

  // A completed older search must not overwrite text typed while it was loading.
  if (source !== signature) {
    setSource(signature);
    if (!dirty) setValues(initial);
  }

  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    function restore() {
      clearTimeout(timer.current);
      setValues(initial);
      setDirty(false);
    }
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [initial]);

  function change(patch: Partial<T>, immediate = false) {
    const next = { ...values, ...patch };
    setValues(next);
    setDirty(true);
    clearTimeout(timer.current);
    if (composing.current) return;
    const apply = () => startTransition(() => {
      router.replace(href(next), { scroll: false });
      setDirty(false);
    });
    if (immediate) apply();
    else timer.current = setTimeout(apply, 300);
  }

  return {
    values, change, pending: dirty || pending,
    formProps: {
      onSubmit: (event: React.FormEvent<HTMLFormElement>) => { event.preventDefault(); change({}, true); },
      onCompositionStart: () => { composing.current = true; clearTimeout(timer.current); },
      onCompositionEnd: () => { composing.current = false; change({}); },
    },
  };
}
