# 🚨 Edge Cases & Security Considerations for SellBUY

## ✅ Implemented Features
- Mobile number requested only on first listing
- Modal prevents product submission without mobile
- Mobile saved to user profile for future listings
- 10-digit validation

---

## ⚠️ Edge Cases We're Handling

### 1. **Google Sign-In Users (No Mobile Initially)**
- ✅ **Solution**: Modal automatically appears when they try to list first item
- ✅ User cannot proceed without adding mobile

### 2. **Manual Signup Users**
- ✅ Mobile collected during signup
- ✅ Modal still checks in case mobile is empty/deleted

### 3. **User Wants to Change Mobile Number**
- ❌ **Missing**: No UI to update mobile from profile
- 📋 **TODO**: Add profile page with "Edit Mobile Number" option

### 4. **User Closes Modal Without Entering Mobile**
- ✅ Modal cannot be closed (no X button)
- ✅ Must enter valid mobile to continue
- ⚠️ **Consideration**: User might close browser tab - acceptable

### 5. **Invalid Mobile Numbers**
- ✅ Validates 10-digit format
- ✅ Shows error message
- ⚠️ **Missing**: 
  - No check for valid Indian number prefixes (6-9)
  - No duplicate mobile check across users

---

## 🔴 Critical Security Issues (Still Unresolved)

### 1. **Password Storage - CRITICAL**
```javascript
// ❌ CURRENT: Plain text passwords
password: password  

// ✅ SHOULD BE: Hashed with bcrypt
const hashedPassword = await bcrypt.hash(password, 10);
```
**Impact**: If database is compromised, all passwords are exposed
**Fix Time**: 2 hours

### 2. **No Authentication Middleware**
```javascript
// ❌ CURRENT: Trusting client-sent userId
const userId = req.body.userId;

// ✅ SHOULD BE: Extract from verified JWT
const userId = req.user.id; // from JWT middleware
```
**Impact**: Anyone can delete/edit anyone's products by sending different userId
**Fix Time**: 3 hours

### 3. **JWT Secret Hardcoded Fallback**
```javascript
process.env.JWT_SECRET || "MY_SECRET_KEY" // ❌ NEVER do this
```
**Impact**: If .env is missing, uses predictable secret - tokens can be forged
**Fix Time**: 5 minutes

### 4. **No Input Sanitization**
```javascript
// ❌ CURRENT: Direct input to database
pname: req.body.pname

// ✅ SHOULD BE: Sanitized
pname: sanitize(req.body.pname)
```
**Impact**: XSS attacks, NoSQL injection
**Fix Time**: 2 hours

### 5. **No Rate Limiting**
**Impact**: 
- Spam product listings
- Brute force login attempts
- DoS attacks

**Fix Time**: 1 hour (use `express-rate-limit`)

---

## 🟡 Data Integrity Issues

### 6. **Price Stored as String**
```javascript
// ❌ CURRENT
price: String

// ✅ SHOULD BE
price: { type: Number, required: true, min: 0 }
```
**Impact**: 
- Can't sort by price properly
- Can store "abc" as price
- Can store negative prices

### 7. **No Email Uniqueness Constraint**
**Impact**: Same email can register multiple times
```javascript
// ✅ SHOULD ADD
email: { type: String, unique: true, required: true }
```

### 8. **No Phone Number Uniqueness Check**
**Impact**: Multiple users can use same mobile (privacy/spam concern)

### 9. **Orphaned Cloudinary Images**
**Impact**: 
- When product is deleted, images stay on Cloudinary
- Wastes storage, costs money
```javascript
// ✅ SHOULD ADD: Delete images when deleting product
await cloudinary.uploader.destroy(publicId);
```

---

## 🟢 User Experience Edge Cases

### 10. **User Edits Product - Should Mobile Change?**
- ❓ **Question**: If user updates mobile in profile, should it reflect in old listings?
- 📋 **Current**: Mobile is in user profile, not product document
- ⚠️ **Consideration**: Might want to store mobile per product (in case user sold phone)

### 11. **Sold Products - Should Mobile Be Hidden?**
- ❓ **Question**: After marking "Sold", should mobile still be visible?
- 📋 **Suggestion**: Hide contact info for sold items

### 12. **WhatsApp Link Validation**
- ❌ **Missing**: No validation that mobile has WhatsApp enabled
- 📋 **Suggestion**: Add disclaimer in modal

### 13. **International Numbers**
- ❌ **Missing**: Assumes Indian 10-digit format
- 📋 **Future**: Support country codes for international students

### 14. **User Deletes Account**
- ❌ **Missing**: No account deletion feature
- ❓ **Question**: What happens to their listings?
- 📋 **Options**:
  1. Soft delete - hide products
  2. Hard delete - remove everything
  3. Transfer to "Deleted User" placeholder

---

## 🔵 Privacy & Compliance

