const supabaseUrl = 'https://lluxexpussqaigzqmdii.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsdXhleHB1c3NxYWlnenFtZGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzM0MjAsImV4cCI6MjA4NjE0OTQyMH0.9VWGHgKe-wJUadDhzvMpSxlg3sjTcnqXGfglOfnC-vw';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

let allProducts = [];

async function loadAppData() {
    try {
        await Promise.all([fetchBanners(), fetchCategories(), fetchProducts()]);
    } catch (err) {
        console.error("Error loading app data:", err);
    }
}

async function fetchBanners() {
    const { data } = await _supabase.from('banners').select('*');
    const container = document.getElementById('bannerContainer');
    if (data && data.length > 0) {
        container.innerHTML = data.map((b, i) => 
            `<img src="${b.image_url}" class="banner-slide" style="display:${i===0?'block':'none'}">`
        ).join('');
        initBannerCycle();
    }
}

async function fetchCategories() {
    const { data } = await _supabase.from('categories').select('*');
    const container = document.getElementById('categoryTags');
    if (data) {
        data.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'tag-btn';
            btn.innerText = cat.name;
            btn.onclick = () => filterCat(cat.id, btn);
            container.appendChild(btn);
        });
    }
}

async function fetchProducts() {
    const { data } = await _supabase.from('products').select('*');
    if (data) {
        allProducts = data;
        renderProducts(allProducts);
    }
}

function renderProducts(list) {
    const grid = document.getElementById('grid');
    if (list.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1;">لا توجد نتائج مطابقة</p>';
        return;
    }
    grid.innerHTML = list.map(p => `
        <div class="product-card">
            <img src="${p.image_url}" alt="${p.name}">
            <div class="product-name">${p.name}</div>
            <div class="price-container">
                ${p.old_price ? `<span class="old-p">${p.old_price} ريال</span>` : ''}
                <span class="new-p">${p.new_price} ريال</span>
            </div>
        </div>
    `).join('');
}

function filterProducts() {
    const term = document.getElementById('searchInput').value.toLowerCase();
    const filtered = allProducts.filter(p => p.name.toLowerCase().includes(term));
    renderProducts(filtered);
}

function filterCat(catId, btn) {
    document.querySelectorAll('.tag-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filtered = catId === 'all' ? allProducts : allProducts.filter(p => p.category_id == catId);
    renderProducts(filtered);
}

function initBannerCycle() {
    let current = 0;
    const slides = document.querySelectorAll('.banner-slide');
    if(slides.length <= 1) return;
    setInterval(() => {
        slides[current].style.display = "none";
        current = (current + 1) % slides.length;
        slides[current].style.display = "block";
    }, 5000);
}

loadAppData();
