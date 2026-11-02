import { useState } from "react";
import { createRoot } from "react-dom/client";
import CategoryManager from "./components/admin/CategoryManager";
import { STORE_CATEGORIES, extraCategories } from "./components/admin/CategorySelect";
import "./index.css";

function Demo() {
  const [saved, setSaved] = useState<string[]>(["Buttabomma Custom Made", "Wall decor yellow"]);
  const productCategories = useState<(string | null)[]>(["Brass collection", null])[0];
  return (
    <div className="p-8">
      <CategoryManager
        categories={extraCategories(saved)}
        productCategories={productCategories}
        existingNames={[...STORE_CATEGORIES, ...saved, ...productCategories.map((p) => p ?? "")]}
        onAdd={async (name) => { setSaved((previous) => [...previous, name]); return name; }}
        onRemove={async (name) => { setSaved((previous) => previous.filter((c) => c !== name)); }}
      />
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Demo />);
