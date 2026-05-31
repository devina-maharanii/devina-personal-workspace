import { db } from "@/lib/db";
import { subDays, format } from "date-fns";
import type { ChartDataPoint } from "./AiUsageChart";
import AiUsageChartWrapper from "./AiUsageChartWrapper";

interface AiUsageChartContainerProps {
  organizationId: string;
}

export default async function AiUsageChartContainer({ organizationId }: AiUsageChartContainerProps) {
  // Query 90 days of usage log summaries to feed all filter options (7d, 30d, 90d)
  const ninetyDaysAgo = subDays(new Date(), 90);

  const logs = await db.aiUsageLog.findMany({
    where: {
      organizationId,
      createdAt: { gte: ninetyDaysAgo },
    },
    select: {
      promptTokens: true,
      completionTokens: true,
      totalTokens: true,
      cost: true,
      createdAt: true,
    },
  });

  // Group logs in memory by formatted date string
  const groupedData: Record<string, ChartDataPoint> = {};

  logs.forEach((log) => {
    const dateStr = format(log.createdAt, "yyyy-MM-dd");
    if (!groupedData[dateStr]) {
      groupedData[dateStr] = {
        date: dateStr,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
        cost: 0,
      };
    }
    groupedData[dateStr].promptTokens += log.promptTokens;
    groupedData[dateStr].completionTokens += log.completionTokens;
    groupedData[dateStr].totalTokens += log.totalTokens;
    groupedData[dateStr].cost += log.cost;
  });

  const chartData: ChartDataPoint[] = Object.values(groupedData);

  return <AiUsageChartWrapper data={chartData} />;
}
