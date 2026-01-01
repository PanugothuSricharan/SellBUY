import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_URL from '../constants';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [sellers, setSellers] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageCounts, setMessageCounts] = useState({ unread: 0, read: 0, resolved: 0 });
  const [activeTab, setActiveTab] = useState('products'); // products, sellers, messages
  const [filter, setFilter] = useState('ALL'); // ALL, APPROVED, HIDDEN
  const [messageFilter, setMessageFilter] = useState('all'); // all, unread, read, resolved
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    const userId = localStorage.getItem('userId');
    try {
      const response = await axios.get(`${API_URL}/admin/pending-products/${userId}`);
      let filteredProducts = response.data.products;

      if (filter !== 'ALL') {
        filteredProducts = filteredProducts.filter(p => p.approvalStatus === filter);
      }

      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, [filter]);

  const fetchSellers = useCallback(async () => {
    const userId = localStorage.getItem('userId');
    try {
      const response = await axios.get(`${API_URL}/admin/all-sellers/${userId}`);
      setSellers(response.data.sellers || []);
    } catch (error) {
      console.error('Error fetching sellers:', error);
    }
  }, []);

  const fetchMessages = useCallback(async () => {
    const userId = localStorage.getItem('userId');
    try {
      const response = await axios.get(`${API_URL}/admin/messages/${userId}`);
      let filteredMessages = response.data.messages || [];
      setMessageCounts(response.data.counts || { unread: 0, read: 0, resolved: 0 });
      
      if (messageFilter !== 'all') {
        filteredMessages = filteredMessages.filter(m => m.status === messageFilter);
      }
      
      setMessages(filteredMessages);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [messageFilter]);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'products') {
        fetchProducts();
      } else if (activeTab === 'sellers') {
        fetchSellers();
      } else if (activeTab === 'messages') {
        fetchMessages();
      }
    }
  }, [isAdmin, activeTab, filter, messageFilter, fetchProducts, fetchSellers, fetchMessages]);

  const checkAdminStatus = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const response = await axios.get(`${API_URL}/check-admin/${userId}`);
      setIsAdmin(response.data.isAdmin);
    } catch (error) {
      console.error('Error checking admin status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hide product from homepage
  const handleHideProduct = async (productId) => {
    const reason = prompt('Reason for hiding (optional):');
    const userId = localStorage.getItem('userId');
    setActionLoading(productId);

    try {
      await axios.put(`${API_URL}/admin/hide-product/${productId}`, { userId, reason });
      setProducts(prev => prev.map(p => 
        p._id === productId ? { ...p, approvalStatus: 'HIDDEN', hiddenReason: reason } : p
      ));
      if (filter === 'APPROVED') {
        setProducts(prev => prev.filter(p => p._id !== productId));
      }
    } catch (error) {
      console.error('Error hiding product:', error);
      alert('Failed to hide product');
    } finally {
      setActionLoading(null);
    }
  };

  // Unhide product (restore to homepage)
  const handleUnhideProduct = async (productId) => {
    const userId = localStorage.getItem('userId');
    setActionLoading(productId);

    try {
      await axios.put(`${API_URL}/admin/unhide-product/${productId}`, { userId });
      setProducts(prev => prev.map(p => 
        p._id === productId ? { ...p, approvalStatus: 'APPROVED', hiddenReason: null } : p
      ));
      if (filter === 'HIDDEN') {
        setProducts(prev => prev.filter(p => p._id !== productId));
      }
    } catch (error) {
      console.error('Error unhiding product:', error);
      alert('Failed to restore product');
    } finally {
      setActionLoading(null);
    }
  };

  // Delete product permanently
  const handleDeleteProduct = async (productId) => {
    setConfirmModal({
      type: 'delete-product',
      id: productId,
      message: 'Are you sure you want to permanently delete this product? This cannot be undone.'
    });
  };

  const confirmDeleteProduct = async () => {
    const productId = confirmModal.id;
    const userId = localStorage.getItem('userId');
    setActionLoading(productId);
    setConfirmModal(null);

    try {
      await axios.delete(`${API_URL}/admin/delete-product/${productId}`, { data: { userId } });
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (error) {
      console.error('Error deleting product:', error);
      alert('Failed to delete product');
    } finally {
      setActionLoading(null);
    }
  };

  // Block seller
  const handleBlockSeller = async (sellerId, sellerName) => {
    setConfirmModal({
      type: 'block-seller',
      id: sellerId,
      name: sellerName,
      message: `Are you sure you want to block ${sellerName}? All their products will be hidden from the marketplace.`
    });
  };

  const confirmBlockSeller = async () => {
    const sellerId = confirmModal.id;
    const reason = prompt('Reason for blocking (optional):');
    const userId = localStorage.getItem('userId');
    setActionLoading(sellerId);
    setConfirmModal(null);

    try {
      await axios.put(`${API_URL}/admin/block-seller/${sellerId}`, { userId, reason });
      setSellers(prev => prev.map(s => 
        s._id === sellerId ? { ...s, isBlocked: true, blockedReason: reason } : s
      ));
      // Also update products list to reflect blocked seller
      setProducts(prev => prev.map(p => 
        p.addedBy?._id === sellerId ? { ...p, addedBy: { ...p.addedBy, isBlocked: true } } : p
      ));
    } catch (error) {
      console.error('Error blocking seller:', error);
      alert('Failed to block seller');
    } finally {
      setActionLoading(null);
    }
  };

  // Unblock seller
  const handleUnblockSeller = async (sellerId) => {
    const userId = localStorage.getItem('userId');
    setActionLoading(sellerId);

    try {
      await axios.put(`${API_URL}/admin/unblock-seller/${sellerId}`, { userId });
      setSellers(prev => prev.map(s => 
        s._id === sellerId ? { ...s, isBlocked: false, blockedReason: null } : s
      ));
      setProducts(prev => prev.map(p => 
        p.addedBy?._id === sellerId ? { ...p, addedBy: { ...p.addedBy, isBlocked: false } } : p
      ));
    } catch (error) {
      console.error('Error unblocking seller:', error);
      alert('Failed to unblock seller');
    } finally {
      setActionLoading(null);
    }
  };

  // Message handlers
  const handleMarkAsRead = async (messageId) => {
    const userId = localStorage.getItem('userId');
    try {
      await axios.put(`${API_URL}/admin/message/read/${messageId}`, { userId });
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, status: 'read', readAt: new Date() } : m
      ));
      setMessageCounts(prev => ({ ...prev, unread: prev.unread - 1 }));
      if (selectedMessage?._id === messageId) {
        setSelectedMessage(prev => ({ ...prev, status: 'read', readAt: new Date() }));
      }
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const handleResolveMessage = async (messageId, reply = '') => {
    const userId = localStorage.getItem('userId');
    try {
      await axios.put(`${API_URL}/admin/message/resolve/${messageId}`, { userId, reply });
      const wasUnread = messages.find(m => m._id === messageId)?.status === 'unread';
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, status: 'resolved', adminReply: reply, resolvedAt: new Date() } : m
      ));
      setMessageCounts(prev => ({ 
        ...prev, 
        unread: wasUnread ? prev.unread - 1 : prev.unread,
        resolved: prev.resolved + 1 
      }));
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error resolving message:', error);
      alert('Failed to resolve message');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;
    
    const userId = localStorage.getItem('userId');
    try {
      await axios.delete(`${API_URL}/admin/message/${messageId}`, { data: { userId } });
      const deletedMessage = messages.find(m => m._id === messageId);
      setMessages(prev => prev.filter(m => m._id !== messageId));
      setMessageCounts(prev => ({
        ...prev,
        total: prev.total - 1,
        unread: deletedMessage?.status === 'unread' ? prev.unread - 1 : prev.unread,
        resolved: deletedMessage?.status === 'resolved' ? prev.resolved - 1 : prev.resolved
      }));
      if (selectedMessage?._id === messageId) {
        setSelectedMessage(null);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      alert('Failed to delete message');
    }
  };

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Checking admin access...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="admin-unauthorized">
        <div className="unauthorized-content">
          <span className="lock-icon">🔒</span>
          <h2>Access Denied</h2>
          <p>You don't have permission to access the admin dashboard.</p>
          <button onClick={() => navigate('/')} className="back-home-btn">
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>🛡️ Admin Dashboard</h1>
        <p className="admin-subtitle">Moderate listings and manage sellers</p>
        <button onClick={() => navigate('/')} className="back-home-link">
          ← Back to Home
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="admin-tabs">
        <button 
          className={`tab-btn ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          📦 Products
        </button>
        <button 
          className={`tab-btn ${activeTab === 'sellers' ? 'active' : ''}`}
          onClick={() => setActiveTab('sellers')}
        >
          👥 Sellers
        </button>
        <button 
          className={`tab-btn ${activeTab === 'messages' ? 'active' : ''}`}
          onClick={() => setActiveTab('messages')}
        >
          📩 Messages
          {messageCounts.unread > 0 && (
            <span className="unread-badge">{messageCounts.unread}</span>
          )}
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' && (
        <>
          <div className="admin-filters">
            <button 
              className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
              onClick={() => setFilter('ALL')}
            >
              📦 All
            </button>
            <button 
              className={`filter-btn ${filter === 'APPROVED' ? 'active' : ''}`}
              onClick={() => setFilter('APPROVED')}
            >
              ✅ Live
            </button>
            <button 
              className={`filter-btn ${filter === 'HIDDEN' ? 'active' : ''}`}
              onClick={() => setFilter('HIDDEN')}
            >
              🚫 Hidden
            </button>
          </div>

          <div className="admin-stats">
            <div className="stat-card">
              <span className="stat-number">{products.length}</span>
              <span className="stat-label">
                {filter === 'ALL' ? 'Total' : filter === 'APPROVED' ? 'Live' : 'Hidden'} Products
              </span>
            </div>
          </div>

          {products.length === 0 ? (
            <div className="no-products">
              <span className="empty-icon">📭</span>
              <p>No {filter.toLowerCase()} products found</p>
            </div>
          ) : (
            <div className="admin-products-grid">
              {products.map((product) => (
                <div key={product._id} className={`admin-product-card ${product.addedBy?.isBlocked ? 'seller-blocked' : ''}`}>
                  <div className="product-image-container">
                    <img src={product.pimage} alt={product.pname} className="product-image" loading="lazy" />
                    <span className={`status-badge ${product.approvalStatus.toLowerCase()}`}>
                      {product.approvalStatus === 'APPROVED' ? '🟢 Live' : '🔴 Hidden'}
                    </span>
                    {product.addedBy?.isBlocked && (
                      <span className="blocked-badge">🚫 Seller Blocked</span>
                    )}
                  </div>
                  
                  <div className="product-details">
                    <h3 className="product-name">{product.pname}</h3>
                    <p className="product-price">₹{Number(product.price).toLocaleString('en-IN')}</p>
                    <p className="product-desc">{product.pdesc?.substring(0, 100)}...</p>
                    
                    <div className="product-meta">
                      <span>📍 {product.location}</span>
                      <span>📁 {product.category}</span>
                    </div>

                    {product.addedBy && (
                      <div className="seller-info">
                        <strong>Seller:</strong>
                        <span>{product.addedBy.username || product.addedBy.email?.split('@')[0]}</span>
                        {product.addedBy.isBlocked && <span className="blocked-text">(Blocked)</span>}
                      </div>
                    )}

                    {product.hiddenReason && (
                      <div className="hidden-reason">
                        <small>Hidden: {product.hiddenReason}</small>
                      </div>
                    )}
                  </div>

                  <div className="action-buttons">
                    {product.approvalStatus === 'APPROVED' ? (
                      <button 
                        className="hide-btn"
                        onClick={() => handleHideProduct(product._id)}
                        disabled={actionLoading === product._id}
                      >
                        {actionLoading === product._id ? '...' : '🚫 Remove from Home'}
                      </button>
                    ) : (
                      <button 
                        className="approve-btn"
                        onClick={() => handleUnhideProduct(product._id)}
                        disabled={actionLoading === product._id}
                      >
                        {actionLoading === product._id ? '...' : '✅ Restore to Home'}
                      </button>
                    )}
                    <button 
                      className="delete-btn"
                      onClick={() => handleDeleteProduct(product._id)}
                      disabled={actionLoading === product._id}
                    >
                      🗑️ Delete
                    </button>
                    {product.addedBy && !product.addedBy.isBlocked && (
                      <button 
                        className="block-btn"
                        onClick={() => handleBlockSeller(product.addedBy._id, product.addedBy.username || product.addedBy.email)}
                        disabled={actionLoading === product.addedBy._id}
                      >
                        🚷 Block Seller
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Sellers Tab */}
      {activeTab === 'sellers' && (
        <>
          <div className="admin-stats">
            <div className="stat-card">
              <span className="stat-number">{sellers.length}</span>
              <span className="stat-label">Total Sellers</span>
            </div>
            <div className="stat-card warning">
              <span className="stat-number">{sellers.filter(s => s.isBlocked).length}</span>
              <span className="stat-label">Blocked</span>
            </div>
          </div>

          {sellers.length === 0 ? (
            <div className="no-products">
              <span className="empty-icon">👥</span>
              <p>No sellers found</p>
            </div>
          ) : (
            <div className="sellers-list">
              {sellers.map((seller) => (
                <div key={seller._id} className={`seller-card ${seller.isBlocked ? 'blocked' : ''}`}>
                  <div className="seller-avatar">
                    {(seller.username || seller.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="seller-details">
                    <h3>{seller.username || seller.email?.split('@')[0]}</h3>
                    <p className="seller-email">{seller.email}</p>
                    <div className="seller-meta">
                      <span>📦 {seller.productCount || 0} products</span>
                      {seller.isBlocked && (
                        <span className="blocked-reason">🚫 Blocked: {seller.blockedReason || 'No reason'}</span>
                      )}
                    </div>
                  </div>
                  <div className="seller-actions">
                    {seller.isBlocked ? (
                      <button 
                        className="unblock-btn"
                        onClick={() => handleUnblockSeller(seller._id)}
                        disabled={actionLoading === seller._id}
                      >
                        {actionLoading === seller._id ? '...' : '✅ Unblock'}
                      </button>
                    ) : (
                      <button 
                        className="block-btn"
                        onClick={() => handleBlockSeller(seller._id, seller.username || seller.email)}
                        disabled={actionLoading === seller._id}
                      >
                        {actionLoading === seller._id ? '...' : '🚷 Block'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <>
          <div className="admin-filters">
            <button 
              className={`filter-btn ${messageFilter === 'all' ? 'active' : ''}`}
              onClick={() => setMessageFilter('all')}
            >
              📬 All ({messageCounts.total})
            </button>
            <button 
              className={`filter-btn ${messageFilter === 'unread' ? 'active' : ''}`}
              onClick={() => setMessageFilter('unread')}
            >
              🔴 Unread ({messageCounts.unread})
            </button>
            <button 
              className={`filter-btn ${messageFilter === 'read' ? 'active' : ''}`}
              onClick={() => setMessageFilter('read')}
            >
              📖 Read
            </button>
            <button 
              className={`filter-btn ${messageFilter === 'resolved' ? 'active' : ''}`}
              onClick={() => setMessageFilter('resolved')}
            >
              ✅ Resolved ({messageCounts.resolved})
            </button>
          </div>

          {messages.length === 0 ? (
            <div className="no-items">
              <span className="no-icon">📭</span>
              <p>No {messageFilter === 'all' ? '' : messageFilter} messages</p>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((message) => (
                <div 
                  key={message._id} 
                  className={`message-card ${message.status}`}
                  onClick={() => {
                    setSelectedMessage(message);
                    if (message.status === 'unread') {
                      handleMarkAsRead(message._id);
                    }
                  }}
                >
                  <div className="message-header">
                    <div className="message-sender">
                      <span className="sender-avatar">
                        {(message.userId?.username || message.userId?.email || 'U').charAt(0).toUpperCase()}
                      </span>
                      <div className="sender-info">
                        <span className="sender-name">{message.userId?.username || message.userId?.email?.split('@')[0] || 'Unknown User'}</span>
                        <span className="sender-email">{message.userId?.email || 'No email'}</span>
                      </div>
                    </div>
                    <div className="message-meta">
                      <span className={`status-badge ${message.status}`}>
                        {message.status === 'unread' ? '🔴' : message.status === 'read' ? '📖' : '✅'} {message.status}
                      </span>
                      <span className="message-date">
                        {new Date(message.createdAt).toLocaleDateString()} {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                  </div>
                  <div className="message-subject">
                    <strong>{message.subject}</strong>
                  </div>
                  <div className="message-preview">
                    {message.message.length > 150 ? message.message.substring(0, 150) + '...' : message.message}
                  </div>
                  <div className="message-actions" onClick={(e) => e.stopPropagation()}>
                    {message.status !== 'resolved' && (
                      <button 
                        className="resolve-quick-btn"
                        onClick={() => handleResolveMessage(message._id)}
                        title="Mark as resolved"
                      >
                        ✅ Resolve
                      </button>
                    )}
                    <button 
                      className="delete-msg-btn"
                      onClick={() => handleDeleteMessage(message._id)}
                      title="Delete message"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="message-modal-overlay" onClick={() => setSelectedMessage(null)}>
          <div className="message-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedMessage(null)}>×</button>
            
            <div className="message-modal-header">
              <div className="modal-sender">
                <span className="sender-avatar large">
                  {(selectedMessage.userId?.username || selectedMessage.userId?.email || 'U').charAt(0).toUpperCase()}
                </span>
                <div className="sender-info">
                  <span className="sender-name">{selectedMessage.userId?.username || selectedMessage.userId?.email?.split('@')[0]}</span>
                  <span className="sender-email">{selectedMessage.userId?.email}</span>
                  {selectedMessage.userId?.mobile && (
                    <span className="sender-mobile">📞 {selectedMessage.userId.mobile}</span>
                  )}
                </div>
              </div>
              <span className={`status-badge ${selectedMessage.status}`}>
                {selectedMessage.status === 'unread' ? '🔴 Unread' : selectedMessage.status === 'read' ? '📖 Read' : '✅ Resolved'}
              </span>
            </div>

            <div className="message-modal-body">
              <div className="modal-subject">
                <label>Subject:</label>
                <strong>{selectedMessage.subject}</strong>
              </div>
              <div className="modal-message">
                <label>Message:</label>
                <p>{selectedMessage.message}</p>
              </div>
              <div className="modal-timestamps">
                <span>Sent: {new Date(selectedMessage.createdAt).toLocaleString()}</span>
                {selectedMessage.readAt && (
                  <span>Read: {new Date(selectedMessage.readAt).toLocaleString()}</span>
                )}
                {selectedMessage.resolvedAt && (
                  <span>Resolved: {new Date(selectedMessage.resolvedAt).toLocaleString()}</span>
                )}
              </div>
              {selectedMessage.adminReply && (
                <div className="modal-reply">
                  <label>Admin Reply:</label>
                  <p>{selectedMessage.adminReply}</p>
                </div>
              )}
            </div>

            <div className="message-modal-actions">
              {selectedMessage.status !== 'resolved' && (
                <>
                  <button 
                    className="resolve-btn with-reply"
                    onClick={() => {
                      const reply = prompt('Add an optional reply (leave empty for no reply):');
                      if (reply !== null) {
                        handleResolveMessage(selectedMessage._id, reply);
                      }
                    }}
                  >
                    ✅ Resolve with Reply
                  </button>
                  <button 
                    className="resolve-btn"
                    onClick={() => handleResolveMessage(selectedMessage._id)}
                  >
                    ✅ Resolve
                  </button>
                </>
              )}
              <button 
                className="delete-btn"
                onClick={() => handleDeleteMessage(selectedMessage._id)}
              >
                🗑️ Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="confirm-modal-overlay" onClick={() => setConfirmModal(null)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>⚠️ Confirm Action</h3>
            <p>{confirmModal.message}</p>
            <div className="confirm-buttons">
              <button className="cancel-btn" onClick={() => setConfirmModal(null)}>
                Cancel
              </button>
              <button 
                className="confirm-btn"
                onClick={confirmModal.type === 'delete-product' ? confirmDeleteProduct : confirmBlockSeller}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
