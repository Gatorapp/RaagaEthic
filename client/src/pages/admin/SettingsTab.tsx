"use client";

import { useRef, useState } from "react";
import { useTheme } from "@/lib/theme-provider";
import { useAdmin } from "@/lib/admin-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Download, Moon, Sun, Upload } from "lucide-react";

export default function SettingsTab() {
  const { theme, toggleTheme } = useTheme();
  const { adminKey } = useAdmin();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [busyAction, setBusyAction] = useState<"export" | "import" | null>(null);

  const exportInventory = async () => {
    setBusyAction("export");
    try {
      const res = await fetch("/api/admin/products/export", {
        headers: { "x-admin-key": adminKey || "" },
      });
      if (!res.ok) {
        const message = (await res.text()).replace(/^\d+:\s*/, "");
        throw new Error(message || "Export failed");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") || "";
      const fileName = disposition.match(/filename=([^;]+)/)?.[1] || `inventory-${new Date().toISOString().slice(0, 10)}.json`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName.replace(/(^\"|\"$)/g, "");
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      toast({ title: "Inventory exported" });
    } catch (error) {
      toast({
        title: "Export failed",
        description: error instanceof Error ? error.message : "Could not export inventory",
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
    }
  };

  const importInventory = async (file: File) => {
    setBusyAction("import");
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { products?: unknown[] };
      const products = parsed?.products;

      if (!products || !Array.isArray(products) || products.length === 0) {
        throw new Error("The selected file does not contain any products");
      }

      const res = await apiRequest(
        "POST",
        "/api/admin/products/import",
        { products, replaceExisting },
        { "x-admin-key": adminKey || "" },
      );
      const result = await res.json();

      queryClient.invalidateQueries({ queryKey: ["/api/admin/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });

      toast({
        title: "Inventory imported",
        description: `${result.imported} products processed`,
      });
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Could not import inventory",
        variant: "destructive",
      });
    } finally {
      setBusyAction(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="font-serif text-xl">Settings</h2>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            Current theme: <span className="font-medium text-foreground">{theme === "dark" ? "Dark" : "Light"}</span>
          </p>
          <Button onClick={toggleTheme} variant="outline" className="gap-2" data-testid="button-settings-theme-toggle">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            Switch to {theme === "dark" ? "Light" : "Dark"} Mode
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inventory Transfer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Export products from this store as JSON, then import into another environment.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={exportInventory}
              variant="outline"
              className="gap-2"
              disabled={busyAction !== null}
              data-testid="button-settings-export-inventory"
            >
              <Download className="h-4 w-4" />
              {busyAction === "export" ? "Exporting..." : "Export Inventory"}
            </Button>

            <Button
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
              disabled={busyAction !== null}
              data-testid="button-settings-import-inventory"
            >
              <Upload className="h-4 w-4" />
              {busyAction === "import" ? "Importing..." : "Import Inventory"}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importInventory(file);
              }}
            />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="replace-inventory"
              checked={replaceExisting}
              onCheckedChange={(checked) => setReplaceExisting(Boolean(checked))}
              data-testid="checkbox-settings-replace-existing"
            />
            <Label htmlFor="replace-inventory" className="text-sm">
              Replace existing inventory on import (deletes current products first)
            </Label>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
