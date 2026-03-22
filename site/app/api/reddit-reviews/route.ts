import { NextRequest, NextResponse } from "next/server";

const API_TOKEN = process.env.APIFY_API_TOKEN!;

export async function POST(req: NextRequest) {
  const { cardName } = await req.json();

  const runRes = await fetch(
    `https://api.apify.com/v2/acts/lexis-solutions~reddit-answers-scraper/runs?token=${API_TOKEN}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questions: [`${cardName} credit card review reddit`],
        proxyConfiguration: {
          useApifyProxy: true,
          apifyProxyGroups: ["RESIDENTIAL"],
        },
      }),
    }
  );

  const runData = await runRes.json();
  const runId = runData.data.id;
  const datasetId = runData.data.defaultDatasetId;

  // Poll until finished
  while (true) {
    const statusRes = await fetch(
      `https://api.apify.com/v2/actor-runs/${runId}?token=${API_TOKEN}`
    );
    const statusData = await statusRes.json();
    const status = statusData.data.status;

    if (status === "SUCCEEDED") break;
    if (status === "FAILED" || status === "ABORTED" || status === "TIMED-OUT") {
      return NextResponse.json({ error: `Run ${status}` }, { status: 500 });
    }

    await new Promise((r) => setTimeout(r, 3000));
  }

  const resultsRes = await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?token=${API_TOKEN}`
  );
  const results = await resultsRes.json();

  return NextResponse.json(results[0] ?? { sections: [] });
}
