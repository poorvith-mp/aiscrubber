import {
  Check,
  Heart,
  MessageSquare,
  Send,
  Sparkles,
  Star,
  ThumbsUp,
  X,
} from 'lucide-react';
import { useState } from 'react';

export function FeedbackModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [category, setCategory] = useState<'feature' | 'bug' | 'ux' | 'general'>('feature');
  const [rating, setRating] = useState<number>(5);
  const [message, setMessage] = useState('');
  const [contact, setContact] = useState('');
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    // Store feedback locally
    const feedbackItem = {
      id: `fb_${Date.now()}`,
      category,
      rating,
      message,
      contact,
      timestamp: new Date().toISOString(),
    };

    const existing = JSON.parse(localStorage.getItem('aiscrubber_feedbacks') || '[]');
    existing.push(feedbackItem);
    localStorage.setItem('aiscrubber_feedbacks', JSON.stringify(existing));

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setMessage('');
      setContact('');
      onClose();
    }, 2200);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg p-6 sm:p-8 rounded-2xl bg-[var(--panel)] border border-[var(--line)] shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[var(--muted)] hover:text-[var(--text)] transition-colors p-1 rounded-lg hover:bg-[var(--surface-sunken)]"
          aria-label="Close feedback modal"
        >
          <X size={20} />
        </button>

        {submitted ? (
          <div className="text-center py-8 space-y-3">
            <div className="w-14 h-14 rounded-full bg-[var(--accent-tint)] text-[var(--accent)] flex items-center justify-center mx-auto animate-bounce">
              <Check size={28} />
            </div>
            <h3 className="text-xl font-headline font-bold text-[var(--text)]">
              Thank you for your feedback!
            </h3>
            <p className="text-xs text-[var(--muted)] max-w-xs mx-auto">
              Your feedback is saved locally and reviewed to improve AIScrubber.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="badge-emerald">Founder Feedback</span>
              </div>
              <h3 className="text-xl font-headline font-bold text-[var(--text)]">
                Help Make AIScrubber Better
              </h3>
              <p className="text-xs text-[var(--muted)]">
                Direct feedback for Poorvith. Suggest features, report bugs, or share your thoughts.
              </p>
            </div>

            {/* Category Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Feedback Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'feature', label: 'Feature Request' },
                  { id: 'bug', label: 'Bug Report' },
                  { id: 'ux', label: 'Design / UX' },
                  { id: 'general', label: 'General' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCategory(item.id as any)}
                    className={`py-2 px-2 text-xs rounded-lg border font-medium transition-all text-center truncate ${
                      category === item.id
                        ? 'border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--accent)] font-bold'
                        : 'border-[var(--line)] bg-[var(--surface-sunken)] text-[var(--muted)] hover:text-[var(--text)]'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Rating Stars */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Experience Rating
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                  >
                    <Star
                      size={20}
                      className={
                        star <= rating
                          ? 'fill-[var(--accent)] text-[var(--accent)]'
                          : 'text-[var(--muted)] opacity-40'
                      }
                    />
                  </button>
                ))}
                <span className="text-xs font-mono text-[var(--muted)] ml-2">
                  {rating === 5
                    ? 'Excellent'
                    : rating === 4
                    ? 'Very Good'
                    : rating === 3
                    ? 'Good'
                    : 'Needs Improvement'}
                </span>
              </div>
            </div>

            {/* Message Area */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Your Feedback & Details
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What features would you love to see? Or describe what you experienced..."
                required
                className="w-full min-h-[110px] p-3 rounded-xl bg-[var(--surface-sunken)] border border-[var(--line)] text-xs text-[var(--text)] outline-none focus:border-[var(--accent)] transition-colors resize-vertical"
              />
            </div>

            {/* Contact handle (Optional) */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--muted)] uppercase tracking-wider">
                Contact Handle / Email (Optional)
              </label>
              <input
                type="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                placeholder="e.g. @twitter_handle or email@example.com"
                className="input-field text-xs"
              />
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary text-xs font-bold flex items-center gap-1.5"
              >
                <Send size={14} />
                Send Feedback
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
