const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

type TimingDetails = Record<string, string | number | boolean>;

export function logOpportunityTiming(
  stage: string,
  startedAt: number,
  details: TimingDetails = {},
): void {
  if (!IS_DEVELOPMENT) return;

  const elapsedMs = Math.round(performance.now() - startedAt);
  const detailText = Object.entries(details)
    .map(([key, value]) => `${key}=${value}`)
    .join(" ");

  console.info(
    `[opportunities] ${stage} elapsed=${elapsedMs}ms${detailText ? ` ${detailText}` : ""}`,
  );
}

