import { useTheme } from "@/lib/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Moon, Sun } from "lucide-react";

export default function SettingsTab() {
  const { theme, toggleTheme } = useTheme();

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
    </div>
  );
}
