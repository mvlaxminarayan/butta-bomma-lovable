import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";

export interface CheckoutDetails {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  instructions: string;
}

const EMPTY: CheckoutDetails = {
  name: "", email: "", phone: "", address: "", city: "", state: "", zip: "", instructions: "",
};

const STORAGE_KEY = "checkout_details";

export const checkoutSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name").max(120),
  email: z.string().trim().email("Enter a valid email address").max(255),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"),
  address: z.string().trim().min(6, "Enter your house number and street").max(300),
  city: z.string().trim().min(2, "Enter your city or town").max(100),
  state: z.string().trim().min(2, "Enter your state").max(100),
  zip: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit PIN code"),
  instructions: z.string().trim().max(500).optional().or(z.literal("")),
});

interface Props {
  total: string;
  isLoading: boolean;
  onBack: () => void;
  onSubmit: (details: CheckoutDetails) => void;
}

const CheckoutForm = ({ total, isLoading, onBack, onSubmit }: Props) => {
  const { user, profile } = useAuth();
  const [form, setForm] = useState<CheckoutDetails>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    let saved: Partial<CheckoutDetails> = {};
    try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { /* ignore */ }
    setForm({
      ...EMPTY,
      ...saved,
      name: saved.name || (profile as any)?.full_name || "",
      email: saved.email || user?.email || "",
    });
  }, [user, profile]);

  const set = (field: keyof CheckoutDetails, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { next[String(i.path[0])] = i.message; });
      setErrors(next);
      return;
    }
    const clean = { ...form, ...parsed.data, instructions: form.instructions.trim() } as CheckoutDetails;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
    onSubmit(clean);
  };

  const field = (
    id: keyof CheckoutDetails,
    label: string,
    props: React.InputHTMLAttributes<HTMLInputElement> = {},
  ) => (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={form[id]}
        onChange={(e) => set(id, e.target.value)}
        aria-invalid={!!errors[id]}
        {...props}
      />
      {errors[id] && <p className="text-xs text-destructive">{errors[id]}</p>}
    </div>
  );

  return (
    <form onSubmit={submit} className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <p className="text-sm text-muted-foreground">
          We need these details to deliver your order. We deliver within India only.
        </p>

        {field("name", "Full name", { maxLength: 120, autoComplete: "name", placeholder: "Your name" })}
        {field("email", "Email", { type: "email", maxLength: 255, autoComplete: "email", placeholder: "you@example.com" })}
        {field("phone", "Mobile number", { inputMode: "numeric", maxLength: 10, autoComplete: "tel", placeholder: "10-digit number" })}

        <div className="space-y-1">
          <Label htmlFor="address">Address</Label>
          <Textarea
            id="address"
            value={form.address}
            maxLength={300}
            rows={2}
            placeholder="House / flat number, street, locality, landmark"
            onChange={(e) => set("address", e.target.value)}
            aria-invalid={!!errors.address}
          />
          {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {field("city", "City / Town", { maxLength: 100, autoComplete: "address-level2" })}
          {field("state", "State", { maxLength: 100, autoComplete: "address-level1" })}
        </div>

        {field("zip", "PIN code", { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code", placeholder: "560001" })}

        <div className="space-y-1">
          <Label htmlFor="instructions">Delivery instructions (optional)</Label>
          <Textarea
            id="instructions"
            value={form.instructions}
            maxLength={500}
            rows={2}
            placeholder="Anything the courier should know"
            onChange={(e) => set("instructions", e.target.value)}
          />
        </div>
      </div>

      <div className="border-t p-6 space-y-3">
        <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
          {isLoading ? "Opening payment..." : `Pay ${total}`}
        </Button>
        <Button type="button" variant="ghost" className="w-full" onClick={onBack} disabled={isLoading}>
          Back to cart
        </Button>
      </div>
    </form>
  );
};

export default CheckoutForm;
