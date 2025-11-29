// ===== BLOG DETAIL JAVASCRIPT =====

// State management
let blogData = {
  id: null,
  liked: false,
  bookmarked: false,
  likes: 0,
  comments: []
};

let currentUser = {
  name: "Current User",
  avatar: null
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  initializeBlogDetail();
  setupEventListeners();
  loadBlogData();
  loadComments();
});

// ===== INITIALIZE =====
function initializeBlogDetail() {
  // Get blog ID from URL or data attribute
  const urlParams = new URLSearchParams(window.location.search);
  blogData.id = urlParams.get('id') || document.querySelector('[data-blog-id]')?.dataset.blogId;
  
  // Check if user is logged in
  checkUserSession();
}

function checkUserSession() {
  // This would typically check your backend session
  // For now, we'll simulate it
  const username = sessionStorage.getItem('username') || 'Guest User';
  currentUser.name = username;
}

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  // Like button
  const likeBtn = document.getElementById('like-btn');
  if (likeBtn) {
    likeBtn.addEventListener('click', handleLike);
  }

  // Bookmark button
  const bookmarkBtn = document.getElementById('bookmark-btn');
  if (bookmarkBtn) {
    bookmarkBtn.addEventListener('click', handleBookmark);
  }

  // Share button
  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) {
    shareBtn.addEventListener('click', openShareModal);
  }

  // Submit comment
  const submitCommentBtn = document.getElementById('submit-comment-btn');
  if (submitCommentBtn) {
    submitCommentBtn.addEventListener('click', submitComment);
  }

  // Comment textarea auto-resize
  const commentInput = document.getElementById('comment-input');
  if (commentInput) {
    commentInput.addEventListener('input', autoResizeTextarea);
    commentInput.addEventListener('keydown', function(e) {
      if (e.ctrlKey && e.key === 'Enter') {
        submitComment();
      }
    });
  }

  // Sort comments
  const sortBtns = document.querySelectorAll('.sort-btn-small');
  sortBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      sortComments(this.dataset.sort);
      sortBtns.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });
}

// ===== LOAD BLOG DATA =====
function loadBlogData() {
  // This would typically fetch from your backend
  // For now, we'll use the data already in the HTML
  
  // Initialize likes and views with random numbers for demo
  blogData.likes = Math.floor(Math.random() * 500) + 50;
  document.getElementById('like-count').textContent = blogData.likes;
  
  // Update stats
  updateStats();
  
  // Load tags
  loadTags();
  
  // Check if user has liked/bookmarked
  checkUserInteractions();
  
  // Parse markdown content
  parseMarkdownContent();
}

// ===== PARSE MARKDOWN CONTENT =====
function parseMarkdownContent() {
  const contentElement = document.getElementById('content-html');
  if (!contentElement) return;
  // Get raw text (escaped by template) and convert to HTML
  let markdown = contentElement.textContent || contentElement.innerText || '';
  // Trim leading/trailing whitespace to avoid empty paragraphs
  markdown = markdown.replace(/^\s+|\s+$/g, '');

  // Convert markdown to HTML
  const html = markdownToHtml(markdown);
  contentElement.innerHTML = html;
}

