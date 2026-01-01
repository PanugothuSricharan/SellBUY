import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FaEnvelope, FaTimes, FaPaperPlane, FaCheckCircle } from "react-icons/fa";
import API_URL from "../constants";
import "./ContactAdmin.css";

function ContactAdmin() {
  const [isOpen, setIsOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState("");
  
  const modalRef = useRef(null);
  const fabRef = useRef(null);
  const firstFocusableRef = useRef(null);

  const isLoggedIn = !!localStorage.getItem("token");

  // Focus management when modal opens/closes
  useEffect(() => {
    if (isOpen && firstFocusableRef.current) {
      firstFocusableRef.current.focus();
    }
  }, [isOpen]);

  // Close modal on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        fabRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!subject.trim() || !message.trim()) {
      setError("Please fill in all fields");
      return;
    }

    const userId = localStorage.getItem("userId");
    if (!userId) {
      setError("Please login to send a message");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await axios.post(`${API_URL}/contact-admin`, {
        userId,
        subject: subject.trim(),
        message: message.trim(),
      });

      if (res.data.message.includes("success")) {
        setShowSuccess(true);
        setSubject("");
        setMessage("");
        
        setTimeout(() => {
          setShowSuccess(false);
          setIsOpen(false);
          fabRef.current?.focus();
        }, 2000);
      } else {
        setError(res.data.message || "Failed to send message");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send message. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't show button if not logged in
  if (!isLoggedIn) return null;

  return (
    <>
      {/* Floating Button */}
      <button 
        ref={fabRef}
        className={`contact-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? "Close contact form" : "Contact Admin"}
        aria-expanded={isOpen}
        aria-controls="contact-modal"
      >
        {isOpen ? <FaTimes aria-hidden="true" /> : <FaEnvelope aria-hidden="true" />}
      </button>

      {/* Contact Modal */}
      {isOpen && (
        <div 
          id="contact-modal"
          ref={modalRef}
          className="contact-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="contact-modal-title"
        >
          <div className="contact-header">
            <h3 id="contact-modal-title">📩 Contact Admin</h3>
            <p id="contact-modal-desc">Have an issue? Send us a message.</p>
          </div>

          {showSuccess ? (
            <div className="contact-success" role="status" aria-live="polite">
              <FaCheckCircle aria-hidden="true" />
              <p>Message sent successfully!</p>
              <small>Admin will review it soon.</small>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form" aria-describedby="contact-modal-desc">
              <div className="form-group">
                <label htmlFor="contact-subject">Subject</label>
                <select
                  id="contact-subject"
                  ref={firstFocusableRef}
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="contact-select"
                  aria-required="true"
                >
                  <option value="">Select an issue type...</option>
                  <option value="Product Hidden">My product was hidden</option>
                  <option value="Account Blocked">My account was blocked</option>
                  <option value="Report User">Report a user</option>
                  <option value="Bug Report">Report a bug</option>
                  <option value="Feature Request">Feature request</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="contact-message">Message</label>
                <textarea
                  id="contact-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  maxLength={1000}
                  className="contact-textarea"
                  aria-required="true"
                  aria-describedby="char-count"
                />
                <small id="char-count" className="char-count" aria-live="polite">
                  {message.length}/1000 characters
                </small>
              </div>

              {error && (
                <p className="contact-error" role="alert" aria-live="assertive">
                  {error}
                </p>
              )}

              <button 
                type="submit" 
                className="contact-submit"
                disabled={isSubmitting}
                aria-busy={isSubmitting}
              >
                {isSubmitting ? (
                  <>Sending...</>
                ) : (
                  <>
                    <FaPaperPlane aria-hidden="true" /> Send Message
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}
    </>
  );
}

export default ContactAdmin;
