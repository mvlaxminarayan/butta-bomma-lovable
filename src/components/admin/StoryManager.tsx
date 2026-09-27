import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { uploadProductImage } from "@/lib/productImages";

const api = () => (supabase as any).schema("api");

interface StoryForm {
  story_title: string;
  story_text: string;
  story_image: string;
}

const SAMPLE: StoryForm = {
  story_title: "Our Story",
  story_text:
    "Welcome to Buttabomma Shop — a small studio where every piece is made by hand, one at a time.\n\nWhat began as a love for traditional crafts has grown into a collection of ceramics, textiles and decor, each item shaped by skilled artisans using time-honored techniques. No two pieces are exactly alike — that's what makes them special.\n\nThis is sample content. Replace it with your own story here.",
  story_image: "",
};

export default function StoryManager() {
  const [form, setForm] = useState<StoryForm>(SAMPLE);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await api()
        .from("store_settings")
        .select("story_title, story_text, story_image")
        .eq("id", 1)
        .maybeSingle();
      if (error) {
        toast.error("Failed to load Our Story");
      } else if (data) {
        setForm({
          story_title: data.story_title || SAMPLE.story_title,
          story_text: data.story_text || SAMPLE.story_text,
          story_image: data.story_image || "",
        });
      }
      setLoading(false);
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    const { error } = await api()
      .from("store_settings")
      .update({
        story_title: form.story_title.trim() || null,
        story_text: form.story_text.trim() || null,
        story_image: form.story_image.trim() || null,
      })
      .eq("id", 1);
    setSaving(false);
    if (error) toast.error("Failed to save Our Story");
    else toast.success("Our Story updated — check the home page");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Our Story</CardTitle>
        <CardDescription>
          This appears in the "Our Story" section on the home page. Leave the story blank to
          show the sample content.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="story-title">Heading</Label>
          <Input
            id="story-title"
            value={form.story_title}
            disabled={loading}
            onChange={(e) => setForm({ ...form, story_title: e.target.value })}
            placeholder="Our Story"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="story-text">Story</Label>
          <Textarea
            id="story-text"
            rows={7}
            value={form.story_text}
            disabled={loading}
            onChange={(e) => setForm({ ...form, story_text: e.target.value })}
            placeholder="Write your story here. Leave a blank line between paragraphs."
          />
          <p className="text-xs text-muted-foreground">Leave a blank line between paragraphs.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="story-image">Photo (web address or storage path)</Label>
          <Input
            id="story-image"
            value={form.story_image}
            disabled={loading}
            onChange={(e) => setForm({ ...form, story_image: e.target.value })}
            placeholder="https://... (leave blank to use the default photo)"
          />
        </div>
        <Button onClick={save} disabled={loading || saving}>
          {saving ? "Saving..." : "Save Story"}
        </Button>
      </CardContent>
    </Card>
  );
}
