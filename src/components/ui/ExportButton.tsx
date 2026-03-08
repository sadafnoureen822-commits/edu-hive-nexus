import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportToExcel } from "@/lib/export-utils";

interface ExportButtonProps {
  data: Record<string, unknown>[];
  sheetName?: string;
  fileName: string;
  label?: string;
  disabled?: boolean;
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "outline" | "secondary" | "ghost";
}

export default function ExportButton({
  data,
  sheetName = "Sheet1",
  fileName,
  label = "Export Excel",
  disabled = false,
  size = "sm",
  variant = "outline",
}: ExportButtonProps) {
  return (
    <Button
      size={size}
      variant={variant}
      disabled={disabled || !data.length}
      onClick={() => exportToExcel(data, sheetName, fileName)}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {label}
    </Button>
  );
}
