import { Button } from "@/components/ui/button";
import heroImage from "@/assets/kondapalli.jpg";
import heroImage1 from "@/assets/hero-image.jpg";
import { useState, useEffect } from "react";

const Hero = () => {
  const images = [heroImage, heroImage1];
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 3000); // Change every 3 seconds
    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-background to-secondary">
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                Handcrafted
                <span className="block text-primary">with Love</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg">
                Discover unique, artisanal pieces made by skilled craftspeople. 
                Each item tells a story of tradition, quality, and care.
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-elegant transition-all duration-300 hover:shadow-2xl hover:scale-105"
              >
                Shop Collection
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                Our Story
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 pt-4">
              <div>
                <div className="text-2xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Happy Customers</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">50+</div>
                <div className="text-sm text-muted-foreground">Unique Items</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">100%</div>
                <div className="text-sm text-muted-foreground">Handmade</div>
              </div>
            </div>
          </div>

          {/* Hero Image Slider */}
          <div className="relative">
            <div className="relative overflow-hidden rounded-2xl shadow-elegant h-[400px] md:h-[500px]">
              {images.map((src, index) => (
                <img
                  key={index}
                  src={src}
                  alt={`Slide ${index}`}
                  className={`absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${
                    index === currentIndex ? "opacity-100" : "opacity-0"
                  }`}
                />
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>
            
            {/* Floating Badge */}
            <div className="absolute -bottom-4 -left-4 bg-accent text-accent-foreground px-6 py-3 rounded-full shadow-elegant">
              <div className="font-semibold">Free Shipping</div>
              <div className="text-sm opacity-90">On orders over $50</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