### 15. **GDPR/Data Privacy**
- ❌ **Missing**: No privacy policy
- ❌ **Missing**: No data deletion request mechanism
- ❌ **Missing**: No consent for data collection

### 16. **Mobile Number Visibility**
- ⚠️ **Current**: Shown to everyone on product detail page
- 📋 **Better**: Show only after clicking "Show Contact"
- 📋 **Best**: Show only to logged-in users

### 17. **Email Harvesting Protection**
- ❌ **Missing**: Emails visible in API responses
- ✅ **Should**: Remove email from public user endpoints

---

## 🎯 Business Logic Edge Cases

### 18. **Simultaneous Buyers**
- ❓ **Scenario**: 5 people contact seller at same time
- ❌ **Missing**: No "first come first serve" indicator
- 📋 **Suggestion**: Add "X people contacted" counter

### 19. **Spam/Fake Listings**
- ❌ **Missing**: No verification system
- ❌ **Missing**: No report/flag mechanism
- 📋 **Suggestion**: 
  - Admin approval for first listing
  - Report button on products
  - User reputation system

### 20. **Product Expiry**
- ❌ **Missing**: Old listings stay forever
- 📋 **Suggestion**: Auto-mark as sold after 60 days or prompt user

---

## 📊 Database & Performance

### 21. **No Database Indexes**
```javascript
// ✅ SHOULD ADD
db.products.createIndex({ location: 1, category: 1 });
db.products.createIndex({ addedBy: 1 });
db.users.createIndex({ email: 1 }, { unique: true });
```
**Impact**: Slow queries as data grows

### 22. **No Pagination**
- ❌ **Current**: Loads ALL products at once
- **Impact**: Page becomes slow with 1000+ products
- 📋 **Fix**: Add pagination (20 products per page)

### 23. **Image Size Limits**
- ⚠️ **Current**: Cloudinary transforms to 800x800
- ❌ **Missing**: No file size validation before upload
- 📋 **Should**: Reject files > 5MB client-side

---

## 🛡️ Error Handling

### 24. **Network Failures**
- ⚠️ **Partial**: Shows error messages
- ❌ **Missing**: Retry mechanism
- ❌ **Missing**: Offline detection

### 25. **Partial Form Submission**
- ❓ **Scenario**: User fills form, closes browser
- ❌ **Missing**: No form auto-save/draft
- 📋 **Suggestion**: LocalStorage draft saving

### 26. **Cloudinary Upload Failures**
- ❌ **Missing**: No fallback if Cloudinary is down
- ❌ **Missing**: No cleanup of partially uploaded products

---

## 📱 Mobile/Responsive Edge Cases

### 27. **Large Images on Mobile**
- ⚠️ **Needs Testing**: Modal on small screens
- 📋 **Check**: Image previews on mobile data

### 28. **Slow Networks**
- ❌ **Missing**: No upload progress indicator
- 📋 **Should**: Show "Uploading... 45%" for images

---

## 🔧 Deployment Edge Cases

### 29. **Environment Variables Missing**
- ⚠️ **Current**: Fallbacks to hardcoded values
- ✅ **Should**: Throw error and refuse to start

### 30. **CORS Configuration**
```javascript
// ⚠️ CURRENT: Allows all origins in dev
origin: process.env.FRONTEND_URL || "*"

// ✅ PRODUCTION: Should be strict
origin: process.env.FRONTEND_URL || "https://sellbuy-iiitm.com"
```

---

## 🎓 Recommendation Priority

### 🔴 **DO IMMEDIATELY** (Before showing to recruiters)
1. Hash passwords with bcrypt
2. Add JWT authentication middleware
3. Remove JWT secret fallback
4. Add email uniqueness constraint
5. Add input validation (express-validator)

### 🟡 **DO BEFORE DEPLOYMENT**
1. Add rate limiting
2. Implement pagination
3. Add database indexes
4. Change price to Number type
5. Add error boundaries in React
6. Clean up Cloudinary images on delete

### 🟢 **NICE TO HAVE** (Future enhancements)
1. Profile page to edit mobile
2. Report/flag system
3. Product expiry/auto-archive
4. Upload progress indicator
5. Draft saving
6. User reputation system

---

## 📝 Additional Features to Consider

1. **Search Improvements**
   - Fuzzy search (typo tolerance)
   - Search history
   - Popular searches

2. **Notifications**
   - Email when product liked
   - SMS when someone contacts
   - Price drop alerts

3. **Analytics**
   - View count per product
   - Most viewed categories
   - Peak listing times

4. **Social Features**
   - Share product on WhatsApp
   - Product recommendations
   - "Similar products" section

---

## 💡 Your Next Steps

1. **Security First**: Fix password hashing (30 min task)
2. **Auth Middleware**: Protect all routes (2 hour task)
3. **Profile Page**: Let users update mobile (1 hour task)
4. **Testing**: Test mobile modal with different scenarios
5. **Deployment**: Set up proper environment variables

Would you like me to help implement any of these fixes?
