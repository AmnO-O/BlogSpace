/**
 * READZONE MODULE
 * Quản lý logic cho trang hiển thị bài viết (Read Zone)
 */

// ==========================================
// 1. CONFIG & STATE
// ==========================================
const CONSTANTS = {
    POSTS_PER_PAGE: 6,
    DEFAULT_SORT: 'newest'
};

const state = {
    currentPage: 1,
    allPosts: [],      // Dữ liệu gốc từ Server
    filteredPosts: [], // Dữ liệu sau khi lọc/sort
    selectedCategories: ['all'],
    currentSort: CONSTANTS.DEFAULT_SORT,
    displayedPostsCount: 0
};

// ==========================================
// 2. DOM ELEMENTS
// ==========================================
const DOM = {
    container: document.getElementById('posts-container'),
    noResults: document.getElementById('no-results'),
    
    // Filters & Controls
    searchInput: document.getElementById('search-input'),
    categoryFilters: document.querySelectorAll('.category-filter'),
    categoryAllRadio: document.querySelector('input[value="all"]'),
    sortBtns: document.querySelectorAll('.sort-btn'),
    resetFiltersBtn: document.getElementById('reset-filters'),
    
    // Pagination & Stats
    loadMoreBtn: document.getElementById('load-more-btn'),
    loadMoreContainer: document.getElementById('load-more-container'),
    showingCount: document.getElementById('showing-count'),
    totalPostsEl: document.getElementById('total-posts'),
    postsReadingEl: document.getElementById('posts-reading'),

    // Modal
    modal: {
        self: document.getElementById('post-modal'),
        overlay: document.getElementById('modal-overlay'),
        closeBtn: document.getElementById('modal-close'),
        title: document.getElementById('modal-title'),
        content: document.getElementById('modal-content'),
        author: document.getElementById('modal-author-name'),
        date: document.getElementById('modal-date'),
        category: document.getElementById('modal-category'),
        image: document.getElementById('modal-featured-image'),
        likeBtn: document.getElementById('modal-like-btn'),
        bookmarkBtn: document.getElementById('modal-bookmark-btn'),
        shareBtn: document.getElementById('modal-share-btn'),
        likesCount: document.getElementById('modal-likes'),
        tags: document.getElementById('modal-tags'),
        commentInput: document.getElementById('comment-input'),
        submitCommentBtn: document.getElementById('submit-comment-btn'),
        commentsList: document.getElementById('comments-list'),
        blog_id : -1
    }
};

const Utils = {
    formatContent: (text) => {
        if (!text) return '';
        return text
            .replace(/^# (.*?)$/gm, '<h1>$1</h1>')
            .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
            .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/`(.*?)`/g, '<code>$1</code>')
            .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
            .replace(/\n/g, '<br>');
    },

    // Hàm xử lý đường dẫn ảnh từ Flask trả về
    getImagePath: (path) => {
        if (!path) return 'https://via.placeholder.com/800x400?text=No+Image';
        return path.startsWith('http') ? path : `/static/${path}`;
    }
};


