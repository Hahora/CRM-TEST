import { authService } from "./auth";

export interface ReportParams {
  start_date?: string;
  end_date?: string;
  branch_ids?: number[];
}

export interface DownloadResult {
  blob: Blob;
  filename: string;
}

class ReportsApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    this.baseUrl = this.baseUrl.replace(/\/$/, "");
  }

  private buildParams(params: ReportParams, withBranch = false): URLSearchParams {
    const p = new URLSearchParams();
    if (params.start_date && params.end_date) {
      p.set("start_date", params.start_date);
      p.set("end_date", params.end_date);
    } else {
      p.set("period", "month");
    }
    if (withBranch && params.branch_ids && params.branch_ids.length > 0) {
      for (const id of params.branch_ids) {
        p.append("branch_id", String(id));
      }
    }
    return p;
  }

  private async downloadFile(path: string, params: URLSearchParams, defaultFilename: string): Promise<DownloadResult> {
    const doFetch = async (): Promise<Response> => {
      const token = authService.getAccessToken();
      return fetch(`${this.baseUrl}${path}?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    };

    let response = await doFetch();

    if (response.status === 401) {
      try {
        const newTokens = await authService.refreshToken();
        authService.setTokens(newTokens.access_token, newTokens.refresh_token);
        response = await doFetch();
      } catch {
        authService.clearTokens();
        throw new Error("Сессия истекла");
      }
    }

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      let msg = `Ошибка сервера: ${response.status}`;
      try {
        const json = JSON.parse(text);
        if (json.detail) msg = json.detail;
      } catch { /* ignore */ }
      throw new Error(msg);
    }

    const blob = await response.blob();
    const cd = response.headers.get("Content-Disposition") ?? "";
    const match = cd.match(/filename[^;=\n]*=([^;\n]*)/);
    const filename = match?.[1]?.replace(/["']/g, "").trim() ?? defaultFilename;

    return { blob, filename };
  }

  downloadClients(params: ReportParams): Promise<DownloadResult> {
    return this.downloadFile(
      "/api/v1/reports/clients-changes",
      this.buildParams(params),
      "clients_report.xlsx"
    );
  }

  downloadVisits(params: ReportParams): Promise<DownloadResult> {
    return this.downloadFile(
      "/api/v1/reports/visits-excel",
      this.buildParams(params, true),
      "visits_report.xlsx"
    );
  }

  downloadSales(params: ReportParams): Promise<DownloadResult> {
    return this.downloadFile(
      "/api/v1/reports/sales-excel",
      this.buildParams(params, true),
      "sales_report.xlsx"
    );
  }
}

export const reportsApi = new ReportsApiService();
