import React, { useState, useEffect, useCallback } from 'react';
import { FaTimes, FaHeadset, FaPaperPlane, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import API_URL from '../constants';
import './ExitIntentPrompt.css';

// Exit reasons with user-friendly labels
const EXIT_REASONS = [
  { id: 'form_too_long', label: 'Form feels too long', icon: '📝' },
  { id: 'confusing_fields', label: 'Some fields are confusing', icon: '❓' },
  { id: 'technical_issue', label: 'Having technical issues', icon: '⚠️' },
  { id: 'missing_info', label: "Don't have all the info ready", icon: '📋' },
  { id: 'will_return_later', label: "I'll come back later", icon: '⏰' },
  { id: 'just_browsing', label: 'Just exploring for now', icon: '👀' },
];

function ExitIntentPrompt({
  isOpen,
  onClose,
  onSubmit,
  formProgress = 0,
  fieldsCompleted = [],
  sessionId,
}) {
  const [selectedReason, setSelectedReason] = useState('');
  const [additionalFeedback, setAdditionalFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [requestedHelp, setRequestedHelp] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedReason('');
      setAdditionalFeedback('');
      setShowSuccess(false);
      setRequestedHelp(false);
    }
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const getDeviceType = () => {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  };

  const handleSubmit = useCallback(async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      await axios.post(`${API_URL}/exit-feedback`, {
        sessionId,
        reason: selectedReason,
        additionalFeedback: additionalFeedback.trim(),
        formProgress,
        fieldsCompleted,
        exitType: 'navigation',
        deviceType: getDeviceType(),
        requestedHelp,
      });

      setShowSuccess(true);
      setTimeout(() => {
        onSubmit?.();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      // Still close even if submission fails
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedReason, additionalFeedback, formProgress, fieldsCompleted, sessionId, requestedHelp, onSubmit, onClose]);

  const handleContactAdmin = () => {
    setRequestedHelp(true);
    // Navigate to contact admin page
    window.location.href = '/contact-admin';
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="exit-prompt-overlay" onClick={handleSkip}>
      <div 
        className="exit-prompt-modal" 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-labelledby="exit-prompt-title"
        aria-modal="true"
      >
        {/* Close button */}
        <button 
          className="exit-prompt-close" 
          onClick={handleSkip}
          aria-label="Close"
        >
          <FaTimes />
        </button>

        {showSuccess ? (
          <div className="exit-prompt-success">
            <div className="success-icon-wrapper">
              <FaCheck />
            </div>
            <h3>Thank you for your feedback!</h3>
            <p>We're always working to improve your experience.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="exit-prompt-header">
              <h2 id="exit-prompt-title">Having trouble listing your product?</h2>
              <p className="exit-prompt-subtitle">
                We're here to help. Your feedback helps us improve.
              </p>
            </div>

            {/* Progress indicator */}
            {formProgress > 0 && (
              <div className="exit-prompt-progress">
                <div className="progress-text">
                  You've completed <strong>{formProgress}%</strong> of the form
                </div>
                <div className="progress-bar-bg">
                  <div 
                    className="progress-bar-fill" 
                    style={{ width: `${formProgress}%` }}
                  />
                </div>
                {formProgress >= 50 && (
                  <p className="progress-encouragement">
                    You're more than halfway there! 🎉
                  </p>
                )}
              </div>
            )}

            {/* Reason selection */}
            <div className="exit-prompt-reasons">
              <label className="reasons-label">What's stopping you? (optional)</label>
              <div className="reasons-grid">
                {EXIT_REASONS.map((reason) => (
                  <button
                    key={reason.id}
                    className={`reason-chip ${selectedReason === reason.id ? 'selected' : ''}`}
                    onClick={() => setSelectedReason(reason.id)}
                    type="button"
                  >
                    <span className="reason-icon">{reason.icon}</span>
                    <span className="reason-text">{reason.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional feedback */}
            <div className="exit-prompt-textarea-wrapper">
              <label htmlFor="additional-feedback">
                Anything else you'd like to share? (optional)
              </label>
              <textarea
                id="additional-feedback"
                className="exit-prompt-textarea"
                placeholder="Your feedback helps us make listing easier..."
                value={additionalFeedback}
                onChange={(e) => setAdditionalFeedback(e.target.value)}
                maxLength={500}
                rows={3}
              />
              <span className="char-count">{additionalFeedback.length}/500</span>
            </div>

            {/* Actions */}
            <div className="exit-prompt-actions">
              <button
                className="exit-prompt-btn contact-btn"
                onClick={handleContactAdmin}
                type="button"
              >
                <FaHeadset />
                <span>Need Help?</span>
              </button>
              
              <div className="exit-prompt-btn-group">
                <button
                  className="exit-prompt-btn skip-btn"
                  onClick={handleSkip}
                  type="button"
                >
                  Skip
                </button>
                <button
                  className="exit-prompt-btn submit-btn"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedReason}
                  type="button"
                >
                  {isSubmitting ? (
                    <span className="loading-spinner" />
                  ) : (
                    <>
                      <FaPaperPlane />
                      <span>Send Feedback</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Reassurance */}
            <p className="exit-prompt-note">
              No pressure — you can always come back and continue later.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default ExitIntentPrompt;
