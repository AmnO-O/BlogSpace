document.addEventListener('DOMContentLoaded', function() {
    // 1. Khai báo dữ liệu mẫu
    const mockUserData = {
        posts: [
            { id: 101, title: "How to Build a Blog with Python", excerpt: "Learn step-by-step how to create a beautiful blog using Flask and SQLite...", date: "2 days ago", views: "125", likes: "45" },
            { id: 102, title: "CSS Tips & Tricks for Beginners", excerpt: "Master the fundamentals of CSS with these practical examples...", date: "1 week ago", views: "320", likes: "112" },
            { id: 103, title: "Deploying Flask Apps to Heroku", excerpt: "A complete guide to making your web app live for the world to see...", date: "2 weeks ago", views: "450", likes: "89" }
        ],
        drafts: [
            { id: 201, title: "JavaScript Advanced Concepts", excerpt: "Exploring closures, async/await, and more...", date: "Last edited 3 hours ago" }
        ],
        stats: [
            { label: "Total Posts", value: "0", icon: "fa-pen-fancy" },
            { label: "Total Likes", value: "0", icon: "fa-heart" },
            { label: "Total Views", value: "0", icon: "fa-eye" },
            { label: "Comments", value: "0", icon: "fa-comment" }
        ]
    };

    // 2. Hàm Render Stats (Các ô vuông chỉ số)
    function renderStats() {
        const container = document.getElementById('stats-container');
        if (!container) return;
        container.innerHTML = mockUserData.stats.map(s => `
            <div class="stat-card">
                <i class="fas ${s.icon}"></i>
                <h4>${s.label}</h4>
                <p class="big-number">${s.value}</p>
            </div>
        `).join('');
    }

    // 3. Hàm Render Posts (Bài viết đã đăng)
    async function renderMyPosts() {
        const container = document.getElementById('my-posts-container');
        if (!container) return;
        
        try{
            const response = await fetch('/usr/blog/personal');
            const result = await response.json();
            if(result.success){
                container.innerHTML = result.blogs.map(post => `
                    <div class="post-item">
                        <div class="post-info">
                            <h3>${post.title}</h3>
                            <p class="post-excerpt">${post.excerpt}</p>
                            <div class="post-meta">
                                <span><i class="fas fa-calendar"></i> ${post.date}</span>
                                <span><i class="fas fa-eye"></i> ${post.views} views</span>
                                <span><i class="fas fa-heart"></i> ${post.likes} likes</span>
                            </div>
                        </div>
                        <div class="post-actions">
                            <a href="/post/${post.id}" class="btn-icon" title="View"><i class="fas fa-eye"></i></a>
                            <a href="/edit/${post.id}" class="btn-icon" title="Edit"><i class="fas fa-edit"></i></a>
                            <button class="btn-icon btn-danger" onclick="deletePost(${post.id})" title="Delete"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                `).join('');
            }
        }catch(error){


        }
    }

    // 4. Hàm Render Drafts (Bản nháp)
    function renderDrafts() {
        const container = document.getElementById('drafts-container');
        if (!container) return;
        container.innerHTML = mockUserData.drafts.map(draft => `
            <div class="post-item">
                <div class="post-info">
                    <h3>${draft.title}</h3>
                    <p class="post-excerpt">${draft.excerpt}</p>
                    <div class="post-meta">
                        <span><i class="fas fa-calendar"></i> ${draft.date}</span>
                        <span class="badge-draft">DRAFT</span>
                    </div>
                </div>
                <div class="post-actions">
                    <a href="/edit/${draft.id}" class="btn-icon" title="Edit"><i class="fas fa-edit"></i></a>
                    <a href="#" class="btn-icon" title="Publish"><i class="fas fa-paper-plane"></i></a>
                    <button class="btn-icon btn-danger" onclick="deletePost(${draft.id})" title="Delete"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `).join('');
    }

    // 5. Logic chuyển đổi Tab (Giữ nguyên từ code cũ của bạn)
    function setupNavigation() {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                document.querySelectorAll('.dashboard-main section').forEach(s => s.classList.remove('active-section'));
                
                this.classList.add('active');
                const sectionId = this.getAttribute('href');
                const targetSection = document.querySelector(sectionId);
                if (targetSection) targetSection.classList.add('active-section');
            });
        });
    }

    // Khởi tạo tất cả
    renderStats();
    renderMyPosts();
    renderDrafts();
    setupNavigation();
});

// Hàm giả lập xóa bài viết
function deletePost(id) {
    if(confirm('Are you sure you want to delete this post?')) {
        alert('Deleted post ID: ' + id);
        // Sau này sẽ gọi API xóa ở đây
    }
}