function markdownToHtml(markdown) {
  let html = markdown;
  
  // Code blocks (must be before inline code)
  html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, function(match, lang, code) {
    return `<pre><code class="language-${lang || 'text'}">${escapeHtml(code.trim())}</code></pre>`;
  });
  
  // Inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  
  // Headers
  html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
  
  // Bold
  html = html.replace(/\*\*([^\*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  
  // Italic
  html = html.replace(/\*([^\*]+)\*/g, '<em>$1</em>');
  html = html.replace(/_([^_]+)_/g, '<em>$1</em>');
  
  // Strikethrough
  html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
  
  // Images
  html = html.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" />');
  
  // Blockquotes
  html = html.replace(/^> (.*$)/gm, '<blockquote>$1</blockquote>');
  
  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');
  html = html.replace(/^\*\*\*$/gm, '<hr>');
  
  // Unordered lists
  html = html.replace(/^\* (.*$)/gm, '<li>$1</li>');
  html = html.replace(/^- (.*$)/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  
  // Ordered lists
  html = html.replace(/^\d+\. (.*$)/gm, '<li>$1</li>');
  
  // Line breaks and paragraphs
  html = html.replace(/\n\n/g, '</p><p>');
  html = html.replace(/\n/g, '<br>');
  
  // Wrap in paragraphs if not already wrapped
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>';
  }
  
  return html;
}

function checkUserInteractions() {
  // Check localStorage for user interactions
  const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
  const bookmarkedPosts = JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
  
  if (blogData.id && likedPosts.includes(blogData.id)) {
    blogData.liked = true;
    document.getElementById('like-btn').classList.add('liked');
  }
  
  if (blogData.id && bookmarkedPosts.includes(blogData.id)) {
    blogData.bookmarked = true;
    document.getElementById('bookmark-btn').classList.add('bookmarked');
  }
}

function updateStats() {
  const views = Math.floor(Math.random() * 2000) + 100;
  const readTime = Math.floor(Math.random() * 10) + 3;
  
  // Update any stat displays if they exist
  const statsContainer = document.querySelector('.action-stats');
  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="stat-item">
        <i class="fas fa-eye"></i>
        <span>${views} views</span>
      </div>
      <div class="stat-item">
        <i class="fas fa-clock"></i>
        <span>${readTime} min read</span>
      </div>
    `;
  }
}

function loadTags() {
  const tagsContainer = document.getElementById('post-tags');
  if (!tagsContainer) return;
  
  // Example tags - you would get these from your backend
  const tags = ['Technology', 'Web Development', 'Tutorial', 'JavaScript'];
  
  tagsContainer.innerHTML = `
    <div class="blog-tags-title">Tags:</div>
    ${tags.map(tag => `
      <span class="tag">
        <i class="fas fa-tag"></i>
        ${tag}
      </span>
    `).join('')}
  `;
}

// ===== INTERACTION HANDLERS =====
function handleLike() {
  const likeBtn = document.getElementById('like-btn');
  const likeCount = document.getElementById('like-count');
  
  blogData.liked = !blogData.liked;
  
  if (blogData.liked) {
    blogData.likes++;
    likeBtn.classList.add('liked');
    showNotification('Post liked! ❤️');
    
    // Save to localStorage
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
    if (blogData.id && !likedPosts.includes(blogData.id)) {
      likedPosts.push(blogData.id);
      localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
    }
  } else {
    blogData.likes--;
    likeBtn.classList.remove('liked');
    
    // Remove from localStorage
    const likedPosts = JSON.parse(localStorage.getItem('likedPosts') || '[]');
    const index = likedPosts.indexOf(blogData.id);
    if (index > -1) {
      likedPosts.splice(index, 1);
      localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
    }
  }
  
  likeCount.textContent = blogData.likes;
  
  // TODO: Send to backend
  // updateLikeOnServer(blogData.id, blogData.liked);
}

function handleBookmark() {
  const bookmarkBtn = document.getElementById('bookmark-btn');
  
  blogData.bookmarked = !blogData.bookmarked;
  
  if (blogData.bookmarked) {
    bookmarkBtn.classList.add('bookmarked');
    bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> Bookmarked';
    showNotification('Post bookmarked! 📌');
    
    // Save to localStorage
    const bookmarkedPosts = JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
    if (blogData.id && !bookmarkedPosts.includes(blogData.id)) {
      bookmarkedPosts.push(blogData.id);
      localStorage.setItem('bookmarkedPosts', JSON.stringify(bookmarkedPosts));
    }
  } else {
    bookmarkBtn.classList.remove('bookmarked');
    bookmarkBtn.innerHTML = '<i class="fas fa-bookmark"></i> Bookmark';
    showNotification('Bookmark removed');
    
    // Remove from localStorage
    const bookmarkedPosts = JSON.parse(localStorage.getItem('bookmarkedPosts') || '[]');
    const index = bookmarkedPosts.indexOf(blogData.id);
    if (index > -1) {
      bookmarkedPosts.splice(index, 1);
      localStorage.setItem('bookmarkedPosts', JSON.stringify(bookmarkedPosts));
    }
  }
  
  // TODO: Send to backend
  // updateBookmarkOnServer(blogData.id, blogData.bookmarked);
}

// ===== SHARE FUNCTIONALITY =====
function openShareModal() {
  const modal = document.createElement('div');
  modal.className = 'share-modal active';
  modal.innerHTML = `
    <div class="share-content">
      <h3><i class="fas fa-share-alt"></i> Share this post</h3>
      <div class="share-options">
        <div class="share-option" onclick="shareOn('twitter')">
          <i class="fab fa-twitter"></i>
          <span>Twitter</span>
        </div>
        <div class="share-option" onclick="shareOn('facebook')">
          <i class="fab fa-facebook"></i>
          <span>Facebook</span>
        </div>
        <div class="share-option" onclick="shareOn('linkedin')">
          <i class="fab fa-linkedin"></i>
          <span>LinkedIn</span>
        </div>
        <div class="share-option" onclick="shareOn('reddit')">
          <i class="fab fa-reddit"></i>
          <span>Reddit</span>
        </div>
        <div class="share-option" onclick="shareOn('whatsapp')">
          <i class="fab fa-whatsapp"></i>
          <span>WhatsApp</span>
        </div>
        <div class="share-option" onclick="shareOn('email')">
          <i class="fas fa-envelope"></i>
          <span>Email</span>
        </div>
      </div>
      <div class="share-link">
        <input type="text" value="${window.location.href}" readonly id="share-url">
        <button class="copy-link-btn" onclick="copyLink()">
          <i class="fas fa-copy"></i> Copy
        </button>
      </div>
      <button class="close-share-btn" onclick="closeShareModal()">Close</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  modal.addEventListener('click', function(e) {
    if (e.target === modal) {
      closeShareModal();
    }
  });
}

function shareOn(platform) {
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent(document.querySelector('.blog-title')?.textContent || 'Check out this post');
  
  let shareUrl = '';
  
  switch(platform) {
    case 'twitter':
      shareUrl = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
      break;
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      break;
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      break;
    case 'reddit':
      shareUrl = `https://reddit.com/submit?url=${url}&title=${title}`;
      break;
    case 'whatsapp':
      shareUrl = `https://wa.me/?text=${title}%20${url}`;
      break;
    case 'email':
      shareUrl = `mailto:?subject=${title}&body=${url}`;
      break;
  }
  
  if (shareUrl) {
    window.open(shareUrl, '_blank', 'width=600,height=400');
  }
}

function copyLink() {
  const input = document.getElementById('share-url');
  input.select();
  document.execCommand('copy');
  
  const btn = document.querySelector('.copy-link-btn');
  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-check"></i> Copied!';
  
  setTimeout(() => {
    btn.innerHTML = originalHTML;
  }, 2000);
  
  showNotification('Link copied to clipboard! 📋');
}

function closeShareModal() {
  const modal = document.querySelector('.share-modal');
  if (modal) {
    modal.classList.remove('active');
    setTimeout(() => modal.remove(), 300);
  }
}

// ===== COMMENTS FUNCTIONALITY =====
function loadComments() {
  // Load existing comments from backend
  // For demo, we'll create some sample comments
  blogData.comments = generateSampleComments();
  renderComments();
}

function generateSampleComments() {
  const names = ['Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown', 'Emma Davis'];
  const comments = [];
  
  for (let i = 0; i < 5; i++) {
    const comment = {
      id: `comment-${i}`,
      author: names[i % names.length],
      text: 'Great article! This is really helpful and well-written. Thanks for sharing your insights.',
      date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      likes: Math.floor(Math.random() * 20),
      liked: false,
      replies: []
    };
    
    // Add some replies
    if (Math.random() > 0.5) {
      comment.replies.push({
        id: `reply-${i}-1`,
        author: names[(i + 1) % names.length],
        text: 'I agree! This was very informative.',
        date: new Date(comment.date.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000),
        likes: Math.floor(Math.random() * 10),
        liked: false
      });
    }
    
    comments.push(comment);
  }
  
  return comments;
}

function renderComments() {
  const commentsList = document.getElementById('comments-list');
  const commentsCount = document.querySelector('.comments-count');
  
  if (!commentsList) return;
  
  // Update comments count
  if (commentsCount) {
    commentsCount.textContent = blogData.comments.length;
  }
  
  // Show empty state if no comments
  if (blogData.comments.length === 0) {
    commentsList.innerHTML = `
      <div class="no-comments">
        <i class="fas fa-comments"></i>
        <h4>No comments yet</h4>
        <p>Be the first to share your thoughts!</p>
      </div>
    `;
    return;
  }
  
  // Render comments
  commentsList.innerHTML = blogData.comments.map(comment => createCommentHTML(comment)).join('');
  
  // Add event listeners to comment actions
  addCommentEventListeners();
}

function createCommentHTML(comment, isReply = false) {
  const timeAgo = getTimeAgo(comment.date);
  const avatar = getInitials(comment.author);
  const hasReplies = comment.replies && comment.replies.length > 0;
  
  return `
    <div class="comment ${isReply ? 'reply' : ''}" data-comment-id="${comment.id}">
      <div class="comment-header">
        <div class="comment-author-info">
          <div class="comment-avatar">${avatar}</div>
          <div class="comment-author-details">
            <div class="comment-author">${comment.author}</div>
            <div class="comment-date">
              <i class="fas fa-clock"></i>
              ${timeAgo}
            </div>
          </div>
        </div>
        <div class="comment-actions">
          <button class="comment-action-btn edit-comment-btn" title="Edit">
            <i class="fas fa-edit"></i>
          </button>
          <button class="comment-action-btn delete-comment-btn" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </div>
      <div class="comment-body">
        <p class="comment-text">${escapeHtml(comment.text)}</p>
      </div>
      <div class="comment-footer">
        <button class="comment-like-btn ${comment.liked ? 'liked' : ''}" data-comment-id="${comment.id}">
          <i class="fas fa-heart"></i>
          <span>${comment.likes}</span>
        </button>
        <button class="comment-reply-btn" data-comment-id="${comment.id}">
          <i class="fas fa-reply"></i>
          Reply
        </button>
        ${hasReplies ? `<button class="show-replies-btn" data-comment-id="${comment.id}">
          <i class="fas fa-chevron-down"></i>
          ${comment.replies.length} ${comment.replies.length === 1 ? 'reply' : 'replies'}
        </button>` : ''}
      </div>
      ${hasReplies ? `
        <div class="comment-replies" id="replies-${comment.id}" style="display: none;">
          ${comment.replies.map(reply => createCommentHTML(reply, true)).join('')}
        </div>
      ` : ''}
    </div>
  `;
}

function addCommentEventListeners() {
  // Like comment buttons
  document.querySelectorAll('.comment-like-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      likeComment(this.dataset.commentId, this);
    });
  });
  
  // Reply buttons
  document.querySelectorAll('.comment-reply-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      showReplyForm(this.dataset.commentId);
    });
  });
  
  // Show replies buttons
  document.querySelectorAll('.show-replies-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      toggleReplies(this.dataset.commentId, this);
    });
  });
  
  // Delete buttons
  document.querySelectorAll('.delete-comment-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const commentId = this.closest('.comment').dataset.commentId;
      deleteComment(commentId);
    });
  });
}

