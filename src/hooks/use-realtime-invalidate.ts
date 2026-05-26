import { useEffect } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

type Sub = {
  table: string;
  schema?: string;
  filter?: string;
  invalidate: QueryKey[];
};

/**
 * Subscribe to Supabase Postgres changes and invalidate React Query keys
 * whenever a row in `table` changes. Pass one or more subscriptions.
 */
export function useRealtimeInvalidate(subs: Sub[], enabled = true) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!enabled || subs.length === 0) return;
    const channel = supabase.channel(
      `rt-${subs.map((s) => s.table).join("-")}-${Math.random().toString(36).slice(2, 8)}`,
    );

    for (const s of subs) {
      channel.on(
        // @ts-expect-error supabase types are narrow here
        "postgres_changes",
        { event: "*", schema: s.schema ?? "public", table: s.table, ...(s.filter ? { filter: s.filter } : {}) },
        () => {
          for (const key of s.invalidate) qc.invalidateQueries({ queryKey: key });
        },
      );
    }

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, JSON.stringify(subs)]);
}