const AppLogic = {
    sortPosts: (posts) => {
        const sorted = [...posts];
        if (state.currentSort === 'newest') {
            sorted.sort((a, b) => new Date(b.dateISO) - new Date(a.dateISO));
        } else if (state.currentSort === 'trending') {
            sorted.sort((a, b) => (b.likes + b.views) - (a.likes + a.views));
        } else if (state.currentSort === 'popular') {
            sorted.sort((a, b) => b.views - a.views);
        }
        return sorted;
    },

    filterPosts: () => {
        let filtered = [...state.allPosts];

        if (!state.selectedCategories.includes('all')) {
            filtered = filtered.filter(post => state.selectedCategories.includes(post.category));
        }

        const searchTerm = DOM.searchInput.value.toLowerCase();
        if (searchTerm) {
            filtered = filtered.filter(post =>
                (post.title && post.title.toLowerCase().includes(searchTerm)) ||
                (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm)) ||
                (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }

        state.filteredPosts = AppLogic.sortPosts(filtered);
        state.currentPage = 1;
        
        UI.renderPosts();
    }
};

// ==========================================
// 5. UI RENDERING
// ==========================================
const UI = {
    updateStats: () => {
        DOM.totalPostsEl.textContent = state.allPosts.length;
        DOM.postsReadingEl.textContent = state.displayedPostsCount;
        DOM.showingCount.textContent = state.displayedPostsCount;
    },

    createPostElement: (post) => {
        const postEl = document.createElement('div');
        postEl.className = 'post-card';

        const categoryIcon = {
            technology: 'fas fa-laptop',
            lifestyle: 'fas fa-heart',
            business: 'fas fa-briefcase',
            travel: 'fas fa-globe',
            education: 'fas fa-graduation-cap',
        }[post.category] || 'fas fa-file-alt';


        const imageUrl = Utils.getImagePath(post.featured_image);

        postEl.innerHTML = `
        <div class="post-featured">
            <img src="${imageUrl}" alt="${post.title}" class="post-image">
            <span class="post-category-badge">
                <i class="${categoryIcon}"></i> ${post.category || 'General'}
            </span>
        </div>
        <div class="post-body">
            <h2 class="post-title">${post.title}</h2>
            <p class="post-excerpt">${post.excerpt || ''}</p>
            
            <div class="post-meta">
                <span class="meta-item"><i class="fas fa-user"></i> ${post.author}</span>
                <span class="meta-item"><i class="fas fa-calendar"></i> ${post.date}</span>
                <span class="meta-item"><i class="fas fa-eye"></i> ${post.views} views</span>
            </div>

            <div class="post-actions">
                <button class="action-btn read-more-btn">
                    <i class="fas fa-arrow-right"></i> Read More
                </button>
                <div class="action-stats">
                    <span class="stat"><i class="fas fa-heart"></i> ${post.likes}</span>
                    <span class="stat"><i class="fas fa-comment"></i> ${post.comments}</span>
                </div>
            </div>
        </div>
        `;

        // Gắn sự kiện click trực tiếp vào phần tử DOM - mở trang chi tiết
        postEl.querySelector('.read-more-btn').addEventListener('click', () => {
            window.location.href = `/usr/blog/${post.id}`;
        });

        return postEl;
    },

    renderPosts: () => {
        const startIdx = (state.currentPage - 1) * CONSTANTS.POSTS_PER_PAGE;
        const endIdx = startIdx + CONSTANTS.POSTS_PER_PAGE;
        const postsToDisplay = state.filteredPosts.slice(startIdx, endIdx);
        
        state.displayedPostsCount = Math.min(endIdx, state.filteredPosts.length);

        // Clear nếu trang 1
        if (state.currentPage === 1) {
            DOM.container.innerHTML = '';
        }

        // Xử lý hiển thị
        if (postsToDisplay.length === 0 && state.currentPage === 1) {
            DOM.noResults.style.display = 'flex';
            DOM.loadMoreContainer.style.display = 'none';
        } else {
            DOM.noResults.style.display = 'none';
            postsToDisplay.forEach(post => {
                DOM.container.appendChild(UI.createPostElement(post));
            });

            // Nút Load More
            DOM.loadMoreContainer.style.display = 
                (state.displayedPostsCount < state.filteredPosts.length) ? 'flex' : 'none';
        }

        UI.updateStats();
    }
};

// ==========================================
// 6. MODAL HANDLING
// ==========================================
const Modal = {
    open: (post) => {
        const m = DOM.modal;
        
        m.blog_id = post.id;
        m.title.textContent = post.title;
        m.content.innerHTML = Utils.formatContent(post.content);
        m.author.textContent = post.author;
        m.date.textContent = post.date;
        m.category.textContent = post.category;
        
        // Xử lý ảnh trong modal
        m.image.src = Utils.getImagePath(post.featured_image);
        
        m.likesCount.textContent = post.likes;

        if (post.tags && Array.isArray(post.tags)) {
            m.tags.innerHTML = post.tags.map(tag => 
                `<span class="tag"><i class="fas fa-tag"></i> ${tag.trim()}</span>`
            ).join('');
        } else {
            m.tags.innerHTML = '';
        }

        // Reset Inputs
        m.commentInput.value = '';
        m.likeBtn.classList.remove('liked');
        m.bookmarkBtn.classList.remove('bookmarked');
        m.commentsList.innerHTML = ''; 

        m.self.classList.add('active');
        document.body.style.overflow = 'hidden';
    },

    close: () => {
        DOM.modal.self.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
};

// ==========================================
// 7. API HANDLER
// ==========================================
const API = {
    fetchAllPosts: async () => {
        try {
            // Dùng GET (Mặc định)
            const response = await fetch('/database/get_all_blogs');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Cập nhật State và Render
            state.allPosts = data;
            AppLogic.filterPosts();
            
            // console.log(`Loaded ${data.length} posts successfully.`);

        } catch (error) {
            console.error('Failed to fetch posts:', error);
            DOM.container.innerHTML = `
                <div style="text-align:center; width:100%; color:red; padding: 2rem;">
                    <h3><i class="fas fa-exclamation-triangle"></i> Failed to load posts</h3>
                    <p>Please check your connection or server status.</p>
                </div>`;
        }
    }
};

// ==========================================
// 8. EVENT BINDING
// ==========================================
function bindEventListeners() {
    // Search
    DOM.searchInput.addEventListener('input', AppLogic.filterPosts);

    // Category Filters
    DOM.categoryFilters.forEach(filter => {
        filter.addEventListener('change', function () {
            if (this.value === 'all') {
                if (this.checked) {
                    DOM.categoryFilters.forEach(f => f.checked = f.value === 'all');
                    state.selectedCategories = ['all'];
                } else {
                    this.checked = true; 
                }
            } else {
                if(DOM.categoryAllRadio) DOM.categoryAllRadio.checked = false;
                
                state.selectedCategories = Array.from(document.querySelectorAll('.category-filter:checked'))
                    .map(f => f.value)
                    .filter(v => v !== 'all');

                if (state.selectedCategories.length === 0) {
                    state.selectedCategories = ['all'];
                    if(DOM.categoryAllRadio) DOM.categoryAllRadio.checked = true;
                }
            }
            AppLogic.filterPosts();
        });
    });

    // Sort Buttons
    DOM.sortBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            DOM.sortBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            state.currentSort = this.dataset.sort;
            AppLogic.filterPosts();
        });
    });

    // Load More
    DOM.loadMoreBtn.addEventListener('click', () => {
        state.currentPage++;
        UI.renderPosts();
        DOM.loadMoreBtn.scrollIntoView({ behavior: 'smooth' });
    });

    // Reset Filters
    DOM.resetFiltersBtn.addEventListener('click', () => {
        DOM.searchInput.value = '';
        DOM.categoryFilters.forEach(f => f.checked = f.value === 'all');
        state.selectedCategories = ['all'];
        state.currentSort = 'newest';
        
        DOM.sortBtns.forEach(b => b.classList.remove('active'));
        document.querySelector('[data-sort="newest"]').classList.add('active');
        
        AppLogic.filterPosts();
    });

    // Modal Actions
    DOM.modal.closeBtn.addEventListener('click', Modal.close);
    DOM.modal.overlay.addEventListener('click', Modal.close);
    
    DOM.modal.likeBtn.addEventListener('click', function () {
        this.classList.toggle('liked');
        const currentLikes = parseInt(DOM.modal.likesCount.textContent);
        DOM.modal.likesCount.textContent = this.classList.contains('liked') ? currentLikes + 1 : currentLikes - 1;
    });

    DOM.modal.bookmarkBtn.addEventListener('click', function () {
        this.classList.toggle('bookmarked');
    });

    DOM.modal.shareBtn.addEventListener('click', function(){
        const blog_detail_url = `/usr/blog/${DOM.modal.blog_id}`;
        window.open(blog_detail_url, '_blank');
    });

    // (Optional) Submit Comment Dummy Logic
    DOM.modal.submitCommentBtn.addEventListener('click', () => {
        const text = DOM.modal.commentInput.value.trim();
        if (text) {
            const newComment = document.createElement('div');
            newComment.className = 'comment';
            newComment.innerHTML = `
                <div class="comment-header"><strong>You</strong><span class="comment-date">just now</span></div>
                <p>${text}</p>
            `;
            DOM.modal.commentsList.prepend(newComment); 
            DOM.modal.commentInput.value = '';
        }
    });
}

// ==========================================
// 9. MAIN ENTRY POINT
// ==========================================
async function main() {
    // console.log('ReadZone Initializing...');

    bindEventListeners();
    await API.fetchAllPosts();
    // console.log('ReadZone Ready.');
}

// Chạy hàm main khi DOM đã tải xong
document.addEventListener('DOMContentLoaded', main);