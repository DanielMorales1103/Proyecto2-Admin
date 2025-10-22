// app/api/gitlab/labels/route.ts
import { gitlabFetch, projectRef } from "../../../../lib/gitlab";

export const dynamic = "force-dynamic";

type GitLabLabel = {
  id: number;
  name: string;
  color?: string;
  description?: string;
};

export async function GET() {
  try {
    const { data } = await gitlabFetch<GitLabLabel[]>(
      `/projects/${projectRef()}/labels`,
      { searchParams: { per_page: 100, with_counts: true } }
    );

    const labels = data.map(l => ({
      id: l.id,
      name: l.name,
      color: l.color ?? "#1f6feb",
      description: l.description ?? "",
    }));

    return Response.json({ labels }, { status: 200 });
  } catch (e: any) {
    return Response.json({ labels: [], error: String(e?.message ?? e) }, { status: 500 });
  }
}
