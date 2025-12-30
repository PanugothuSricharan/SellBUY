import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import API_URL from '../constants';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

function AdminDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [filter, setFilter] = useState('PENDING'); // PENDING, APPROVED, REJECTED, ALL
  const [actionLoading, setActionLoading] = useState(null);
  const navigate = useNavigate();

  const fetchProducts = useCallback(async () => {
    const userId = localStorage.getItem('userId');
    try {
      let endpoint = filter === 'PENDING' 
        ? `${API_URL}/admin/pending-products/${userId}`
        : `${API_URL}/admin/all-products/${userId}`;

      const response = await axios.get(endpoint);
      let filteredProducts = response.data.products;

      if (filter !== 'ALL' && filter !== 'PENDING') {
        filteredProducts = filteredProducts.filter(p => p.approvalStatus === filter);
      }

      setProducts(filteredProducts);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  }, [filter]);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      fetchProducts();
    }
  }, [isAdmin, filter, fetchProducts]);

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

  const handleApprove = async (productId) => {
    const userId = localStorage.getItem('userId');
    setActionLoading(productId);

    try {
      await axios.put(`${API_URL}/admin/approve-product/${productId}`, { userId });
      // Remove from list or update status
      setProducts(prev => prev.map(p => 
        p._id === productId ? { ...p, approvalStatus: 'APPROVED' } : p
      ));
      // If filtering by pending, remove from view
      if (filter === 'PENDING') {
        setProducts(prev => prev.filter(p => p._id !== productId));
      }
    } catch (error) {
      console.error('Error approving product:', error);
      alert('Failed to approve product');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (productId) => {
    const reason = prompt('Enter rejection reason (optional):');
    const userId = localStorage.getItem('userId');
    setActionLoading(productId);

    try {
      await axios.put(`${API_URL}/admin/reject-product/${productId}`, { 
        userId, 
        rejectionReason: reason 
      });
      setProducts(prev => prev.map(p => 
        p._id === productId ? { ...p, approvalStatus: 'REJECTED' } : p
      ));
      if (filter === 'PENDING') {
        setProducts(prev => prev.filter(p => p._id !== productId));
      }
    } catch (error) {
      console.error('Error rejecting product:', error);
      alert('Failed to reject product');
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
        <p className="admin-subtitle">Manage product listings and approvals</p>
      </div>

      <div className="admin-filters">
        <button 
          className={`filter-btn ${filter === 'PENDING' ? 'active' : ''}`}
          onClick={() => setFilter('PENDING')}
        >
          📋 Pending
        </button>
        <button 
          className={`filter-btn ${filter === 'APPROVED' ? 'active' : ''}`}
          onClick={() => setFilter('APPROVED')}
        >
          ✅ Approved
        </button>
        <button 
          className={`filter-btn ${filter === 'REJECTED' ? 'active' : ''}`}
          onClick={() => setFilter('REJECTED')}
        >
          ❌ Rejected
        </button>
        <button 
          className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          📦 All
        </button>
      </div>

      <div className="admin-stats">
        <div className="stat-card">
          <span className="stat-number">{products.length}</span>
          <span className="stat-label">
            {filter === 'ALL' ? 'Total' : filter.charAt(0) + filter.slice(1).toLowerCase()} Products
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
            <div key={product._id} className="admin-product-card">
              <div className="product-image-container">
                <img src={product.pimage} alt={product.pname} className="product-image" />
                <span className={`status-badge ${product.approvalStatus.toLowerCase()}`}>
                  {product.approvalStatus}
                </span>
              </div>
              
              <div className="product-details">
                <h3 className="product-name">{product.pname}</h3>
                <p className="product-price">₹{product.price}</p>
                <p className="product-desc">{product.pdesc}</p>
                
                <div className="product-meta">
                  <span>📍 {product.location}</span>
                  <span>📁 {product.category}</span>
                  <span>🏷️ {product.condition}</span>
                </div>

                {product.addedBy && (
                  <div className="seller-info">
                    <strong>Seller:</strong>
                    <span>{product.addedBy.username || product.addedBy.email}</span>
                    {product.addedBy.mobile && <span>📱 {product.addedBy.mobile}</span>}
                  </div>
                )}
              </div>

              {product.approvalStatus === 'PENDING' && (
                <div className="action-buttons">
                  <button 
                    className="approve-btn"
                    onClick={() => handleApprove(product._id)}
                    disabled={actionLoading === product._id}
                  >
                    {actionLoading === product._id ? '...' : '✅ Approve'}
                  </button>
                  <button 
                    className="reject-btn"
                    onClick={() => handleReject(product._id)}
                    disabled={actionLoading === product._id}
                  >
                    {actionLoading === product._id ? '...' : '❌ Reject'}
                  </button>
                </div>
              )}

              {product.approvalStatus === 'REJECTED' && (
                <div className="action-buttons">
                  <button 
                    className="approve-btn"
                    onClick={() => handleApprove(product._id)}
                    disabled={actionLoading === product._id}
                  >
                    {actionLoading === product._id ? '...' : '✅ Approve Now'}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
