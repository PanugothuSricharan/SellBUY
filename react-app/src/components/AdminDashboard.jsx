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
  const [activeTab, setActiveTab] = useState('products'); // products, sellers
  const [filter, setFilter] = useState('ALL'); // ALL, APPROVED, HIDDEN
  const [actionLoading, setActionLoading] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
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

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      if (activeTab === 'products') {
        fetchProducts();
      } else {
        fetchSellers();
      }
    }
  }, [isAdmin, activeTab, filter, fetchProducts, fetchSellers]);

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
                    <img src={product.pimage} alt={product.pname} className="product-image" />
                    <span className={`status-badge ${product.approvalStatus.toLowerCase()}`}>
                      {product.approvalStatus === 'APPROVED' ? '🟢 Live' : '🔴 Hidden'}
                    </span>
                    {product.addedBy?.isBlocked && (
                      <span className="blocked-badge">🚫 Seller Blocked</span>
                    )}
                  </div>
                  
                  <div className="product-details">
                    <h3 className="product-name">{product.pname}</h3>
                    <p className="product-price">₹{product.price}</p>
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
