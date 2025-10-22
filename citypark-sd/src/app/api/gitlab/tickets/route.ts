import { gitlabFetch, projectRef } from "../../../../lib/gitlab";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const labels = searchParams.get("labels") ?? undefined; // "support,priority::high"
  const state = searchParams.get("state") ?? "opened";
  const page = Number(searchParams.get("page") ?? 1);

  const { data, headers } = await gitlabFetch<any[]>(
    `/projects/${projectRef()}/issues`,
    { searchParams: { labels, state, per_page: 20, page } }
  );

  return Response.json({
    items: data,
    page: Number(headers.get("x-page") ?? 1),
    nextPage: headers.get("x-next-page") ? Number(headers.get("x-next-page")) : null,
    total: Number(headers.get("x-total") ?? 0),
  });
}

export async function POST(req: Request) {
  const body = await req.json();
  // body: { title, description, labels?: string[] | string, assignees?: number[], confidential?: boolean }
  const payload: Record<string, any> = {
    title: body.title,
    description: body.description ?? "",
    labels: Array.isArray(body.labels) ? body.labels.join(",") : body.labels,
    assignee_ids: body.assignees ?? undefined,
    confidential: body.confidential ?? false,
  };

  const { data } = await gitlabFetch(
    `/projects/${projectRef()}/issues`,
    { method: "POST", body: payload }
  );

  return Response.json(data, { status: 201 });
}
