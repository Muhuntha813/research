/**
 * ChatWidget - AI Chat Component with Hugging Face Integration
 * 
 * Features:
 * - Floating "Chat with AI" button
 * - Slide-over chat pane with message history
 * - Multi-turn conversation support
 * - Instant Feedback button for dashboard health analysis
 * 
 * Props:
 * - apiBaseUrl: Base URL for backend API (default: "" for same origin)
 * - dashboardDataProp: Optional dashboard data object (if provided, Instant Feedback uses this instead of DOM scraping)
 */

import { useState, useRef, useEffect } from 'react';
import './ChatWidget.css';

/**
 * Gathers dashboard data from DOM selectors
 * Can be easily replaced with prop-based data passing
 * @returns {Object} Dashboard data object
 */
function gatherDashboardData() {
  // Default selectors - update these to match your actual dashboard DOM structure
  const selectors = {
    tankTemp: '.tank-temp, [data-temp], .temperature-value',
    phValue: '.ph-value, [data-ph], .ph-display',
    oxygenLevel: '.oxygen-level, [data-oxygen], .do-value',
    feedStatus: '.feed-status, [data-feed], .feed-info',
    // Add more selectors as needed
  };

  const data = {};

  // Try to extract values from DOM
  Object.entries(selectors).forEach(([key, selector]) => {
    try {
      const element = document.querySelector(selector);
      if (element) {
        // Try to get text content or data attributes
        const text = element.textContent?.trim();
        const dataValue = element.getAttribute('data-value') || element.getAttribute('value');
        data[key] = text || dataValue || null;
      } else {
        data[key] = null;
      }
    } catch (error) {
      console.warn(`Could not read selector ${selector}:`, error);
      data[key] = null;
    }
  });

  // Also try to get any data attributes from the root or common containers
  try {
    const dashboardRoot = document.querySelector('[data-dashboard], .dashboard, #dashboard');
    if (dashboardRoot) {
      const dataset = dashboardRoot.dataset;
      Object.keys(dataset).forEach(key => {
        if (!data[key]) {
          data[key] = dataset[key];
        }
      });
    }
  } catch (error) {
    // Ignore errors
  }

  return data;
}

/**
 * InstantFeedbackButton - Standalone button component for Instant Feedback
 * Can be placed anywhere in the app
 */
