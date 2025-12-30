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
  name: sessionStorage.getItem('username') || "Guest User",
  avatar: null // Trong thực tế lấy từ session/API
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
  initializeBlogDetail();
  
  // Parse Markdown cho bài viết chính
  renderMarkdownContent(); 

  setupEventListeners();
  loadBlogData();
  loadComments();
});

// ===== INITIALIZE =====
function initializeBlogDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  blogData.id = urlParams.get('id') || document.querySelector('[data-blog-id]')?.dataset.blogId;
}

// ===== MARKDOWN RENDERING (BLOG POST) =====
function renderMarkdownContent() {
  const contentDiv = document.querySelector('#content-html');
  if (contentDiv && typeof marked !== 'undefined') {
    marked.setOptions({ breaks: true, gfm: true });
    // Giả sử server trả về HTML đã escape hoặc raw markdown. 
    // Nếu là raw markdown, ta parse. Nếu HTML, ta giữ nguyên.
    // Ở đây ta giả định content trong div đang là raw markdown.
    const rawMarkdown = contentDiv.textContent.trim();
    if (rawMarkdown) {
        contentDiv.innerHTML = marked.parse(rawMarkdown);
    }
  }
}

// ===== TEXT FORMATTING HELPER (BOLD, ITALIC, LINK) =====
// Hàm này được gọi từ onclick trong HTML
window.formatText = function(textareaId, formatType) {
  const textarea = document.getElementById(textareaId);
  if (!textarea) return;

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  const fullText = textarea.value;
  
  let formattedText = '';
  let cursorOffset = 0;

  switch (formatType) {
    case 'bold':
      formattedText = `**${selectedText || 'bold text'}**`;
      cursorOffset = selectedText ? 0 : 2; // Nếu không bôi đen, đặt trỏ vào giữa
      break;
    case 'italic':
      formattedText = `*${selectedText || 'italic text'}*`;
      cursorOffset = selectedText ? 0 : 1;
      break;
    case 'link':
      formattedText = `[${selectedText || 'link text'}](url)`;
      cursorOffset = selectedText ? 0 : 3; // Focus vào chỗ url
      break;
  }

  // Chèn text đã format vào vị trí con trỏ
  textarea.value = fullText.substring(0, start) + formattedText + fullText.substring(end);
  
  // Trả lại focus cho textarea
  textarea.focus();
  
  // Đặt lại vị trí con trỏ (nếu cần thiết để user gõ tiếp)
  if (!selectedText) {
      // Nếu chèn mới, đưa trỏ vào giữa cú pháp
      const newCursorPos = start + formattedText.length - (formatType === 'link' ? 1 : cursorOffset); 
      textarea.setSelectionRange(newCursorPos, newCursorPos);
  } else {
      // Nếu bôi đen, đưa trỏ xuống cuối đoạn vừa format
      const newCursorPos = start + formattedText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
  }
  
  // Trigger sự kiện input để update height textarea
  textarea.dispatchEvent(new Event('input'));
};

// ===== EVENT LISTENERS =====
function setupEventListeners() {
  const likeBtn = document.getElementById('like-btn');
  if (likeBtn) likeBtn.addEventListener('click', handleLike);

  const bookmarkBtn = document.getElementById('bookmark-btn');
  if (bookmarkBtn) bookmarkBtn.addEventListener('click', handleBookmark);

  const shareBtn = document.getElementById('share-btn');
  if (shareBtn) shareBtn.addEventListener('click', openShareModal);

  const closeShareBtn = document.getElementById('close-share-btn');
  if (closeShareBtn) closeShareBtn.addEventListener('click', closeShareModal);

  window.addEventListener('click', (e) => {
    const modal = document.getElementById('share-modal');
    if (e.target === modal) closeShareModal();
  });

  // Submit main comment
  const submitCommentBtn = document.getElementById('submit-comment-btn');
  if (submitCommentBtn) submitCommentBtn.addEventListener('click', handlePostMainComment);

  setupCommentFormUI();
}

