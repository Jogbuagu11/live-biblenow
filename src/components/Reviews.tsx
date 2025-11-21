import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StarRating } from "@/components/StarRating";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

interface Review {
  review_id: string;
  client_id: string;
  client_name: string;
  client_avatar: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  event_title: string;
  event_type: string;
}

interface ReviewsProps {
  proxyId: string;
  showTitle?: boolean;
}

export const Reviews = ({ proxyId, showTitle = true }: ReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [averageRating, setAverageRating] = useState<number>(0);
  const [reviewCount, setReviewCount] = useState<number>(0);

  useEffect(() => {
    loadReviews();
  }, [proxyId]);

  const loadReviews = async () => {
    try {
      setLoading(true);
      
      // Get average rating
      const { data: ratingData, error: ratingError } = await supabase.rpc(
        "get_proxy_rating",
        { p_proxy_id: proxyId }
      );
      
      if (!ratingError && ratingData !== null) {
        setAverageRating(Number(ratingData));
      }

      // Get review count
      const { data: countData, error: countError } = await supabase.rpc(
        "get_proxy_review_count",
        { p_proxy_id: proxyId }
      );
      
      if (!countError && countData !== null) {
        setReviewCount(Number(countData));
      }

      // Get reviews
      const { data, error } = await supabase
        .from("proxy_reviews")
        .select("*")
        .eq("proxy_id", proxyId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {showTitle && <h3 className="text-lg font-semibold">Reviews</h3>}
        <div className="text-muted-foreground">Loading reviews...</div>
      </div>
    );
  }

  if (reviewCount === 0) {
    return (
      <div className="space-y-4">
        {showTitle && <h3 className="text-lg font-semibold">Reviews</h3>}
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">No reviews yet</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Reviews</h3>
          <div className="flex items-center gap-2">
            <StarRating rating={averageRating} showValue size="md" />
            <span className="text-sm text-muted-foreground">
              ({reviewCount} {reviewCount === 1 ? "review" : "reviews"})
            </span>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {reviews.map((review) => {
          const initials = review.client_name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);

          return (
            <Card key={review.review_id} className="p-4">
              <div className="flex gap-4">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={review.client_avatar || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-foreground">
                        {review.client_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), "MMM d, yyyy")} •{" "}
                        {review.event_type}
                      </p>
                    </div>
                    <StarRating rating={review.rating} size="sm" />
                  </div>
                  {review.comment && (
                    <p className="text-sm text-foreground mt-2">
                      {review.comment}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

