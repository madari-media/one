import React, { useState } from 'react';
import { MetaExtended } from '@/service/type';

interface ReviewsProps {
  meta: MetaExtended;
}

type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

export const Reviews: React.FC<ReviewsProps> = ({ meta }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [previewCount] = useState(2);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [expandedReview, setExpandedReview] = useState<string | null>(null);

  if (!meta.reviews || meta.reviews.length === 0) {
    return null;
  }

  const sortReviews = (reviews: typeof meta.reviews) => {
    return [...reviews].sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case 'oldest':
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case 'highest':
          return b.rating - a.rating;
        case 'lowest':
          return a.rating - b.rating;
        default:
          return 0;
      }
    });
  };

  const sortedReviews = sortReviews(meta.reviews);
  const reviewsToShow = isExpanded
    ? sortedReviews
    : sortedReviews.slice(0, previewCount);
  const hasMoreReviews = meta.reviews.length > previewCount;

  const handleReviewClick = (reviewId: string) => {
    setExpandedReview(expandedReview === reviewId ? null : reviewId);
  };

  return (
    <div className="mt-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
          Reviews
        </h2>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="appearance-none bg-zinc-800/50 backdrop-blur-sm text-white px-4 py-2 rounded-full border border-zinc-700/50 hover:border-zinc-600/50 focus:outline-none focus:ring-2 focus:ring-red-500/50 cursor-pointer pr-8"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest">Highest Rated</option>
              <option value="lowest">Lowest Rated</option>
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-4 h-4 text-zinc-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reviewsToShow.map((review) => (
          <div
            key={review.id}
            onClick={() => handleReviewClick(String(review.id))}
            className="group bg-zinc-800/50 backdrop-blur-sm p-4 rounded-xl transition-all duration-300 hover:bg-zinc-700/50 border border-zinc-700/50 hover:border-zinc-600/50 cursor-pointer"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1 bg-zinc-700/50 px-3 py-1 rounded-full">
                  <span className="text-yellow-400">★</span>
                  <span className="text-sm font-medium">
                    {review.rating}/10
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-white group-hover:text-zinc-200 transition-colors">
                  {review.author}
                </h3>
                <span className="text-sm text-zinc-400">•</span>
                <p className="text-sm text-zinc-400">
                  {new Date(review.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="relative">
              <p
                className={`text-zinc-300 leading-relaxed transition-all duration-500 ease-in-out ${
                  expandedReview === String(review.id)
                    ? 'line-clamp-none'
                    : 'line-clamp-1'
                }`}
              >
                {review.content}
              </p>
              {expandedReview !== String(review.id) && (
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-800/50 to-transparent pointer-events-none" />
              )}
            </div>
          </div>
        ))}
      </div>

      {hasMoreReviews && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="group relative flex items-center gap-2 px-4 py-2 text-white rounded-full overflow-hidden transition-all duration-300 mx-auto"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/50 to-red-800/50 group-hover:from-red-600/70 group-hover:to-red-800/70 transition-all duration-300" />
            <div className="absolute inset-0 backdrop-blur-sm" />
            <div className="relative flex items-center gap-2">
              {isExpanded ? (
                <>
                  <span className="text-sm font-medium">Show Less</span>
                  <svg
                    className="w-4 h-4 transform group-hover:-translate-y-0.5 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 15l7-7 7 7"
                    />
                  </svg>
                </>
              ) : (
                <>
                  <span className="text-sm font-medium">
                    Show All Reviews ({meta.reviews.length})
                  </span>
                  <svg
                    className="w-4 h-4 transform group-hover:translate-y-0.5 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </>
              )}
            </div>
          </button>
        </div>
      )}
    </div>
  );
};