// ===== UI INTERACTION FOR COMMENT FORM =====
function setupCommentFormUI() {
  const commentInput = document.getElementById('comment-input');
  const formFooter = document.getElementById('form-footer');
  const cancelBtn = document.getElementById('cancel-comment-btn');
  const submitBtn = document.getElementById('submit-comment-btn');

  if (commentInput) {
    commentInput.addEventListener('focus', () => {
      formFooter.style.display = 'flex';
    });

    commentInput.addEventListener('input', function() {
      autoResizeTextarea(this);
      
      if (this.value.trim().length > 0) {
        submitBtn.removeAttribute('disabled');
      } else {
        submitBtn.setAttribute('disabled', 'true');
      }
    });

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        commentInput.value = '';
        commentInput.style.height = 'auto';
        formFooter.style.display = 'none';
      });
    }
  }
}

function autoResizeTextarea(el) {
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
}

// ===== DATA LOADING =====
function loadBlogData() {
  const likesCountElement = document.getElementById('like-count');
  if (likesCountElement) {
    blogData.likes = parseInt(likesCountElement.textContent) || 0;
  }
}

function loadComments() {
  // Mock Data
  const mockComments = [
    {
      id: 1,
      author: "Sarah Jenkins",
      avatar: null,
      date: new Date(Date.now() - 3600000 * 2), 
      text: "This is a **fantastic** article! The examples were *particularly* helpful.",
      likes: 5,
      liked: false,
      replies: [
        {
          id: 11,
          author: "Mike Ross",
          date: new Date(Date.now() - 3600000),
          text: "Totally agree with you Sarah! [Google](https://google.com)",
          likes: 1,
          liked: false
        }
      ]
    },
    {
      id: 2,
      author: "David Chen",
      avatar: null,
      date: new Date(Date.now() - 86400000), 
      text: "Could you elaborate more on the third point?",
      likes: 2,
      liked: true,
      replies: []
    }
  ];

  blogData.comments = mockComments;
  renderComments();
}

