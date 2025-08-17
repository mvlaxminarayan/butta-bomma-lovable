import { useState, useEffect } from "react";
import { Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useProductReviews } from "@/hooks/useProductReviews";

interface Review {
  id: string;
  name: string;
  rating: number;
  comment: string;
  date: string;
}

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

const ProductReviews = ({ productId, productName }: ProductReviewsProps) => {
  const { toast } = useToast();
  const { reviews, averageRating } = useProductReviews(productId);
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews);
  const [showForm, setShowForm] = useState(false);
  const [newReview, setNewReview] = useState({
    name: "",
    rating: 0,
    comment: ""
  });

  // Update local reviews when the hook reviews change
  useEffect(() => {
    setLocalReviews(reviews);
  }, [reviews]);

  // Save reviews to localStorage whenever local reviews change
  useEffect(() => {
    if (localReviews.length > 0 && localReviews !== reviews) {
      localStorage.setItem(`reviews_${productId}`, JSON.stringify(localReviews));
    }
  }, [localReviews, productId, reviews]);

  const currentAverageRating = localReviews.length > 0 
    ? localReviews.reduce((sum, review) => sum + review.rating, 0) / localReviews.length 
    : 0;

  const handleRatingClick = (rating: number) => {
    setNewReview(prev => ({ ...prev, rating }));
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReview.name || !newReview.comment || newReview.rating === 0) {
      toast({
        title: "Please complete all fields",
        description: "Name, rating, and review are required.",
        variant: "destructive"
      });
      return;
    }

    const review: Review = {
      id: Date.now().toString(),
      name: newReview.name,
      rating: newReview.rating,
      comment: newReview.comment,
      date: new Date().toISOString().split('T')[0]
    };

    setLocalReviews(prev => [review, ...prev]);
    setNewReview({ name: "", rating: 0, comment: "" });
    setShowForm(false);
    
    toast({
      title: "Review submitted",
      description: "Thank you for your feedback!"
    });
  };

  const renderStars = (rating: number, interactive = false, size = "h-4 w-4") => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < rating
            ? "fill-rating text-rating"
            : "text-muted-foreground"
        } ${interactive ? "cursor-pointer hover:text-rating transition-colors" : ""}`}
        onClick={interactive ? () => handleRatingClick(i + 1) : undefined}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Reviews Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Customer Reviews</span>
            <Button 
              onClick={() => setShowForm(!showForm)}
              variant="outline"
            >
              Write a Review
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {localReviews.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {renderStars(Math.round(currentAverageRating))}
                </div>
                <span className="text-xl font-semibold">{currentAverageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">
                  ({localReviews.length} review{localReviews.length !== 1 ? 's' : ''})
                </span>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">No reviews yet. Be the first to review {productName}!</p>
          )}
        </CardContent>
      </Card>

      {/* Review Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Write Your Review</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div>
                <Label htmlFor="reviewer-name">Your Name</Label>
                <Input
                  id="reviewer-name"
                  value={newReview.name}
                  onChange={(e) => setNewReview(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter your name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Rating</Label>
                <div className="flex items-center gap-1 mt-1">
                  {renderStars(newReview.rating, true, "h-6 w-6")}
                </div>
              </div>

              <div>
                <Label htmlFor="review-comment">Your Review</Label>
                <Textarea
                  id="review-comment"
                  value={newReview.comment}
                  onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                  placeholder="Share your thoughts about this product..."
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div className="flex gap-2">
                <Button type="submit">Submit Review</Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {localReviews.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">Reviews</h3>
          {localReviews.map((review, index) => (
            <div key={review.id}>
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{review.name}</span>
                        <span className="text-sm text-muted-foreground">{review.date}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {renderStars(review.rating)}
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              {index < localReviews.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;