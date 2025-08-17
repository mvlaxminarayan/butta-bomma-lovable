import { useState, useEffect } from "react";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

// Mock reviews data - in a real app, this would come from a backend
const mockReviews: Record<string, Review[]> = {
  "1": [
    {
      id: "1",
      name: "Sarah M.",
      rating: 5,
      comment: "Absolutely love this mug! The quality is excellent and it feels great in my hands. Perfect for my morning coffee routine.",
      date: "2024-01-15"
    },
    {
      id: "2", 
      name: "John D.",
      rating: 4,
      comment: "Great mug, very well made. The only reason I'm not giving 5 stars is because it's a bit smaller than I expected.",
      date: "2024-01-10"
    }
  ],
  "2": [
    {
      id: "3",
      name: "Lisa K.",
      rating: 5,
      comment: "Beautiful basket! Perfect for organizing my living room and looks great as decor too.",
      date: "2024-01-12"
    }
  ],
  "3": [
    {
      id: "4",
      name: "Mike R.",
      rating: 5,
      comment: "Outstanding cutting board. The live edge design is gorgeous and it's very functional. Worth every penny!",
      date: "2024-01-08"
    }
  ]
};

export const useProductReviews = (productId: string) => {
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    const savedReviews = localStorage.getItem(`reviews_${productId}`);
    if (savedReviews) {
      setReviews(JSON.parse(savedReviews));
    } else {
      // Use mock data as initial data if no saved reviews
      setReviews(mockReviews[productId] || []);
    }
  }, [productId]);

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return {
    reviews,
    averageRating: Number(averageRating.toFixed(1)),
    reviewCount: reviews.length
  };
};

export const getProductReviewsSync = (productId: string) => {
  const savedReviews = localStorage.getItem(`reviews_${productId}`);
  let reviews: Review[] = [];
  
  if (savedReviews) {
    reviews = JSON.parse(savedReviews);
  } else {
    reviews = mockReviews[productId] || [];
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return {
    reviews,
    averageRating: Number(averageRating.toFixed(1)),
    reviewCount: reviews.length
  };
};