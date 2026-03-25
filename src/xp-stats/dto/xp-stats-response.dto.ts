export class XpStatsResponseDto {
  totalXp: number;
  period: string;
  startDate: Date;
  endDate: Date;
  logs: {
    id: string;
    amount: number;
    source: string;
    createdAt: Date;
  }[];
}