// ===== RENDER COMMENTS =====
function renderComments() {
  const commentsList = document.getElementById('comments-list');
  const commentsCount = document.querySelector('.comments-count');
  
  if (!commentsList) return;

  // Tính tổng comment + reply
  let totalComments = blogData.comments.length;
  blogData.comments.forEach(c => totalComments += (c.replies ? c.replies.length : 0));
  
  if (commentsCount) commentsCount.textContent = `(${totalComments})`;

  if (blogData.comments.length === 0) {
    commentsList.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--color-gray);">
        <i class="fas fa-comments" style="font-size: 3rem; margin-bottom: 1rem; opacity: 0.3;"></i>
        <p>No comments yet. Be the first to share your thoughts!</p>
      </div>
    `;
    return;
  }

  commentsList.innerHTML = blogData.comments.map(comment => createCommentHTML(comment)).join('');
  
  // Re-attach listeners sau khi render lại HTML
  addCommentEventListeners();
}

function createCommentHTML(comment, isReply = false) {
  const timeAgo = getTimeAgo(comment.date);
  const initials = getInitials(comment.author);
  const avatarColor = stringToColor(comment.author);
  
  // Parse nội dung comment từ Markdown sang HTML
  let processedContent = escapeHtml(comment.text); // Mặc định escape để an toàn
  if (typeof marked !== 'undefined') {
      // Parse markdown. Lưu ý: marked không tự escape XSS, nên cẩn thận.
      // Ở đây ta tin tưởng nội dung hoặc dùng DOMPurify (nếu có).
      // Để đơn giản cho demo: parse trực tiếp
      processedContent = marked.parse(comment.text); 
  }

  let repliesHTML = '';
  if (comment.replies && comment.replies.length > 0) {
    repliesHTML = `
      <div class="replies-container">
        ${comment.replies.map(reply => createCommentHTML(reply, true)).join('')}
      </div>
    `;
  }

  // Nút Reply chỉ hiện ở Comment gốc (Level 1), không hiện ở Reply (Level 2) để tránh nested quá sâu (tùy chọn)
  // Nhưng code dưới vẫn cho phép reply ở mọi cấp, chỉ là UI sẽ phẳng hóa.
  const replyButtonHTML = `
      <button class="action-link reply-comment-btn" data-id="${comment.id}" data-author="${comment.author}">
        <i class="far fa-comment-alt"></i> Reply
      </button>
  `;

  return `
    <div class="comment-node" data-comment-id="${comment.id}">
      <div class="comment-avatar">
        ${comment.avatar ? 
          `<img src="${comment.avatar}" alt="${comment.author}">` : 
          `<div class="avatar-placeholder" style="background-color: ${avatarColor}; color: white;">
            ${initials}
          </div>`
        }
      </div>
      <div class="comment-main">
        <div class="comment-meta">
          <span class="comment-author-name">${comment.author}</span>
          <span class="comment-time">${timeAgo}</span>
        </div>
        
        <div class="comment-content">
          ${processedContent}
        </div>
        
        <div class="comment-actions">
          <button class="action-link ${comment.liked ? 'active' : ''} like-comment-btn" data-id="${comment.id}">
            <i class="${comment.liked ? 'fas' : 'far'} fa-heart"></i>
            <span>${comment.likes || 0}</span>
          </button>
          ${!isReply ? replyButtonHTML : ''} </div>

        <div class="reply-input-container" id="reply-form-container-${comment.id}"></div>

        ${repliesHTML}
      </div>
    </div>
  `;
}

// ===== INTERACTIVE LISTENERS (LIKE, REPLY) =====
function addCommentEventListeners() {
  // Like Comment Logic
  document.querySelectorAll('.like-comment-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const icon = this.querySelector('i');
      const countSpan = this.querySelector('span');
      let count = parseInt(countSpan.textContent);
      
      this.classList.toggle('active');
      if (this.classList.contains('active')) {
        icon.classList.remove('far');
        icon.classList.add('fas');
        count++;
      } else {
        icon.classList.remove('fas');
        icon.classList.add('far');
        count--;
      }
      countSpan.textContent = count;
      // TODO: Update state in blogData if needed
    });
  });

  // Reply Comment Logic - OPEN FORM
  document.querySelectorAll('.reply-comment-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const commentId = this.dataset.id;
      const authorName = this.dataset.author;
      const container = document.getElementById(`reply-form-container-${commentId}`);
      
      // Nếu đã mở rồi thì thôi, hoặc toggle. Ở đây ta check nếu trống thì render.
      if (!container.innerHTML) {
        renderReplyForm(container, commentId, authorName);
      } else {
          // Toggle close
          container.innerHTML = '';
      }
    });
  });
}

// ===== RENDER DYNAMIC REPLY FORM =====
function renderReplyForm(container, parentId, parentAuthor) {
    // Unique ID cho textarea để hàm formatText hoạt động đúng
    const replyTextareaId = `reply-textarea-${parentId}`;

    container.innerHTML = `
      <div class="comment-form" style="margin-top: 1rem; animation: fadeIn 0.3s ease;">
        <div class="form-avatar" style="width: 32px; height: 32px; font-size: 0.9rem;">
          ${getInitials(currentUser.name)}
        </div>
        <div class="form-content">
          <textarea 
            id="${replyTextareaId}" 
            class="form-textarea" 
            placeholder="Reply to ${parentAuthor}..." 
            rows="1" 
            style="min-height: 40px; font-size: 0.95rem;"></textarea>
          
          <div class="form-footer" style="display: flex; margin-top: 0.5rem; justify-content: space-between;">
             <div class="form-tools">
                  <button type="button" class="tool-btn" onclick="formatText('${replyTextareaId}', 'bold')"><i class="fas fa-bold"></i></button>
                  <button type="button" class="tool-btn" onclick="formatText('${replyTextareaId}', 'italic')"><i class="fas fa-italic"></i></button>
                  <button type="button" class="tool-btn" onclick="formatText('${replyTextareaId}', 'link')"><i class="fas fa-link"></i></button>
             </div>
             <div class="form-submit-actions">
                <button class="cancel-btn" onclick="document.getElementById('reply-form-container-${parentId}').innerHTML = ''" style="padding: 0.25rem 0.75rem; font-size: 0.85rem;">Cancel</button>
                <button class="submit-comment-btn" onclick="handleSubmitReply(${parentId}, '${replyTextareaId}')" style="padding: 0.25rem 1rem; font-size: 0.85rem;">Reply</button>
             </div>
          </div>
        </div>
      </div>
    `;

    const textarea = document.getElementById(replyTextareaId);
    textarea.focus();
    
    // Auto resize logic
    textarea.addEventListener('input', function() {
        autoResizeTextarea(this);
    });
}

// ===== SUBMIT HANDLERS =====

// 1. Submit Main Comment
function handlePostMainComment() {
  const input = document.getElementById('comment-input');
  const text = input.value.trim();
  
  if (!text) return;
  
  const newComment = {
    id: Date.now(),
    author: currentUser.name,
    avatar: currentUser.avatar,
    date: new Date(),
    text: text,
    likes: 0,
    liked: false,
    replies: []
  };
  
  blogData.comments.unshift(newComment); // Thêm vào đầu list
  
  renderComments(); // Re-render toàn bộ list
  
  // Reset form
  input.value = '';
  input.style.height = 'auto';
  document.getElementById('form-footer').style.display = 'none';
  showNotification('Comment posted successfully!');
}

// 2. Submit Reply
window.handleSubmitReply = function(parentId, textareaId) {
    const input = document.getElementById(textareaId);
    const text = input.value.trim();

    if (!text) return;

    // Tìm comment cha trong mảng
    const parentComment = blogData.comments.find(c => c.id == parentId);
    
    if (parentComment) {
        const newReply = {
            id: Date.now(),
            author: currentUser.name,
            avatar: currentUser.avatar,
            date: new Date(),
            text: text,
            likes: 0,
            liked: false
        };

        // Khởi tạo mảng replies nếu chưa có
        if (!parentComment.replies) parentComment.replies = [];
        
        parentComment.replies.push(newReply);
        
        // Re-render
        renderComments();
        showNotification('Reply posted!');
    } else {
        showNotification('Error: Parent comment not found', 'error');
    }
};

// ===== ACTIONS (Like Main Post, Share) =====
function handleLike() {
  const btn = document.getElementById('like-btn');
  const icon = btn.querySelector('i');
  const countSpan = document.getElementById('like-count'); // Fix ID
  
  blogData.liked = !blogData.liked;
  
  if (blogData.liked) {
    btn.classList.add('liked');
    icon.classList.remove('far');
    icon.classList.add('fas');
    blogData.likes++;
    showNotification('You liked this post!');
  } else {
    btn.classList.remove('liked');
    icon.classList.remove('fas');
    icon.classList.add('far');
    blogData.likes--;
  }
  
  if (countSpan) countSpan.textContent = blogData.likes;
}

function handleBookmark() {
  const btn = document.getElementById('bookmark-btn');
  const icon = btn.querySelector('i');
  
  blogData.bookmarked = !blogData.bookmarked;
  
  if (blogData.bookmarked) {
    btn.classList.add('bookmarked');
    icon.classList.remove('far');
    icon.classList.add('fas');
    showNotification('Added to bookmarks');
  } else {
    btn.classList.remove('bookmarked');
    icon.classList.remove('fas');
    icon.classList.add('far');
    showNotification('Removed from bookmarks');
  }
}

function openShareModal() {
  document.getElementById('share-modal').classList.add('active');
  const urlInput = document.getElementById('share-url-input');
  if (urlInput) urlInput.value = window.location.href;
}

function closeShareModal() {
  document.getElementById('share-modal').classList.remove('active');
}

window.copyShareLink = function() {
    const copyText = document.getElementById("share-url-input");
    copyText.select();
    navigator.clipboard.writeText(copyText.value);
    showNotification("Link copied to clipboard!");
}

// ===== HELPER FUNCTIONS =====

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
    font-family: 'Poppins', sans-serif;
    font-size: 0.95rem;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease forwards';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function getInitials(name) {
  return name ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'G';
}

function stringToColor(str) {
  let hash = 0;
  if (!str) return '#6c757d';
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

function getTimeAgo(date) {
  if (typeof date === 'string') date = new Date(date);
  const seconds = Math.floor((new Date() - date) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
}

function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Add animation keyframes dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(400px); opacity: 0; } }
`;
document.head.appendChild(style);