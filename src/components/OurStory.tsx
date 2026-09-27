import { useEffect, useState } from "react";
import { fetchStoreSettings, SAMPLE_STORY } from "@/lib/pricing";
import { resolveImageUrls } from "@/lib/productImages";
import storyFallback from "@/assets/kondapalli.jpg";

const OurStory = () => {
  const [title, setTitle] = useState(SAMPLE_STORY.title);
  const [paragraphs, setParagraphs] = useState<string[]>(() =>
    SAMPLE_STORY.text.split(/\n\s*\n/).filter(Boolean)
  );
  const [image, setImage] = useState<string>(storyFallback);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const settings = await fetchStoreSettings();
      if (cancelled) return;
      setTitle(settings.story_title || SAMPLE_STORY.title);
      setParagraphs(
        (settings.story_text || SAMPLE_STORY.text).split(/\n\s*\n/).filter(Boolean)
      );
      if (settings.story_image) {
        const [url] = await resolveImageUrls([settings.story_image]);
        if (!cancelled && url) setImage(url);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section id="our-story" className="py-16 bg-secondary/40 scroll-mt-20">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative overflow-hidden rounded-2xl shadow-elegant h-[360px] md:h-[440px]">
            <img
              src={image}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">{title}</h2>
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed max-w-xl">
              {paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OurStory;
