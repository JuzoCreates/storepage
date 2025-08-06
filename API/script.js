document.addEventListener('DOMContentLoaded', function () {
    // DOM Elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modalContent');
    const closeBtn = document.querySelector('.close');
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearch');
    const subcategoriesContainer = document.getElementById('subcategories');
    const cartBtn = document.querySelector('.cart-btn');
    const cartSidebar = document.getElementById('cartSidebar');
    const closeCartBtn = document.querySelector('.close-cart');
    const cartItemsContainer = document.getElementById('cartItems');
    const cartTotalElement = document.getElementById('cartTotal');
    const cartCountElement = document.querySelector('.cart-count');
    const checkoutBtn = document.querySelector('.checkout-btn');

    // Create cart overlay
    const cartOverlay = document.createElement('div');
    cartOverlay.className = 'cart-overlay';
    document.body.appendChild(cartOverlay);

    let allData = {};
    let currentTab = 'electronics';
    let currentSubcategory = 'all';
    let cart = JSON.parse(localStorage.getItem('cart')) || [];

    // Load data
    fetch('data.json')
        .then(response => response.json())
        .then(data => {
            allData = data;
            initTab(currentTab);
            showSubcategories(currentTab);
            updateCart();
        })
        .catch(error => {
            console.error('Error loading data:', error);
            showError();
        });

    // Cart functions
    function updateCart() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCountElement.textContent = totalItems;
        localStorage.setItem('cart', JSON.stringify(cart));
        renderCartItems();
    }

    function renderCartItems() {
        cartItemsContainer.innerHTML = '';

        if (cart.length === 0) {
            cartItemsContainer.innerHTML =
                `<div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                </div>`;
            cartTotalElement.textContent = '$0.00';
            return;
        }

        let total = 0;

        cart.forEach(item => {
            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.dataset.id = item.id;
            cartItemElement.dataset.category = item.category;

            cartItemElement.innerHTML =
                `<img src="${item.image}" alt="${item.title}" class="cart-item-img">
                <div class="cart-item-details">
                    <h4 class="cart-item-title">${item.title}</h4>
                    <p class="cart-item-price">$${item.price.toFixed(2)}</p>
                    <div class="quantity-controls">
                        <button class="decrease-qty" data-id="${item.id}" data-category="${item.category}">-</button>
                        <span class="qty">${item.quantity}</span>
                        <button class="increase-qty" data-id="${item.id}" data-category="${item.category}">+</button>
                    </div>
                    <button class="remove-item" data-id="${item.id}" data-category="${item.category}">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>`;

            cartItemsContainer.appendChild(cartItemElement);
            total += item.price * item.quantity;
        });

        cartTotalElement.textContent = `$${total.toFixed(2)}`;
    }

    function addToCart(item, tabId) {
        const existingItem = cart.find(cartItem => cartItem.id === item.id && cartItem.category === tabId);

        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                ...item,
                category: tabId,
                quantity: 1
            });
        }

        updateCart();
        showNotification(`${item.title} added to cart`);
    }

    function removeFromCart(itemId, category) {
        cart = cart.filter(item => !(item.id === itemId && item.category === category));
        updateCart();
    }

    function changeQuantity(itemId, category, delta) {
        const item = cart.find(i => i.id === itemId && i.category === category);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                removeFromCart(itemId, category);
            } else {
                updateCart();
            }
        }
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 10);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    // Initialize tab
    function initTab(tabId) {
        currentTab = tabId;
        currentSubcategory = 'all';
        const container = document.getElementById(`${tabId}Container`);
        renderItems(container, allData[tabId].items, tabId);
    }

    // Show subcategories
    function showSubcategories(tabId) {
        subcategoriesContainer.innerHTML = '';

        const allBtn = document.createElement('button');
        allBtn.className = 'subcategory-btn active';
        allBtn.textContent = 'All';
        allBtn.dataset.subcategory = 'all';
        allBtn.addEventListener('click', (e) => {
            filterBySubcategory('all');
            document.querySelectorAll('.subcategory-btn').forEach(btn => btn.classList.remove('active'));
            e.target.classList.add('active');
        });
        subcategoriesContainer.appendChild(allBtn);

        allData[tabId].subcategories.forEach(subcategory => {
            const btn = document.createElement('button');
            btn.className = 'subcategory-btn';
            btn.textContent = subcategory;
            btn.dataset.subcategory = subcategory;
            btn.addEventListener('click', (e) => {
                filterBySubcategory(subcategory);
                document.querySelectorAll('.subcategory-btn').forEach(btn => btn.classList.remove('active'));
                e.target.classList.add('active');
            });
            subcategoriesContainer.appendChild(btn);
        });
    }

    // Filter by subcategory
    function filterBySubcategory(subcategory) {
        currentSubcategory = subcategory;
        const container = document.getElementById(`${currentTab}Container`);

        if (subcategory === 'all') {
            renderItems(container, allData[currentTab].items, currentTab);
        } else {
            const filteredItems = allData[currentTab].items.filter(item => item.category === subcategory);
            renderItems(container, filteredItems, currentTab);
        }

        if (searchInput.value) {
            searchItems(searchInput.value);
        }
    }

    // Render items
    function renderItems(container, items, tabId) {
        container.innerHTML =
            `<div class="loading-animation">
                <div class="loader"></div>
                <p>Loading ${getTabName(tabId)}...</p>
            </div>`;

        setTimeout(() => {
            if (items.length === 0) {
                container.innerHTML =
                    `<div class="no-results">
                        <i class="fas fa-search"></i>
                        <h3>No items found</h3>
                        <p>Try changing your search query</p>
                    </div>`;
                return;
            }

            container.innerHTML = '';
            items.forEach((item, index) => {
                if (item) createProductCard(item, index, container, tabId);
            });
        }, 500);
    }

    // Create product card
    function createProductCard(item, index, container, tabId) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.1}s`;
        card.dataset.id = item.id;

        let html =
            `<img src="${item.image}" alt="${item.title}" class="product-image" loading="lazy">
            <div class="product-info">
                <span class="product-category">${item.category}</span>
                <h3 class="product-title">${item.title}</h3>
                <p class="product-price">$${item.price.toFixed(2)}</p>`;

        if (tabId === 'books') {
            html += `<p class="product-author"><i class="fas fa-user"></i> ${item.author}</p>`;
            html += `<p class="product-year"><i class="fas fa-calendar-alt"></i> ${item.year}</p>`;
        } else if (tabId === 'clothing' && item.size) {
            html += `<p class="product-sizes"><i class="fas fa-tshirt"></i> Sizes: ${item.size.join(', ')}</p>`;
        } else if (tabId === 'home' && item.dimensions) {
            html += `<p class="product-dimensions"><i class="fas fa-ruler-combined"></i> ${item.dimensions}</p>`;
        }

        html += `</div><button class="quick-add" data-id="${item.id}">Add to Cart</button>`;

        card.innerHTML = html;

        card.querySelector('.quick-add').addEventListener('click', (e) => {
            e.stopPropagation();
            addToCart(item, tabId);
        });

        card.addEventListener('click', () => openModal(item, tabId));
        container.appendChild(card);
    }
    
    // Delete item from site
    function deleteItemFromSite(itemId) {
        allData[currentTab].items = allData[currentTab].items.filter(item => item.id !== itemId);
        filterBySubcategory(currentSubcategory);
        showNotification('Товар удалён с сайта');
    }
    
    // Search items
    function searchItems(query) {
        let items = currentSubcategory === 'all'
            ? allData[currentTab].items
            : allData[currentTab].items.filter(item => item.category === currentSubcategory);

        if (!query) {
            const container = document.getElementById(`${currentTab}Container`);
            renderItems(container, items, currentTab);
            return;
        }

        const lowerQuery = query.toLowerCase();
        const filteredItems = items.filter(item =>
            item.title.toLowerCase().includes(lowerQuery) ||
            (item.description && item.description.toLowerCase().includes(lowerQuery)) ||
            (item.category && item.category.toLowerCase().includes(lowerQuery)) ||
            (item.author && item.author.toLowerCase().includes(lowerQuery)) ||
            (item.size && item.size.join(' ').toLowerCase().includes(lowerQuery))
        );

        const container = document.getElementById(`${currentTab}Container`);
        renderItems(container, filteredItems, currentTab);
    }

    // Open modal
    function openModal(item, tabId) {
        let modalHtml = 
            `<img src="${item.image}" alt="${item.title}" class="modal-image">
            <h2 class="modal-title">${item.title}</h2>
            <span class="modal-category">${item.category}</span>
            <p class="modal-price">$${item.price.toFixed(2)}</p>
            <div class="modal-rating">
                <span class="stars">${'★'.repeat(Math.round(item.rating.rate))}${'☆'.repeat(5 - Math.round(item.rating.rate))}</span>
                <span>${item.rating.count} reviews</span>
            </div>
            <p class="modal-description">${item.description}</p>`;

        if (tabId === 'books') {
            modalHtml += 
                `<div class="modal-details">
                    <p><i class="fas fa-user"></i> <strong>Author:</strong> ${item.author}</p>
                    <p><i class="fas fa-calendar-alt"></i> <strong>Year:</strong> ${item.year}</p>
                </div>`;
        } else if (tabId === 'clothing' && item.size) {
            modalHtml += 
                `<div class="modal-details">
                    <p><i class="fas fa-tshirt"></i> <strong>Sizes:</strong> ${item.size.join(', ')}</p>
                </div>`;
        } else if (tabId === 'home' && item.dimensions) {
            modalHtml += 
                `<div class="modal-details">
                    <p><i class="fas fa-ruler-combined"></i> <strong>Dimensions:</strong> ${item.dimensions}</p>
                </div>`;
        }
        
        modalHtml += `
            <button class="add-to-cart" data-id="${item.id}">Add to Cart</button>
            <button class="delete-from-site" data-id="${item.id}">Удалить с сайта</button>
        `;
        
        modalContent.innerHTML = modalHtml;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        const addToCartBtn = modalContent.querySelector('.add-to-cart');
        addToCartBtn.addEventListener('click', () => {
            addToCart(item, tabId);
            closeModal();
        });

        const deleteFromSiteBtn = modalContent.querySelector('.delete-from-site');
        deleteFromSiteBtn.addEventListener('click', () => {
            deleteItemFromSite(item.id);
            closeModal();
        });
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }

    function showTab(tabId) {
        tabContents.forEach(tab => tab.classList.remove('active'));
        tabBtns.forEach(btn => btn.classList.remove('active'));

        document.getElementById(tabId).classList.add('active');
        document.querySelector(`.tab-btn[data-tab="${tabId}"]`).classList.add('active');

        currentTab = tabId;
        initTab(tabId);
        showSubcategories(tabId);
    }

    function getTabName(tabId) {
        const names = {
            'electronics': 'electronics',
            'books': 'books',
            'clothing': 'clothing',
            'home': 'home goods'
        };
        return names[tabId] || 'items';
    }

    function showError() {
        const containers = document.querySelectorAll('.products-container');
        containers.forEach(container => {
            container.innerHTML =
                `<div class="error-message" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #e63946; margin-bottom: 20px;"></i>
                    <h3>Error loading data</h3>
                    <p>Please try refreshing the page later</p>
                </div>`;
        });
    }

    // Event handlers
    tabBtns.forEach(btn => btn.addEventListener('click', () => showTab(btn.dataset.tab)));

    searchInput.addEventListener('input', (e) => {
        if (e.target.value) {
            clearSearchBtn.style.display = 'block';
            searchItems(e.target.value);
        } else {
            clearSearchBtn.style.display = 'none';
            searchItems('');
        }
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        clearSearchBtn.style.display = 'none';
        searchItems('');
    });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchItems(e.target.value);
    });

    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    cartBtn.addEventListener('click', () => {
        cartSidebar.classList.add('active');
        cartOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeCartBtn.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    cartOverlay.addEventListener('click', () => {
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    // Handle cart item events
    document.addEventListener('click', (e) => {
        // Remove item
        if (e.target.classList.contains('remove-item')) {
            const itemId = parseInt(e.target.dataset.id);
            const category = e.target.dataset.category;
            removeFromCart(itemId, category);
        }
        
        // Increase quantity
        else if (e.target.classList.contains('increase-qty')) {
            const itemId = parseInt(e.target.dataset.id);
            const category = e.target.dataset.category;
            changeQuantity(itemId, category, 1);
        }
        
        // Decrease quantity
        else if (e.target.classList.contains('decrease-qty')) {
            const itemId = parseInt(e.target.dataset.id);
            const category = e.target.dataset.category;
            changeQuantity(itemId, category, -1);
        }
    });

    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            showNotification('Your cart is empty!');
            return;
        }
        cart = [];
        updateCart();
        showNotification('Thank you for your purchase!');
        cartSidebar.classList.remove('active');
        cartOverlay.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    updateCart();
});