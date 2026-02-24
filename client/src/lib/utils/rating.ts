/**
 * Returns a Booking.com-style quality label for a numeric rating (1-5 scale).
 */
export function getRatingLabel(score: number): string {
  if (score >= 4.5) return 'Exceptional';
  if (score >= 4.0) return 'Excellent';
  if (score >= 3.5) return 'Very Good';
  if (score >= 3.0) return 'Good';
  return 'Pleasant';
}
