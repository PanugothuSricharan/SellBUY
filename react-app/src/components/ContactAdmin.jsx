import { useState } from "react";
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

  const isLoggedIn = !!localStorage.getItem("token");

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
        className={`contact-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Contact Admin"
      >
        {isOpen ? <FaTimes /> : <FaEnvelope />}
      </button>

      {/* Contact Modal */}
      {isOpen && (
        <div className="contact-modal">
          <div className="contact-header">
            <h3>📩 Contact Admin</h3>
            <p>Have an issue? Send us a message.</p>
          </div>

          {showSuccess ? (
            <div className="contact-success">
              <FaCheckCircle />
              <p>Message sent successfully!</p>
              <small>Admin will review it soon.</small>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-group">
                <label>Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="contact-select"
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
                <label>Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  rows={4}
                  maxLength={1000}
                  className="contact-textarea"
                />
                <small className="char-count">{message.length}/1000</small>
              </div>

              {error && <p className="contact-error">{error}</p>}

              <button 
                type="submit" 
                className="contact-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>Sending...</>
                ) : (
                  <>
                    <FaPaperPlane /> Send Message
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
