/**
 * WRITEZONE MODULE
 * Quản lý logic cho trang viết bài (Write Zone)
 */

// ==========================================
// 1. CONFIG & CONSTANTS
// ==========================================
const CONFIG = {
    STORAGE_KEY: 'blogpost_draft',
    STORAGE_TIMESTAMP: 'blogpost_draft_time',
    AUTOSAVE_INTERVAL: 30000, // 30s
    MAX_IMAGE_SIZE: 10 * 1024 * 1024 // 10MB
};

// ==========================================
// 2. DOM ELEMENTS
// ==========================================
const DOM = {
    form: document.getElementById('blog-form'),
    inputs: {
        title: document.getElementById('blog-title'),
        content: document.getElementById('blog-content'),
        seo: document.getElementById('seo-description'),
        tags: document.getElementById('tags'),
        category: document.getElementById('category'),
        featuredImage: document.getElementById('featured-image'),
        publishDate: document.getElementById('publish-date')
    },
    previews: {
        image: document.getElementById('image-preview'),
        panel: document.getElementById('preview-panel'),
        content: document.getElementById('preview-content')
    },
    stats: {
        word: document.getElementById('word-count'),
        char: document.getElementById('char-count'),
        readTime: document.getElementById('read-time'),
        title: document.getElementById('title-count'),
        seo: document.getElementById('seo-count')
    },
    buttons: {
        saveDraft: document.getElementById('save-draft-btn'),
        publish: document.getElementById('publish-btn'),
        preview: document.getElementById('preview-btn'),
        closePreview: document.getElementById('close-preview'),
        saveDraftAction: document.getElementById('save-draft-action'),
        toolbar: document.querySelectorAll('.toolbar-btn')
    },
    radios: {
        publishNow: document.getElementById('publish-now'),
        schedule: document.getElementById('schedule-publish'),
        saveDraft: document.getElementById('save-draft-option')
    },
    status: {
        text: document.getElementById('status-text'),
        lastSaved: document.getElementById('last-saved')
    }
};

