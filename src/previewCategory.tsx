import * as React from "react";
import { createRoot } from "react-dom/client";
import CategorySelect, { type CategoryOption } from "@/components/admin/CategorySelect";
import "./index.css";

const OPTIONS: CategoryOption[] = Array.from({ length: 24 }, (_, i) => ({
  value: `Category ${i + 1}`,
  label: `Category ${i + 1}`,
  count: i,
}));

function Preview() {
  const [value, setValue] = React.useState("");
  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <h1 className="font-serif text-2xl">Category picker preview</h1>
      <div style={{ height: "62vh" }} />
      <p className="mb-1 text-sm">Trigger sits low in the viewport:</p>
      <div className="w-72">
        <CategorySelect
          value={value}
          onChange={setValue}
          options={OPTIONS}
          allowCreate
          placeholder="Choose a category"
          searchPlaceholder="Search or add a category..."
          className="w-full"
        />
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Preview />
  </React.StrictMode>,
);
