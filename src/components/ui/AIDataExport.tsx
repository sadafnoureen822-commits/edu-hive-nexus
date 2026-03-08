import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, FileSpreadsheet, FileText, Loader2, ChevronDown, ChevronUp, X,
} from "lucide-react";
import { exportToExcel, exportToWord } from "@/lib/export-utils";
import { toast } from "sonner";

interface AIDataExportProps {
  /** All data available in this portal/section — will be sent as context to AI */
  contextData: Record<string, unknown>[];
  /** Label shown on the trigger button */
  label?: string;
  /** Title used in the Word document heading */
  exportTitle?: string;
  /** Base filename (no extension) */
  fileName?: string;
}

export default function AIDataExport({
  contextData,
  label = "AI Export",
  exportTitle = "Data Export",
  fileName = "export",
}: AIDataExportProps) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Record<string, unknown>[] | null>(null);
  const [exporting, setExporting] = useState<"excel" | "word" | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) { toast.error("Please enter a prompt first"); return; }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-data-export", {
        body: { prompt: prompt.trim(), data: contextData },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResult(data.data);
      toast.success(`${data.data.length} row${data.data.length !== 1 ? "s" : ""} ready for export`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "AI failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleExcelExport = async () => {
    const rows = result ?? contextData;
    if (!rows.length) { toast.error("No data to export"); return; }
    setExporting("excel");
    try {
      exportToExcel(rows, exportTitle, fileName);
      toast.success("Excel file downloaded");
    } finally {
      setExporting(null);
    }
  };

  const handleWordExport = async () => {
    const rows = result ?? contextData;
    if (!rows.length) { toast.error("No data to export"); return; }
    setExporting("word");
    try {
      await exportToWord(rows, exportTitle, fileName);
      toast.success("Word document downloaded");
    } finally {
      setExporting(null);
    }
  };

  const reset = () => {
    setResult(null);
    setPrompt("");
  };

  return (
    <div className="relative">
      {/* Trigger button */}
      <Button
        size="sm"
        variant="outline"
        className="gap-2 h-8 text-xs border-primary/30 text-primary hover:bg-primary/5"
        onClick={() => setOpen((v) => !v)}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {label}
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </Button>

      {/* Dropdown panel */}
      {open && (
        <Card className="absolute right-0 top-10 z-50 w-[360px] shadow-xl border-border/60">
          <CardContent className="p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold">AI Data Export</span>
              </div>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Describe what you want to export — the AI will filter and format the data.
            </p>

            {/* Prompt textarea */}
            <Textarea
              placeholder='e.g. "Show all students with attendance below 75%" or "List all active courses with their status"'
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="text-xs min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate();
              }}
            />

            {/* Generate button */}
            <Button
              size="sm"
              className="w-full gap-2 text-xs"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {loading ? "Generating…" : "Generate with AI"}
            </Button>

            {/* Result preview */}
            {result && (
              <div className="rounded-md bg-muted/40 border border-border/50 p-2.5">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-muted-foreground">Preview</span>
                  <div className="flex items-center gap-1.5">
                    <Badge variant="secondary" className="text-[10px] h-4 px-1.5">
                      {result.length} row{result.length !== 1 ? "s" : ""}
                    </Badge>
                    <button onClick={reset} className="text-muted-foreground hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto max-h-[120px] overflow-y-auto">
                  <table className="text-[10px] w-full">
                    <thead>
                      <tr>
                        {Object.keys(result[0] ?? {}).map((k) => (
                          <th key={k} className="text-left px-1.5 py-0.5 font-semibold text-muted-foreground whitespace-nowrap border-b border-border/40">
                            {k}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.slice(0, 5).map((row, i) => (
                        <tr key={i} className="even:bg-muted/30">
                          {Object.values(row).map((v, j) => (
                            <td key={j} className="px-1.5 py-0.5 whitespace-nowrap text-foreground/80">
                              {String(v ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                      {result.length > 5 && (
                        <tr>
                          <td colSpan={Object.keys(result[0]).length} className="px-1.5 py-1 text-muted-foreground text-center">
                            +{result.length - 5} more rows…
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Export buttons — always show, uses result if available else contextData */}
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8 border-green-500/30 text-green-700 hover:bg-green-500/5"
                onClick={handleExcelExport}
                disabled={exporting !== null || (contextData.length === 0 && !result)}
              >
                {exporting === "excel"
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <FileSpreadsheet className="h-3.5 w-3.5" />}
                Spreadsheet
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs h-8 border-blue-500/30 text-blue-700 hover:bg-blue-500/5"
                onClick={handleWordExport}
                disabled={exporting !== null || (contextData.length === 0 && !result)}
              >
                {exporting === "word"
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  : <FileText className="h-3.5 w-3.5" />}
                Word Doc
              </Button>
            </div>

            <p className="text-[10px] text-muted-foreground text-center">
              Without AI prompt, exports {contextData.length} row{contextData.length !== 1 ? "s" : ""} of raw data
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