// ==========================================
// 3. UTILITY FUNCTIONS
// ==========================================
const Utils = {
    getCurrentTimeFormatted: () => {
        const now = new Date();
        return now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    },

    escapeHtml: (unsafe) => {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    },

    markdownToHtml: (markdown) => {
        if (!markdown) return '';

        const blocks = markdown.split(/\n\s*\n/);

        const htmlBlocks = blocks.map(block => {
            let content = block.trim();
            if (!content) return '';

            content = content
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>')
                .replace(/`(.*?)`/g, '<code style="background:#f4f4f4; padding: 2px 4px; border-radius: 4px;">$1</code>')
                .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width:100%; height:auto; border-radius:8px; margin: 10px 0;">') // Image
                .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color: #007bff;">$1</a>'); // Link

            if (/^#{1,6}\s/.test(content)) {
                return content.replace(/^# (.*$)/gm, '<h1>$1</h1>')
                              .replace(/^## (.*$)/gm, '<h2>$1</h2>')
                              .replace(/^### (.*$)/gm, '<h3>$1</h3>')
                              .replace(/^#### (.*$)/gm, '<h4>$1</h4>');
            }

            // Blockquote
            if (/^>/.test(content)) {
                return `<blockquote>${content.replace(/^>\s?/, '')}</blockquote>`;
            }

            // Unordered List (- item)
            if (/^-\s/.test(content)) {
                const listItems = content.split('\n').map(line => {
                    return line.replace(/^-\s+(.*)$/, '<li>$1</li>');
                }).join('');
                return `<ul style="padding-left: 20px;">${listItems}</ul>`;
            }

            // Numbered List (1. item)
            if (/^\d+\.\s/.test(content)) {
                const listItems = content.split('\n').map(line => {
                    return line.replace(/^\d+\.\s+(.*)$/, '<li>$1</li>');
                }).join('');
                return `<ol style="padding-left: 20px;">${listItems}</ol>`;
            }

            return `<p>${content.replace(/\n/g, '<br>')}</p>`;
        });

        return htmlBlocks.join('');
    }
};

// ==========================================
// 4. CORE LOGIC
// ==========================================
const AppLogic = {
    calculateStats: () => {
        const text = DOM.inputs.content.value;
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        const chars = text.length;
        const readTime = Math.ceil(words / 200);

        DOM.stats.word.textContent = words;
        DOM.stats.char.textContent = chars;
        DOM.stats.readTime = readTime + ' min';
    },

    updateInputCounts: () => {
        DOM.stats.title.textContent = DOM.inputs.title.value.length;
        DOM.stats.seo.textContent = DOM.inputs.seo.value.length;
    },

    saveDraft: () => {
        const draftData = {
            title: DOM.inputs.title.value,
            content: DOM.inputs.content.value,
            seo: DOM.inputs.seo.value,
            tags: DOM.inputs.tags.value,
            category: DOM.inputs.category.value,
            timestamp: new Date().toISOString(),
        };

        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(draftData));
        localStorage.setItem(CONFIG.STORAGE_TIMESTAMP, Utils.getCurrentTimeFormatted());

        AppLogic.showStatus('✓ Draft saved automatically', '#27ae60');
        DOM.status.lastSaved.textContent = 'Saved at ' + Utils.getCurrentTimeFormatted();
    },

    loadDraft: () => {
        const savedDraft = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (!savedDraft) return;

        try {
            const draftData = JSON.parse(savedDraft);
            DOM.inputs.title.value = draftData.title || '';
            DOM.inputs.content.value = draftData.content || '';
            DOM.inputs.seo.value = draftData.seo || '';
            DOM.inputs.tags.value = draftData.tags || '';
            DOM.inputs.category.value = draftData.category || '';

            // Update UI after loading
            AppLogic.updateInputCounts();
            AppLogic.calculateStats();

            const savedTime = localStorage.getItem(CONFIG.STORAGE_TIMESTAMP);
            if (savedTime) {
                DOM.status.lastSaved.textContent = 'Last saved at ' + savedTime;
            }
        } catch (e) {
            console.error('Failed to load draft:', e);
        }
    },

    showStatus: (msg, color = 'inherit', duration = 3000) => {
        DOM.status.text.textContent = msg;
        DOM.status.text.style.color = color;
        
        if (duration) {
            setTimeout(() => {
                DOM.status.text.textContent = 'Ready to write...';
                DOM.status.text.style.color = 'inherit';
            }, duration);
        }
    },

    applyFormat: (format) => {
        const textarea = DOM.inputs.content;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const selectedText = textarea.value.substring(start, end);
        const beforeText = textarea.value.substring(0, start);
        const afterText = textarea.value.substring(end);

        let newText = '';
        let wrap = { start: '', end: '', default: '' };

        switch (format) {
            case 'bold': wrap = { start: '**', end: '**', default: 'bold text' }; break;
            case 'italic': wrap = { start: '*', end: '*', default: 'italic text' }; break;
            case 'code': wrap = { start: '`', end: '`', default: 'code' }; break;
            case 'heading': newText = beforeText + '\n# ' + (selectedText || 'Heading') + '\n' + afterText; break;
            case 'link': newText = beforeText + '[' + (selectedText || 'link text') + '](https://example.com)' + afterText; break;
            case 'quote': newText = beforeText + '\n> ' + (selectedText || 'quoted text') + '\n' + afterText; break;
            case 'bullet': newText = beforeText + '\n- ' + (selectedText || 'item') + '\n' + afterText; break;
            case 'numbered': newText = beforeText + '\n1. ' + (selectedText || 'item') + '\n' + afterText; break;
        }

        if (wrap.start) {
            newText = beforeText + wrap.start + (selectedText || wrap.default) + wrap.end + afterText;
        }

        if (newText) {
            textarea.value = newText;
            AppLogic.calculateStats();
            AppLogic.saveDraft();
            
            // Restore cursor
            const newCursorPos = start + newText.length - (beforeText.length + afterText.length);
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        }
    }
};

const Handlers = {
    handleImageUpload: function(e) {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > CONFIG.MAX_IMAGE_SIZE) {
            alert('Image size must be less than 10MB');
            this.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = document.createElement('img');
            img.src = event.target.result;
            DOM.previews.image.innerHTML = '';
            DOM.previews.image.appendChild(img);
            DOM.previews.image.classList.add('active');
        };
        reader.readAsDataURL(file);
    },

    handleFormSubmit: function(e) {
        // Lưu ý: Nếu muốn form submit bình thường về Flask, bỏ e.preventDefault()
        // Tuy nhiên, vì code cũ của bạn có validation bằng JS, ta giữ lại:
        
        // 1. Validation
        if (!DOM.inputs.title.value.trim()) {
            e.preventDefault();
            alert('Please enter a blog title');
            DOM.inputs.title.focus();
            return;
        }
        if (!DOM.inputs.content.value.trim()) {
            e.preventDefault();
            alert('Please write some content');
            DOM.inputs.content.focus();
            return;
        }
        if (!DOM.inputs.category.value) {
            e.preventDefault();
            alert('Please select a category');
            DOM.inputs.category.focus();
            return;
        }

        // 2. Logic Schedule
        if (DOM.radios.schedule.checked && !DOM.inputs.publishDate.value) {
            e.preventDefault();
            alert('Please select a publish date');
            DOM.inputs.publishDate.focus();
            return;
        }

        // 3. Clear storage before submitting (Để lần sau viết bài mới không bị load lại bài cũ)
        localStorage.removeItem(CONFIG.STORAGE_KEY);
        localStorage.removeItem(CONFIG.STORAGE_TIMESTAMP);

        AppLogic.showStatus('✓ Processing...', '#27ae60', 0);
    },

    maintainPreview : function(){
        if(!DOM.previews.panel.classList.contains('active')) return;
        Handlers.togglePreview();
    },

    togglePreview: () => {
        const title = DOM.inputs.title.value || 'Untitled Blog Post';
        const content = DOM.inputs.content.value || 'No content yet...';
        const categoryText = DOM.inputs.category.options[DOM.inputs.category.selectedIndex]?.text || 'Uncategorized';

        DOM.previews.content.innerHTML = `
            <h1>${title}</h1>
            <p style="color: var(--color-gray); font-size: 0.9rem; margin-bottom: 1.5rem;">
                Category: <strong>${categoryText}</strong> | 
                Tags: <strong>${DOM.inputs.tags.value || 'None'}</strong>
            </p>
            <hr style="margin-bottom: 1.5rem; border: none; border-top: 1px solid #e0e0e0;">
            ${Utils.markdownToHtml(content)}
        `;
        DOM.previews.panel.classList.add('active');
    },

    handlePublishOptions: function() {
        if (DOM.radios.schedule.checked) {
            DOM.inputs.publishDate.style.display = 'block';
            DOM.inputs.publishDate.required = true;
        } else {
            DOM.inputs.publishDate.style.display = 'none';
            DOM.inputs.publishDate.required = false;
        }
    }
};

// ==========================================
// 6. INITIALIZATION & BINDING
// ==========================================
function bindEventListeners() {
    // Input Listeners (Stats & AutoSave)
    DOM.inputs.title.addEventListener('input', () => { AppLogic.updateInputCounts(); AppLogic.saveDraft();  Handlers.maintainPreview();});
    DOM.inputs.seo.addEventListener('input', () => { AppLogic.updateInputCounts(); AppLogic.saveDraft();    Handlers.maintainPreview();});
    DOM.inputs.content.addEventListener('input', () => { AppLogic.calculateStats(); AppLogic.saveDraft();   Handlers.maintainPreview();});
    DOM.inputs.tags.addEventListener('input', AppLogic.saveDraft);
    DOM.inputs.category.addEventListener('change', AppLogic.saveDraft);

    // Image Upload
    DOM.inputs.featuredImage.addEventListener('change', Handlers.handleImageUpload);

    // Toolbar Buttons
    DOM.buttons.toolbar.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            AppLogic.applyFormat(btn.dataset.format);
        });
    });

    // Preview
    DOM.buttons.preview.addEventListener('click', Handlers.togglePreview);
    DOM.buttons.closePreview.addEventListener('click', () => DOM.previews.panel.classList.remove('active'));

    // Action Buttons (Set radio state then submit)
    DOM.buttons.saveDraft.addEventListener('click', () => {
        DOM.radios.saveDraft.checked = true;
        DOM.form.requestSubmit(); // Hiện đại hơn dispatchEvent
    });
    DOM.buttons.saveDraftAction.addEventListener('click', () => {
        DOM.radios.saveDraft.checked = true;
        DOM.form.requestSubmit();
    });
    DOM.buttons.publish.addEventListener('click', () => {
        DOM.radios.publishNow.checked = true;
        DOM.form.requestSubmit();
    });

    // Publish Options Toggle
    DOM.radios.schedule.addEventListener('change', Handlers.handlePublishOptions);
    DOM.radios.publishNow.addEventListener('change', Handlers.handlePublishOptions);
    DOM.radios.saveDraft.addEventListener('change', Handlers.handlePublishOptions);

    // Form Submit
    DOM.form.addEventListener('submit', Handlers.handleFormSubmit);

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
            e.preventDefault();
            AppLogic.saveDraft();
            AppLogic.showStatus('✓ Keyboard shortcut: Draft saved!', '#27ae60');
        }
    });

    // Prevent Leave
    window.addEventListener('beforeunload', (e) => {
        if (DOM.inputs.title.value || DOM.inputs.content.value) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

function startAutoSaveInterval() {
    setInterval(() => {
        if (DOM.inputs.title.value || DOM.inputs.content.value) {
            AppLogic.saveDraft();
        }
    }, CONFIG.AUTOSAVE_INTERVAL);
}

// ==========================================
// 7. MAIN ENTRY POINT
// ==========================================
function main() {

    AppLogic.loadDraft();
    AppLogic.calculateStats();
    AppLogic.updateInputCounts();

    bindEventListeners();

    startAutoSaveInterval();

    // console.log('WriteZone Ready.');
}

document.addEventListener('DOMContentLoaded', main);