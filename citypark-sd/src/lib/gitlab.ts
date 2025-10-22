import { env, assertServerEnv } from "./env";

export type GitLabFetchOpts = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  searchParams?: Record<string, string | number | boolean | undefined>;
  body?: any;
  signal?: AbortSignal;
};

function isNumericId(v: string) {
  return /^\d+$/.test(v);
}

export function projectRef(): string {
  if (!env.GITLAB_PROJECT_ID) throw new Error("GITLAB_PROJECT_ID not set");
  return isNumericId(env.GITLAB_PROJECT_ID)
    ? env.GITLAB_PROJECT_ID
    : encodeURIComponent(env.GITLAB_PROJECT_ID);
}

export async function gitlabFetch<T>(
  path: string,
  opts: GitLabFetchOpts = {}
): Promise<{ data: T; headers: Headers }> {
  assertServerEnv();

  const base = env.GITLAB_API!.replace(/\/+$/, ""); // sin slash final
  const url = new URL(`${base}${path}`);

  if (opts.searchParams) {
    for (const [k, v] of Object.entries(opts.searchParams)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "PRIVATE-TOKEN": env.GITLAB_TOKEN as string,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `GitLab ${res.status} ${res.statusText} for ${url}\n${text}`
    );
  }

  const headers = res.headers;
  const data = (await res.json()) as T;
  return { data, headers };
}