function submitComment() {
  const commentInput = document.getElementById('comment-input');
  const text = commentInput.value.trim();
  
  if (!text) {
    showNotification('Please write something before posting', 'error');
    return;
  }
  // Try to post to backend; fall back to local-only comment
  const payload = { text };
  fetch(`/usr/blog/${blogData.id}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(res => res.json()).then(json => {
    if (json && json.success && json.comment) {
      const c = json.comment;
      c.replies = c.replies || [];
      c.likes = c.likes || 0;
      blogData.comments.unshift(c);
      commentInput.value = '';
      renderComments();
      showNotification('Comment posted successfully! 💬');
    } else {
      // fallback local
      const newComment = {
        id: `comment-${Date.now()}`,
        author: currentUser.name,
        text: text,
        date: new Date(),
        likes: 0,
        liked: false,
        replies: []
      };
      blogData.comments.unshift(newComment);
      commentInput.value = '';
      renderComments();
      showNotification('Comment posted locally (offline) 💬');
    }
  }).catch(() => {
    const newComment = {
      id: `comment-${Date.now()}`,
      author: currentUser.name,
      text: text,
      date: new Date(),
      likes: 0,
      liked: false,
      replies: []
    };
    blogData.comments.unshift(newComment);
    commentInput.value = '';
    renderComments();
    showNotification('Comment posted locally (offline) 💬');
  });
}

function submitReply(commentId, text) {
  const comment = findCommentById(commentId);
  if (!comment) return;
  // Post reply to backend and update structure, fallback to local
  const payload = { text, parent_id: commentId };
  fetch(`/usr/blog/${blogData.id}/comment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(res => res.json()).then(json => {
    if (json && json.success && json.comment) {
      const newReply = json.comment;
      if (!comment.replies) comment.replies = [];
      comment.replies.push(newReply);
      renderComments();
      showNotification('Reply posted! 💬');
    } else {
      const newReply = {
        id: `reply-${Date.now()}`,
        author: currentUser.name,
        text: text,
        date: new Date(),
        likes: 0,
        liked: false
      };
      if (!comment.replies) comment.replies = [];
      comment.replies.push(newReply);
      renderComments();
      showNotification('Reply posted locally (offline) 💬');
    }
  }).catch(() => {
    const newReply = {
      id: `reply-${Date.now()}`,
      author: currentUser.name,
      text: text,
      date: new Date(),
      likes: 0,
      liked: false
    };
    if (!comment.replies) comment.replies = [];
    comment.replies.push(newReply);
    renderComments();
    showNotification('Reply posted locally (offline) 💬');
  });
}

function likeComment(commentId, button) {
  const comment = findCommentById(commentId);
  if (!comment) return;
  
  comment.liked = !comment.liked;
  
  if (comment.liked) {
    comment.likes++;
    button.classList.add('liked');
  } else {
    comment.likes--;
    button.classList.remove('liked');
  }
  
  button.querySelector('span').textContent = comment.likes;
  
  // TODO: Send to backend
}

function deleteComment(commentId) {
  if (!confirm('Are you sure you want to delete this comment?')) {
    return;
  }
  
  // Remove recursively
  const removed = removeCommentById(commentId);
  if (removed) {
    renderComments();
    showNotification('Comment deleted');
  } else {
    showNotification('Comment not found', 'error');
  }
  
  // TODO: Send to backend
}

function showReplyForm(commentId) {
  const comment = document.querySelector(`[data-comment-id="${commentId}"]`);
  if (!comment) return;
  
  // Remove any existing reply forms
  document.querySelectorAll('.reply-form').forEach(form => form.remove());
  
  const replyForm = document.createElement('div');
  replyForm.className = 'reply-form';
  replyForm.innerHTML = `
    <textarea class="form-textarea" placeholder="Write your reply..." id="reply-input-${commentId}"></textarea>
    <div class="reply-form-actions">
      <button class="cancel-reply-btn">Cancel</button>
      <button class="submit-comment-btn" onclick="submitReplyFromForm('${commentId}')">
        <i class="fas fa-reply"></i> Post Reply
      </button>
    </div>
  `;
  
  comment.appendChild(replyForm);
  
  // Focus on textarea
  const textarea = replyForm.querySelector('textarea');
  textarea.focus();
  
  // Cancel button
  replyForm.querySelector('.cancel-reply-btn').addEventListener('click', function() {
    replyForm.remove();
  });
}

function submitReplyFromForm(commentId) {
  const textarea = document.getElementById(`reply-input-${commentId}`);
  const text = textarea.value.trim();
  
  if (!text) {
    showNotification('Please write something before posting', 'error');
    return;
  }
  
  submitReply(commentId, text);
  
  // Remove form
  document.querySelector('.reply-form')?.remove();
}

function toggleReplies(commentId, button) {
  const repliesContainer = document.getElementById(`replies-${commentId}`);
  if (!repliesContainer) return;
  
  const isHidden = repliesContainer.style.display === 'none';
  
  repliesContainer.style.display = isHidden ? 'block' : 'none';
  button.classList.toggle('expanded', isHidden);
}

function sortComments(sortType) {
  switch(sortType) {
    case 'newest':
      blogData.comments.sort((a, b) => b.date - a.date);
      break;
    case 'oldest':
      blogData.comments.sort((a, b) => a.date - b.date);
      break;
    case 'popular':
      blogData.comments.sort((a, b) => b.likes - a.likes);
      break;
  }
  
  renderComments();
}

// ===== UTILITY FUNCTIONS =====
function findCommentById(commentId, list = blogData.comments) {
  for (let comment of list) {
    if (String(comment.id) === String(commentId)) {
      return comment;
    }
    if (comment.replies && comment.replies.length) {
      const found = findCommentById(commentId, comment.replies);
      if (found) return found;
    }
  }
  return null;
}

function removeCommentById(commentId, list = blogData.comments) {
  for (let i = 0; i < list.length; i++) {
    const c = list[i];
    if (String(c.id) === String(commentId)) {
      list.splice(i, 1);
      return true;
    }
    if (c.replies && c.replies.length) {
      const removed = removeCommentById(commentId, c.replies);
      if (removed) return true;
    }
  }
  return false;
}

function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getTimeAgo(date) {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'Just now';
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function autoResizeTextarea(e) {
  e.target.style.height = 'auto';
  e.target.style.height = e.target.scrollHeight + 'px';
}

function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : '#f44336'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.3);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Make functions globally accessible for inline onclick handlers
window.shareOn = shareOn;
window.copyLink = copyLink;
window.closeShareModal = closeShareModal;
window.submitReplyFromForm = submitReplyFromForm;