export function InstantFeedbackButton({ 
  apiBaseUrl = '', 
  dashboardDataProp = null,
  onFeedbackReceived = null 
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInstantFeedback = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get dashboard data
      const dashboardData = dashboardDataProp || gatherDashboardData();

      // Check if we have any data
      const hasData = Object.values(dashboardData).some(val => val !== null && val !== undefined);
      
      if (!hasData) {
        const triedSelectors = [
          '.tank-temp', '.ph-value', '.oxygen-level', '.feed-status',
          '[data-temp]', '[data-ph]', '[data-oxygen]', '[data-feed]'
        ];
        throw new Error(
          `Could not gather dashboard data. Tried selectors: ${triedSelectors.join(', ')}. ` +
          `Please provide dashboardDataProp or ensure dashboard elements have matching selectors.`
        );
      }

      // Call backend
      const response = await fetch(`${apiBaseUrl}/api/instant-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dashboardData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Instant Feedback Response:', result);
      
      // Call callback if provided - expect { reply } from backend
      const feedbackText = result.reply || result.message || 'No feedback received';
      if (onFeedbackReceived) {
        onFeedbackReceived(feedbackText);
      } else {
        // Default: show in alert (can be customized)
        alert(feedbackText);
      }

    } catch (err) {
      console.error('Instant Feedback error:', err);
      setError(err.message);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className="instant-feedback-btn"
      onClick={handleInstantFeedback}
      disabled={loading}
      title="Get AI-powered feedback on dashboard health"
    >
      {loading ? 'Analyzing...' : 'Instant Feedback'}
    </button>
  );
}

/**
 * Main ChatWidget Component
 */
export default function ChatWidget({ 
  apiBaseUrl = '', 
  dashboardDataProp = null 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when pane opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  /**
   * Sends a chat message to the backend
   */
  const sendMessage = async (text) => {
    if (!text.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: text.trim(),
      timestamp: new Date(),
    };

    // Add user message immediately
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setLoading(true);
    setError(null);

    try {
      // Build history array from previous messages (alternating user/assistant)
      const history = messages
        .filter(msg => msg.sender === 'user' || msg.sender === 'assistant')
        .map(msg => msg.text);

      // Call backend
      const response = await fetch(`${apiBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text.trim(),
          history: history,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('Chat API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        
        // Show detailed error message from server
        const errorMessage = errorData.error || errorData.message || `Server error: ${response.status}`;
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Chat API Success:', result);
      
      // Add assistant response - expect { reply } from backend
      const assistantMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: result.reply || result.message || 'No response received',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

    } catch (err) {
      console.error('Chat error:', err);
      console.error('Full error object:', err);
      setError(err.message);
      
      // Add error message to chat with more details
      let errorText = `Error: ${err.message}`;
      if (err.message && err.message.includes('loading')) {
        errorText += '\n\n💡 Tip: The model is waking up from sleep mode. Please wait 20-30 seconds and try again.';
      } else if (err.message && err.message.includes('401')) {
        errorText += '\n\n💡 Tip: Check your Hugging Face token in the backend .env file.';
      } else if (err.message && err.message.includes('410')) {
        errorText += '\n\n💡 Tip: The API endpoint may be deprecated. Check server logs for details.';
      }
      
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: errorText,
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles Instant Feedback button click
   */
  const handleInstantFeedback = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get dashboard data
      const dashboardData = dashboardDataProp || gatherDashboardData();

      // Check if we have any data
      const hasData = Object.values(dashboardData).some(val => val !== null && val !== undefined);
      
      if (!hasData) {
        const triedSelectors = [
          '.tank-temp', '.ph-value', '.oxygen-level', '.feed-status',
          '[data-temp]', '[data-ph]', '[data-oxygen]', '[data-feed]'
        ];
        throw new Error(
          `Could not gather dashboard data. Tried selectors: ${triedSelectors.join(', ')}. ` +
          `Please provide dashboardDataProp or ensure dashboard elements have matching selectors.`
        );
      }

      // Add a user message indicating we're getting feedback
      const feedbackRequestMessage = {
        id: Date.now(),
        sender: 'user',
        text: 'Get instant feedback on dashboard health',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, feedbackRequestMessage]);

      // Call backend
      const response = await fetch(`${apiBaseUrl}/api/instant-feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dashboardData }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Instant Feedback API Success:', result);
      
      // Add assistant response - expect { reply } from backend
      const feedbackMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: result.reply || result.message || 'No feedback received',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, feedbackMessage]);

    } catch (err) {
      console.error('Instant Feedback error:', err);
      setError(err.message);
      
      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: `Error: ${err.message}`,
        timestamp: new Date(),
        isError: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!loading && inputValue.trim()) {
      sendMessage(inputValue);
    }
  };

  /**
   * Formats timestamp for display
   */
  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        className="chat-widget-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open AI Chat"
        title="Chat with AI"
      >
        💬 Chat with AI
      </button>

      {/* Slide-over Pane */}
      {isOpen && (
        <div className="chat-widget-overlay" onClick={() => setIsOpen(false)}>
          <div className="chat-widget-pane" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="chat-widget-header">
              <h2>AI Assistant</h2>
              <button
                className="chat-widget-close"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
              >
                ×
              </button>
            </div>

            {/* Messages Area */}
            <div className="chat-widget-messages">
              {messages.length === 0 && (
                <div className="chat-widget-empty">
                  <p>Start a conversation with the AI assistant!</p>
                  <p className="chat-widget-hint">
                    Ask questions about your aquarium, or use "Instant Feedback" for health recommendations.
                  </p>
                </div>
              )}

              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`chat-widget-message chat-widget-message-${msg.sender} ${msg.isError ? 'chat-widget-message-error' : ''}`}
                >
                  <div className="chat-widget-message-header">
                    <span className="chat-widget-message-sender">
                      {msg.sender === 'user' ? 'You' : 'Assistant'}
                    </span>
                    <span className="chat-widget-message-time">
                      {formatTime(msg.timestamp)}
                    </span>
                  </div>
                  <div className="chat-widget-message-text">
                    {msg.text}
                  </div>
                </div>
              ))}

              {loading && (
                <div className="chat-widget-message chat-widget-message-assistant">
                  <div className="chat-widget-message-text">
                    <span className="chat-widget-typing">Bot is typing...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Instant Feedback Button */}
            <div className="chat-widget-actions">
              <InstantFeedbackButton
                apiBaseUrl={apiBaseUrl}
                dashboardDataProp={dashboardDataProp}
        onFeedbackReceived={(feedbackText) => {
          // Add feedback as assistant message
          const feedbackMessage = {
            id: Date.now(),
            sender: 'assistant',
            text: feedbackText || 'No feedback received',
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, feedbackMessage]);
        }}
              />
            </div>

            {/* Input Area */}
            <form className="chat-widget-input-form" onSubmit={handleSubmit}>
              <input
                ref={inputRef}
                type="text"
                className="chat-widget-input"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Type your message..."
                disabled={loading}
              />
              <button
                type="submit"
                className="chat-widget-send"
                disabled={loading || !inputValue.trim()}
                aria-label="Send message"
              >
                Send
              </button>
            </form>

            {/* Error Display */}
            {error && (
              <div className="chat-widget-error">
                {error}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

