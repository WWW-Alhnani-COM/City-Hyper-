// --- 1. الإعدادات والاتصال ---
const supabaseUrl = 'https://lluxexpussqaigzqmdii.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxsdXhleHB1c3NxYWlnenFtZGlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzM0MjAsImV4cCI6MjA4NjE0OTQyMH0.9VWGHgKe-wJUadDhzvMpSxlg3sjTcnqXGfglOfnC-vw';
const _supabase = supabase.createClient(supabaseUrl, supabaseKey);

let allProducts = [];

// --- 2. تشغيل التطبيق وجلب البيانات ---
async function loadAppData() {
    try {
        await Promise.all([fetchBanners(), fetchCategories(), fetchProducts()]);
    } catch (err) {
        console.error("Error loading app data:", err);
    }
}

// جلب البنرات مع دعم نظام التمرير اليدوي والتلقائي
async function fetchBanners() {
    const { data } = await _supabase.from('banners').select('*');
    const container = document.getElementById('bannerContainer');
    if (data && data.length > 0) {
        container.innerHTML = data.map((b) => 
            `<img src="${b.image_url}" class="banner-slide">`
        ).join('');
        initBannerCycle();
    }
}

// جلب التصنيفات
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

// جلب المنتجات
async function fetchProducts() {
    const { data } = await _supabase.from('products').select('*');
    if (data) {
        allProducts = data;
        renderProducts(allProducts);
    }
}

// --- 3. وظائف العرض والفلترة ---

function renderProducts(list) {
    const grid = document.getElementById('grid');
    if (list.length === 0) {
        grid.innerHTML = '<p style="text-align:center; grid-column: 1/-1; padding: 20px;">لا توجد نتائج مطابقة</p>';
        return;
    }
    grid.innerHTML = list.map(p => `
        <div class="product-card" onclick="openProductDetails('${p.id}')">
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

// --- 4. منطق البنرات (تلاشي وتمرير تلقائي) ---
function initBannerCycle() {
    const container = document.getElementById('bannerContainer');
    const slides = container.querySelectorAll('.banner-slide');
    if(slides.length <= 1) return;

    let currentIndex = 0;

    setInterval(() => {
        currentIndex = (currentIndex + 1) % slides.length;
        
        // التمرير البرمجي الانسيابي
        container.scrollTo({
            left: container.offsetWidth * currentIndex,
            behavior: 'smooth'
        });
        
        // تأثير تلاشي بسيط أثناء الحركة
        slides.forEach((s, i) => {
            s.style.opacity = (i === currentIndex) ? '1' : '0.8';
        });
    }, 5000);
}

// --- 5. منطق صفحة تفاصيل المنتج ---

async function openProductDetails(productId) {
    const page = document.getElementById('productDetailsPage');
    const content = document.getElementById('detailsContent');
    
    // إظهار الصفحة وتصفير المحتوى للتحميل
    page.style.display = 'block';
    document.body.style.overflow = 'hidden'; // منع تمرير الصفحة الخلفية
    content.innerHTML = '<div style="text-align:center; padding:100px;">جاري جلب تفاصيل العرض...</div>';

    // جلب بيانات المنتج من Supabase بناءً على الـ ID
    const { data: p, error } = await _supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

    if (p) {
        content.innerHTML = `
            <div class="details-image-container">
                <img src="${p.image_url}" alt="${p.name}">
            </div>
            
            <div class="details-info-wrapper">
                <h1 class="details-name">${p.name}</h1>
                
                <div class="details-price">
                    <span class="details-new-p">${p.new_price} ريال</span>
                    ${p.old_price ? `<span class="details-old-p">${p.old_price} ريال</span>` : ''}
                </div>

                <div class="offer-badge">
                    <h4>🔥 تفاصيل العرض:</h4>
                    <p>${p.offer_details || 'سعر مغري لفترة محدودة أو حتى نفاذ الكمية!'}</p>
                </div>

                <div class="details-description">
                    <h4>وصف المنتج:</h4>
                    <p>${p.description || 'لا يوجد وصف إضافي لهذا المنتج حالياً.'}</p>
                </div>
            </div>

            <div class="order-bar">
                <div style="text-align:right">
                    <small style="color:#666">السعر الحالي</small>
                    <div style="font-weight:900; color:var(--city-red); font-size:1.2rem;">${p.new_price} ريال</div>
                </div>
                <a href="https://wa.me/9677777771944?text=السلام عليكم، أريد طلب: ${p.name}" class="whatsapp-btn" target="_blank">
                   اطلب عبر واتساب 💬
                </a>
            </div>
        `;
    } else {
        content.innerHTML = '<div style="text-align:center; padding:50px;">عذراً، تعذر العثور على المنتج.</div>';
    }
}

// إغلاق صفحة التفاصيل
function closeDetails() {
    document.getElementById('productDetailsPage').style.display = 'none';
    document.body.style.overflow = 'auto'; // إعادة تفعيل التمرير
}

// تشغيل التطبيق
loadAppData();
