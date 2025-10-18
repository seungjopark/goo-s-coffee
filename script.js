// 전역 변수
let products = [];
let orders = [];
let currentOrder = {};  // 각 상품별 수량을 저장하는 객체
let deferredPrompt;

// DOM 요소들
const tabs = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const currentDateEl = document.getElementById('current-date');
const todayOrdersEl = document.getElementById('today-orders');
const todayRevenueEl = document.getElementById('today-revenue');
const orderProductsGridEl = document.getElementById('order-products-grid');
const orderSummaryItemsEl = document.getElementById('order-summary-items');
const totalAmountEl = document.getElementById('total-amount');
const productsGridEl = document.getElementById('products-grid');
const ordersListEl = document.getElementById('orders-list');
const productModal = document.getElementById('product-modal');
const productForm = document.getElementById('product-form');
const notification = document.getElementById('notification');
const loading = document.getElementById('loading');
const startDateEl = document.getElementById('start-date');
const endDateEl = document.getElementById('end-date');
const filterStatusEl = document.getElementById('filter-status');

// 초기화 (비동기)
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 애플리케이션 초기화 시작...');
    
    try {
        showLoading(); // 로딩 표시
        
        updateCurrentDate();
        setupEventListeners();
        setupPWA();
        
        // 데이터 로드 (비동기)
        await loadData();
        
        // UI 렌더링
        updateDashboard();
        renderProducts();
        renderOrderHistory();
        renderOrderProductsGrid();
        updateOrderSummary();
        
        console.log('✅ 애플리케이션 초기화 완료!');
        
    } catch (error) {
        console.error('❌ 초기화 실패:', error);
        showNotification('애플리케이션 초기화에 실패했습니다', 'error');
    } finally {
        hideLoading(); // 로딩 숨김
    }
});

// 이벤트 리스너 설정
function setupEventListeners() {
    // 탭 전환
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // 통계 기간 선택
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => updateStatistics(btn.dataset.period));
    });

    // 모달 외부 클릭시 닫기
    productModal.addEventListener('click', (e) => {
        if (e.target === productModal) closeProductModal();
    });
    
    // 옵션 입력 엔터키 이벤트
    setupOptionInputKeyListener();
}

// 데이터 로드 (비동기)
async function loadData() {
    try {
        // 상품 데이터 로드
        products = await loadProducts();
        
        // 기존 상품들이 있지만 order/options 필드가 없는 경우 추가
        if (products.length > 0) {
            let needsSave = false;
            
            products.forEach((product, index) => {
                if (product.order === undefined) {
                    product.order = index;
                    needsSave = true;
                }
                if (product.options === undefined) {
                    product.options = [
                        { name: '핫', price: 0 },
                        { name: '아이스', price: 0 }
                    ]; // 기본적으로 핫, 아이스
                    needsSave = true;
                }
                // 기존 color 필드가 있으면 options로 변환
                if (product.color !== undefined) {
                    product.options = [
                        { name: '핫', price: 0 },
                        { name: '아이스', price: 0 }
                    ];
                    delete product.color;
                    needsSave = true;
                }
                // options 배열에 문자열이 있으면 객체 형태로 변환
                if (product.options && Array.isArray(product.options)) {
                    let optionsChanged = false;
                    product.options = product.options.map(option => {
                        if (typeof option === 'string') {
                            optionsChanged = true;
                            let name = option;
                            let price = 0;
                            
                            // 기존 'hot', 'ice' 값을 한글로 변환
                            if (option === 'hot') name = '핫';
                            if (option === 'ice') name = '아이스';
                            
                            return { name: name, price: price };
                        }
                        return option;
                    });
                    if (optionsChanged) {
                        needsSave = true;
                    }
                }
            });
            
            // order/options 필드를 추가한 경우 저장
            if (needsSave) {
                console.log('🔄 기존 상품에 순서 및 옵션 정보 추가 중...');
                if (!window.USE_SUPABASE) {
                    saveProducts();
                }
            }
        }
        
        // 상품이 없는 경우에만 기본 상품 생성
        if (products.length === 0) {
            console.log('📦 기본 상품 생성 중...');
            products = getDefaultProducts();
            if (!window.USE_SUPABASE) {
                saveProducts();
            }
        }
        
        // 주문 데이터 로드
        orders = await loadOrders();
        
        console.log(`✅ 데이터 로드 완료: 상품 ${products.length}개, 주문 ${orders.length}건`);
    } catch (error) {
        console.error('❌ 데이터 로드 실패:', error);
        // 오류 발생시 기본값으로 폴백
        products = getDefaultProducts();
        orders = [];
    }
}

// 기본 상품 데이터
function getDefaultProducts() {
    return [
        { 
            id: 1, 
            name: '에티오피아 예가체프', 
            price: 15000, 
            order: 0, 
            options: [
                { name: '핫', price: 0 },
                { name: '아이스', price: 0 }
            ]
        },
        { 
            id: 2, 
            name: '콜롬비아 수프리모', 
            price: 16000, 
            order: 1, 
            options: [
                { name: '핫', price: 0 },
                { name: '아이스', price: 0 }
            ]
        },
        { 
            id: 3, 
            name: '브라질 산토스', 
            price: 14000, 
            order: 2, 
            options: [
                { name: '100g', price: 0 },
                { name: '200g', price: 2000 },
                { name: '500g', price: 5000 }
            ]
        },
        { 
            id: 4, 
            name: '과테말라 안티구아', 
            price: 17000, 
            order: 3, 
            options: [
                { name: '라지', price: 1000 },
                { name: '미디움', price: 0 }
            ]
        },
        { 
            id: 5, 
            name: '케냐 AA', 
            price: 18000, 
            order: 4, 
            options: [
                { name: '핫', price: 0 },
                { name: '아이스', price: 0 },
                { name: '콜드브루', price: 1500 }
            ]
        }
    ];
}

// 데이터 저장
function saveProducts() {
    localStorage.setItem('goosCoffeeProducts', JSON.stringify(products));
}

function saveOrders() {
    localStorage.setItem('goosCoffeeOrders', JSON.stringify(orders));
}

// 현재 날짜 업데이트
function updateCurrentDate() {
    const now = new Date();
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        weekday: 'long'
    };
    currentDateEl.textContent = now.toLocaleDateString('ko-KR', options);
}

// 탭 전환
function switchTab(tabName) {
    // 탭 버튼 활성화
    tabs.forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });

    // 탭 컨텐츠 표시
    tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === `${tabName}-tab`) {
            content.classList.add('active');
        }
    });

    // 특정 탭 로드시 추가 작업
    if (tabName === 'statistics') {
        updateStatistics('daily');
    } else if (tabName === 'order') {
        renderOrderProductsGrid();
        updateOrderSummary();
        updateOrderTotal();
    }
}

// 대시보드 업데이트
function updateDashboard() {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(order => order.date === today);
    
    todayOrdersEl.textContent = `${todayOrders.length}건`;
    
    const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
    todayRevenueEl.textContent = formatPrice(todayRevenue);
}

// 가격 포맷팅
function formatPrice(price) {
    // 안전성 검사: undefined, null, NaN 처리
    const numPrice = Number(price);
    if (isNaN(numPrice) || price === null || price === undefined) {
        return '0원';
    }
    return numPrice.toLocaleString('ko-KR') + '원';
}

// 알림 표시
function showNotification(message, type = 'success') {
    const icon = notification.querySelector('.notification-icon');
    const messageEl = notification.querySelector('.notification-message');
    
    // 아이콘 설정
    icon.className = 'notification-icon fas ';
    if (type === 'success') {
        icon.className += 'fa-check-circle';
        notification.className = 'notification show';
    } else if (type === 'error') {
        icon.className += 'fa-exclamation-triangle';
        notification.className = 'notification show error';
    } else if (type === 'warning') {
        icon.className += 'fa-exclamation-circle';
        notification.className = 'notification show warning';
    }
    
    messageEl.textContent = message;
    
    // 3초 후 자동 숨김
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// 로딩 표시/숨김
function showLoading() {
    loading.classList.add('show');
}

function hideLoading() {
    loading.classList.remove('show');
}

// === 상품 관리 기능 ===

// 현재 편집 중인 상품의 옵션 배열
let currentProductOptions = [];

// 옵션 추가
function addOption() {
    const nameInput = document.getElementById('new-option-name');
    const priceInput = document.getElementById('new-option-price');
    
    const optionName = nameInput.value.trim();
    const optionPrice = parseInt(priceInput.value) || 0;
    
    if (!optionName) {
        showNotification('옵션명을 입력해주세요', 'warning');
        return;
    }
    
    if (optionName.length > 20) {
        showNotification('옵션명은 20자 이내로 입력해주세요', 'error');
        return;
    }
    
    if (currentProductOptions.some(option => option.name === optionName)) {
        showNotification('이미 존재하는 옵션입니다', 'warning');
        return;
    }
    
    currentProductOptions.push({ name: optionName, price: optionPrice });
    nameInput.value = '';
    priceInput.value = '';
    renderOptionsInModal();
}

// 옵션 제거
function removeOption(optionName) {
    currentProductOptions = currentProductOptions.filter(option => option.name !== optionName);
    renderOptionsInModal();
}

// 모달에서 옵션 렌더링
function renderOptionsInModal() {
    const optionsList = document.getElementById('options-list');
    
    if (currentProductOptions.length === 0) {
        optionsList.innerHTML = '';
        return;
    }
    
    optionsList.innerHTML = currentProductOptions.map(option => `
        <div class="option-tag">
            <span>${option.name} ${option.price > 0 ? '(+' + formatPrice(option.price) + ')' : ''}</span>
            <button type="button" class="option-remove-btn" onclick="removeOption('${option.name}')">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
}

// 엔터키로 옵션 추가
function setupOptionInputKeyListener() {
    const nameInput = document.getElementById('new-option-name');
    const priceInput = document.getElementById('new-option-price');
    
    [nameInput, priceInput].forEach(input => {
        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addOption();
            }
        });
    });
}

// 상품 목록 렌더링
function renderProducts() {
    if (products.length === 0) {
        productsGridEl.innerHTML = `
            <div class="empty-state products-empty">
                <div class="coffee-bean-icon"></div>
                <h3>등록된 상품이 없습니다</h3>
                <p>새 상품을 추가해보세요</p>
            </div>
        `;
        return;
    }

    // 순서가 있으면 order 기준으로 정렬, 없으면 기본 순서 유지
    const sortedProducts = [...products].sort((a, b) => {
        const orderA = a.order !== undefined ? a.order : a.id;
        const orderB = b.order !== undefined ? b.order : b.id;
        return orderA - orderB;
    });

    productsGridEl.innerHTML = sortedProducts.map((product, index) => {
        const options = product.options || [{ name: '핫', price: 0 }, { name: '아이스', price: 0 }];
        const optionIndicators = options.slice(0, 3).map(option => 
            `<div class="option-indicator">${option.name}</div>`
        ).join('');
        const moreIndicator = options.length > 3 ? '<div class="option-indicator">+' + (options.length - 3) + '</div>' : '';
        
        return `
            <div class="product-card" 
                 draggable="true" 
                 data-product-id="${product.id}"
                 data-product-index="${index}">
                <div class="drag-handle">
                    <i class="fas fa-grip-vertical"></i>
                </div>
                <div class="product-content">
                    <div class="options-indicators">${optionIndicators}${moreIndicator}</div>
                    <div class="product-name">${product.name}</div>
                    <div class="product-price">${formatPrice(product.price)}</div>
                    <div class="product-actions">
                        <button class="btn btn-secondary" onclick="editProduct(${product.id})">
                            <i class="fas fa-edit"></i> 수정
                        </button>
                        <button class="btn btn-danger" onclick="deleteProduct(${product.id})">
                            <i class="fas fa-trash"></i> 삭제
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    // 드래그앤드롭 이벤트 리스너 추가
    addDragDropListeners();
}

// 상품 추가/수정 모달 표시
function showAddProductModal() {
    document.getElementById('modal-title').textContent = '새 상품 추가';
    document.getElementById('product-id').value = '';
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';
    
    // 옵션 초기화
    currentProductOptions = [];
    renderOptionsInModal();
    
    productModal.classList.add('active');
    document.getElementById('product-name').focus();
}

function editProduct(id) {
    const product = products.find(p => p.id === id);
    if (product) {
        document.getElementById('modal-title').textContent = '상품 수정';
        document.getElementById('product-id').value = product.id;
        document.getElementById('product-name').value = product.name;
        document.getElementById('product-price').value = product.price;
        
        // 옵션 설정
        currentProductOptions = product.options ? [...product.options] : [];
        renderOptionsInModal();
        
        productModal.classList.add('active');
        document.getElementById('product-name').focus();
    }
}

// 상품 모달 닫기
function closeProductModal() {
    productModal.classList.remove('active');
    productForm.reset();
    // 옵션 초기화
    currentProductOptions = [];
    renderOptionsInModal();
}

// 상품 저장 (비동기)
async function saveProduct(event) {
    event.preventDefault();
    
    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value.trim();
    const price = parseInt(document.getElementById('product-price').value);
    
    // 옵션 수집
    const options = [...currentProductOptions];
    
    if (!name || !price || price <= 0) {
        showNotification('상품명과 가격을 올바르게 입력해주세요', 'error');
        return;
    }
    
    if (options.length === 0) {
        showNotification('최소 하나의 옵션을 추가해주세요', 'error');
        return;
    }
    
    showLoading();
    
    try {
        if (id) {
            // 수정
            if (window.USE_SUPABASE) {
                await updateProduct(parseInt(id), name, price, options);
                // 로컬 데이터도 업데이트
                const index = products.findIndex(p => p.id === parseInt(id));
                if (index !== -1) {
                    products[index] = { ...products[index], name, price, options };
                }
            } else {
                // LocalStorage 모드
                const index = products.findIndex(p => p.id === parseInt(id));
                products[index] = { ...products[index], name, price, options };
                saveProducts();
            }
            showNotification('상품이 수정되었습니다');
        } else {
            // 추가
            if (window.USE_SUPABASE) {
                const newProduct = await addProduct(name, price, options);
                products.push(newProduct);
            } else {
                // LocalStorage 모드
                const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
                const maxOrder = products.length > 0 ? Math.max(...products.map(p => p.order !== undefined ? p.order : 0)) : -1;
                products.push({ id: newId, name, price, options, order: maxOrder + 1 });
                saveProducts();
            }
            showNotification('새 상품이 추가되었습니다');
        }
        
        renderProducts();
        renderOrderProductsGrid();
        closeProductModal();
        
    } catch (error) {
        console.error('상품 저장 실패:', error);
        showNotification('상품 저장에 실패했습니다', 'error');
    } finally {
        hideLoading();
    }
}

// 상품 삭제 (비동기)
async function deleteProduct(id) {
    if (!confirm('정말로 이 상품을 삭제하시겠습니까?')) {
        return;
    }
    
    showLoading();
    
    try {
        // 현재 주문에서도 해당 상품 제거
        if (currentOrder[id]) {
            delete currentOrder[id];
        }
        
        if (window.USE_SUPABASE) {
            await deleteProductFromDB(id);
        }
        
        // 로컬 데이터에서도 제거
        products = products.filter(p => p.id !== id);
        
        if (!window.USE_SUPABASE) {
            saveProducts();
        }
        
        renderProducts();
        renderOrderProductsGrid();
        updateOrderSummary();
        updateOrderTotal();
        showNotification('상품이 삭제되었습니다');
        
    } catch (error) {
        console.error('상품 삭제 실패:', error);
        showNotification('상품 삭제에 실패했습니다', 'error');
    } finally {
        hideLoading();
    }
}

// === 주문 관리 기능 ===

// 주문 상품 타일 그리드 렌더링
function renderOrderProductsGrid() {
    if (products.length === 0) {
        orderProductsGridEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-coffee"></i>
                <h3>등록된 상품이 없습니다</h3>
                <p>상품관리에서 커피 원두를 먼저 등록해주세요</p>
                <button class="btn btn-primary" onclick="switchTab('products')">
                    상품 등록하러 가기
                </button>
            </div>
        `;
        return;
    }

    // 상품 관리에서와 동일한 순서로 정렬
    const sortedProducts = [...products].sort((a, b) => {
        const orderA = a.order !== undefined ? a.order : a.id;
        const orderB = b.order !== undefined ? b.order : b.id;
        return orderA - orderB;
    });

    orderProductsGridEl.innerHTML = sortedProducts.map(product => {
        // 모든 옵션에 대한 수량 계산
        let totalQuantity = 0;
        let totalSubtotal = 0;
        const options = product.options || [{ name: '핫', price: 0 }, { name: '아이스', price: 0 }];
        
        // 선택된 옵션만 계산하도록 수정
        const selectedOption = selectedProductOptions[product.id] || options[0].name;
        const selectedOptionData = options.find(opt => opt.name === selectedOption) || options[0];
        const key = `${product.id}_${selectedOption}`;
        const qty = currentOrder[key] || 0;
        totalQuantity = qty;
        totalSubtotal = (product.price + selectedOptionData.price) * qty;
        
        const isSelected = totalQuantity > 0;
        const optionIndicators = options.slice(0, 3).map(option => 
            `<div class="option-indicator">${option.name}</div>`
        ).join('');
        const moreIndicator = options.length > 3 ? '<div class="option-indicator">+' + (options.length - 3) + '</div>' : '';

        return `
            <div class="order-product-tile ${isSelected ? 'selected' : ''}" data-product-id="${product.id}">
                <div class="product-tile-header">
                    <div class="product-tile-icon">
                        <i class="fas fa-coffee"></i>
                    </div>
                    <div class="product-tile-info">
                        <div class="product-tile-name">${product.name}</div>
                        <div class="product-tile-price">${formatPrice(product.price)}</div>
                    </div>
                </div>
                
                <div class="product-option-selection">
                    <label for="option-select-${product.id}" class="option-label">옵션 선택:</label>
                    <select id="option-select-${product.id}" class="option-select" onchange="updateSelectedOption(${product.id})">
                        ${options.map((option, index) => {
                            const currentSelected = selectedProductOptions[product.id] || options[0].name;
                            return `
                            <option value="${option.name}" ${option.name === currentSelected ? 'selected' : ''}>
                                ${option.name}${option.price > 0 ? ` (+${formatPrice(option.price)})` : ''}
                            </option>
                        `;}).join('')}
                    </select>
                </div>
                
                <div class="product-tile-controls">
                    <div class="product-quantity-controls">
                        <button type="button" class="product-quantity-btn" onclick="updateDirectProductQuantity(${product.id}, -1)" ${totalQuantity <= 0 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <div class="product-quantity-display">${totalQuantity}</div>
                        <button type="button" class="product-quantity-btn" onclick="updateDirectProductQuantity(${product.id}, 1)" ${totalQuantity >= 99 ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="product-subtotal">
                        ${totalQuantity > 0 ? formatPrice(totalSubtotal) : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 각 상품별 선택된 옵션 저장
let selectedProductOptions = {};

// 선택된 옵션 업데이트
function updateSelectedOption(productId) {
    const selectElement = document.getElementById(`option-select-${productId}`);
    if (selectElement) {
        selectedProductOptions[productId] = selectElement.value;
        
        // 해당 상품의 수량 표시 업데이트
        renderOrderProductsGrid();
        updateOrderSummary();
        updateOrderTotal();
    }
}

// 직접 수량 업데이트 (선택된 옵션 사용)
function updateDirectProductQuantity(productId, change) {
    const selectedOption = selectedProductOptions[productId] || getFirstOptionName(productId);
    
    if (!selectedOption) return;
    
    updateProductQuantity(productId, selectedOption, change);
}

// 상품의 첫 번째 옵션명 가져오기
function getFirstOptionName(productId) {
    const product = products.find(p => p.id === productId);
    if (product && product.options && product.options.length > 0) {
        return product.options[0].name;
    }
    return null;
}

// 주문 요약에서 개별 항목 제거
function removeOrderItem(orderKey) {
    if (!currentOrder[orderKey]) {
        showNotification('해당 주문 항목을 찾을 수 없습니다', 'warning');
        return;
    }
    
    const [productId, optionName] = orderKey.split('_');
    const product = products.find(p => p.id === parseInt(productId));
    const productName = product ? product.name : '상품';
    
    if (confirm(`${productName} (${optionName})을(를) 주문에서 제거하시겠습니까?`)) {
        // 주문에서 해당 항목 제거
        delete currentOrder[orderKey];
        
        // UI 업데이트
        renderOrderProductsGrid();
        updateOrderSummary();
        updateOrderTotal();
        
        showNotification(`${productName} (${optionName})이(가) 주문에서 제거되었습니다`);
        
        // 햅틱 피드백 (모바일)
        if (navigator.vibrate) {
            navigator.vibrate(100);
        }
    }
}

// 온도 선택 모달 관련 변수들 (이제 사용하지 않음)
let currentProductId = null;
let currentQuantityChange = 0;

// 옵션 선택 모달 표시
function showOptionModal(productId, change) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const options = product.options || [{ name: '핫', price: 0 }, { name: '아이스', price: 0 }];
    
    // 옵션이 하나만 있으면 바로 처리
    if (options.length === 1) {
        updateProductQuantity(productId, options[0].name, change);
        return;
    }
    
    // 여러 옵션이 있으면 모달 표시
    currentProductId = productId;
    currentQuantityChange = change;
    
    const modalTitle = document.getElementById('temperature-modal-title');
    modalTitle.textContent = `${product.name} - 옵션을 선택해주세요`;
    
    // 온도 선택 버튼들을 동적으로 생성
    const modalContent = document.querySelector('.temperature-selection-modal');
    modalContent.innerHTML = options.map(option => `
        <div class="option-choice" onclick="selectOption('${option.name}')">
            <span class="option-choice-text">${option.name}</span>
            ${option.price > 0 ? `<span class="option-price">+${formatPrice(option.price)}</span>` : ''}
        </div>
    `).join('');
    
    document.getElementById('temperature-modal').classList.add('active');
}

// 옵션 선택
function selectOption(option) {
    if (currentProductId !== null) {
        updateProductQuantity(currentProductId, option, currentQuantityChange);
        closeOptionModal();
    }
}

// 옵션 선택 모달 닫기
function closeOptionModal() {
    document.getElementById('temperature-modal').classList.remove('active');
    currentProductId = null;
    currentQuantityChange = 0;
}

// 상품 수량 업데이트 (옵션 포함)
function updateProductQuantity(productId, option, change) {
    const key = `${productId}_${option}`;
    const currentQuantity = currentOrder[key] || 0;
    let newQuantity = currentQuantity + change;
    
    // 수량 범위 제한
    if (newQuantity < 0) newQuantity = 0;
    if (newQuantity > 99) newQuantity = 99;
    
    // 수량이 0이면 주문에서 제거, 아니면 업데이트
    if (newQuantity === 0) {
        delete currentOrder[key];
    } else {
        currentOrder[key] = newQuantity;
    }
    
    // UI 업데이트
    renderOrderProductsGrid();
    updateOrderSummary();
    updateOrderTotal();
    
    // 햅틱 피드백 (모바일)
    if (navigator.vibrate && change !== 0) {
        navigator.vibrate(50);
    }
}

// 주문 요약 업데이트
function updateOrderSummary() {
    const orderItems = Object.entries(currentOrder).filter(([_, quantity]) => quantity > 0);
    
    if (orderItems.length === 0) {
        orderSummaryItemsEl.innerHTML = `
            <div class="empty-order">
                <i class="fas fa-shopping-cart"></i>
                <p>선택된 상품이 없습니다</p>
            </div>
        `;
        return;
    }
    
    orderSummaryItemsEl.innerHTML = orderItems.map(([key, quantity]) => {
        const [productId, optionName] = key.split('_');
        const product = products.find(p => p.id === parseInt(productId));
        if (!product) return '';
        
        const option = product.options.find(opt => opt.name === optionName) || { name: optionName, price: 0 };
        const itemPrice = product.price + option.price;
        const subtotal = itemPrice * quantity;
        
        return `
            <div class="order-summary-item">
                <div class="order-summary-info">
                    <div class="order-summary-name">${product.name} (${option.name})</div>
                    <div class="order-summary-details">
                        ${quantity}개 × ${formatPrice(itemPrice)} = ${formatPrice(subtotal)}
                    </div>
                </div>
                <button class="order-item-delete-btn" onclick="removeOrderItem('${key}')" title="주문에서 제거">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
    }).join('');
}

// 주문 총액 업데이트  
function updateOrderTotal() {
    let total = 0;
    
    Object.entries(currentOrder).forEach(([key, quantity]) => {
        const [productId, optionName] = key.split('_');
        const product = products.find(p => p.id === parseInt(productId));
        if (product) {
            const option = product.options.find(opt => opt.name === optionName) || { name: optionName, price: 0 };
            const itemPrice = product.price + option.price;
            total += itemPrice * quantity;
        }
    });
    
    totalAmountEl.textContent = formatPrice(total);
}

// 주문 초기화
function clearOrder() {
    if (Object.keys(currentOrder).length === 0) {
        showNotification('초기화할 주문이 없습니다', 'warning');
        return;
    }
    
    if (confirm('현재 주문을 모두 초기화하시겠습니까?')) {
        currentOrder = {};
        selectedProductOptions = {}; // 선택된 옵션도 초기화
        renderOrderProductsGrid();
        updateOrderSummary();
        updateOrderTotal();
        showNotification('주문이 초기화되었습니다');
    }
}

// 주문 저장 (비동기)
async function saveOrder() {
    const orderItems = Object.entries(currentOrder).filter(([_, quantity]) => quantity > 0);
    
    if (orderItems.length === 0) {
        showNotification('주문할 상품을 선택해주세요', 'error');
        return;
    }
    
    showLoading();
    
    try {
        const orderData = [];
        let total = 0;
        
        // 주문 데이터 생성 (옵션 포함)
        orderItems.forEach(([key, quantity]) => {
            const [productId, optionName] = key.split('_');
            const product = products.find(p => p.id === parseInt(productId));
            if (product) {
                const option = product.options.find(opt => opt.name === optionName) || { name: optionName, price: 0 };
                const itemPrice = product.price + option.price;
                const subtotal = itemPrice * quantity;
                orderData.push({
                    productId: product.id,
                    productName: `${product.name} (${option.name})`,
                    price: itemPrice,
                    quantity: quantity,
                    subtotal: subtotal,
                    option: option.name,
                    optionPrice: option.price
                });
                total += subtotal;
            }
        });
        
        // 주문 저장
        const now = new Date();
        const order = {
            id: Date.now(),
            date: now.toISOString().split('T')[0],
            time: now.toTimeString().split(' ')[0], // HH:MM:SS 형식
            items: orderData,
            total: total,
            createdAt: now.toISOString()
        };
        
        // 데이터베이스에 저장
        const savedOrder = await saveOrderToDB(order);
        
        // 로컬 데이터에도 추가
        orders.unshift(savedOrder);
        
        // 주문 완료 처리
        currentOrder = {};
        selectedProductOptions = {}; // 선택된 옵션도 초기화
        renderOrderProductsGrid();
        updateOrderSummary();
        updateOrderTotal();
        updateDashboard();
        renderOrderHistory();
        
        // 성공 알림
        showNotification(`주문이 저장되었습니다! 총 ${formatPrice(total)}`, 'success');
        
        // 로컬 알림 (권한이 있는 경우)
        if (Notification.permission === 'granted') {
            showLocalNotification('구스커피 주문 완료!', `총 ${formatPrice(total)} 주문이 저장되었습니다.`);
        }
        
    } catch (error) {
        console.error('주문 저장 실패:', error);
        showNotification('주문 저장에 실패했습니다', 'error');
    } finally {
        hideLoading();
    }
}

// Supabase 상품 순서 업데이트 함수 (db.js에서 정의될 예정)
async function updateProductsOrder(products) {
    if (typeof updateProductOrder === 'function') {
        // 각 상품의 order 정보를 개별적으로 업데이트
        for (const product of products) {
            if (product.order !== undefined) {
                await updateProductOrder(product.id, product.order);
            }
        }
    } else {
        console.warn('updateProductOrder 함수가 정의되지 않았습니다. LocalStorage 모드로 동작합니다.');
        saveProducts();
    }
}

// === 주문 내역 관리 ===

// 주문 내역 렌더링
function renderOrderHistory(filteredOrders = null) {
    const ordersToShow = filteredOrders || orders;
    
    if (ordersToShow.length === 0) {
        ordersListEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-receipt"></i>
                <h3>주문 내역이 없습니다</h3>
                <p>새 주문을 등록해보세요</p>
            </div>
        `;
        return;
    }
    
    ordersListEl.innerHTML = ordersToShow.map(order => `
        <div class="order-card">
            <div class="order-header">
                <div class="order-date">${order.date || '날짜 없음'} ${order.time || '시간 없음'}</div>
                <div class="order-total-amount">${formatPrice(order.total)}</div>
            </div>
            <div class="order-items-list">
                ${(order.items || []).map(item => `
                    <div class="order-item-row">
                        <span>${item.productName || '상품명 없음'}</span>
                        <span>${item.quantity || 0}개 × ${formatPrice(item.price)} = ${formatPrice(item.subtotal)}</span>
                    </div>
                `).join('')}
            </div>
            <div class="order-actions-row">
                <button class="btn btn-secondary" onclick="editOrder(${order.id})">
                    <i class="fas fa-edit"></i> 수정
                </button>
                <button class="btn btn-danger" onclick="deleteOrder(${order.id})">
                    <i class="fas fa-trash"></i> 삭제
                </button>
            </div>
        </div>
    `).join('');
}

// 필터 상태 업데이트
function updateFilterStatus(message = '', isActive = false) {
    if (isActive && message) {
        filterStatusEl.innerHTML = `<i class="fas fa-filter"></i> ${message}`;
        filterStatusEl.classList.add('active');
    } else {
        filterStatusEl.classList.remove('active');
    }
}

// 날짜 범위로 주문 내역 필터링
function filterOrderByRange() {
    const startDate = startDateEl.value;
    const endDate = endDateEl.value;
    
    if (!startDate && !endDate) {
        renderOrderHistory();
        updateFilterStatus(); // 필터 상태 숨김
        return;
    }
    
    // 날짜 유효성 검사
    if (startDate && endDate && startDate > endDate) {
        showNotification('시작날짜가 종료날짜보다 늦을 수 없습니다', 'error');
        return;
    }
    
    const filteredOrders = orders.filter(order => {
        const orderDate = order.date;
        
        if (startDate && endDate) {
            return orderDate >= startDate && orderDate <= endDate;
        } else if (startDate) {
            return orderDate >= startDate;
        } else if (endDate) {
            return orderDate <= endDate;
        }
        
        return true;
    });
    
    renderOrderHistory(filteredOrders);
    
    // 필터 결과 알림
    const orderCount = filteredOrders.length;
    let message = '';
    
    if (startDate && endDate) {
        const startStr = new Date(startDate).toLocaleDateString('ko-KR');
        const endStr = new Date(endDate).toLocaleDateString('ko-KR');
        message = `${startStr} ~ ${endStr} 기간의 주문 ${orderCount}건을 표시합니다`;
    } else if (startDate) {
        const startStr = new Date(startDate).toLocaleDateString('ko-KR');
        message = `${startStr} 이후 주문 ${orderCount}건을 표시합니다`;
    } else if (endDate) {
        const endStr = new Date(endDate).toLocaleDateString('ko-KR');
        message = `${endStr} 이전 주문 ${orderCount}건을 표시합니다`;
    }
    
    if (orderCount === 0) {
        showNotification('선택한 기간에 주문 내역이 없습니다', 'warning');
        updateFilterStatus(message, true);
    } else {
        showNotification(message, 'success');
        updateFilterStatus(message, true);
    }
}

// 오늘 날짜로 필터 설정
function setTodayFilter() {
    const today = new Date().toISOString().split('T')[0];
    startDateEl.value = today;
    endDateEl.value = today;
    
    const todayOrders = orders.filter(order => order.date === today);
    renderOrderHistory(todayOrders);
    
    const orderCount = todayOrders.length;
    const message = `오늘 (${new Date().toLocaleDateString('ko-KR')}) 주문 ${orderCount}건`;
    
    if (orderCount === 0) {
        showNotification('오늘 주문 내역이 없습니다', 'warning');
    } else {
        showNotification(`오늘 주문 ${orderCount}건을 표시합니다`, 'success');
    }
    updateFilterStatus(message, true);
}

// 이번주 필터 설정
function setWeekFilter() {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = 일요일
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // 월요일
    
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6); // 일요일
    
    const startDate = monday.toISOString().split('T')[0];
    const endDate = sunday.toISOString().split('T')[0];
    
    startDateEl.value = startDate;
    endDateEl.value = endDate;
    
    const weekOrders = orders.filter(order => order.date >= startDate && order.date <= endDate);
    renderOrderHistory(weekOrders);
    
    const orderCount = weekOrders.length;
    const startStr = monday.toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'});
    const endStr = sunday.toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'});
    const message = `이번주 (${startStr} ~ ${endStr}) 주문 ${orderCount}건`;
    
    showNotification(`이번주 주문 ${orderCount}건을 표시합니다`, 'success');
    updateFilterStatus(message, true);
}

// 이번달 필터 설정
function setMonthFilter() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startDate = firstDay.toISOString().split('T')[0];
    const endDate = lastDay.toISOString().split('T')[0];
    
    startDateEl.value = startDate;
    endDateEl.value = endDate;
    
    const monthOrders = orders.filter(order => order.date >= startDate && order.date <= endDate);
    renderOrderHistory(monthOrders);
    
    const orderCount = monthOrders.length;
    const monthName = today.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' });
    const message = `${monthName} 주문 ${orderCount}건`;
    
    showNotification(`${monthName} 주문 ${orderCount}건을 표시합니다`, 'success');
    updateFilterStatus(message, true);
}

// 날짜 필터 해제 (전체 보기)
function clearDateFilter() {
    startDateEl.value = '';
    endDateEl.value = '';
    renderOrderHistory();
    showNotification('전체 주문 내역을 표시합니다', 'success');
    updateFilterStatus(); // 필터 상태 숨김
}

// 주문 수정 (간단한 구현)
function editOrder(orderId) {
    showNotification('주문 수정 기능은 개발 중입니다', 'warning');
}

// 주문 삭제 (비동기)
async function deleteOrder(orderId) {
    if (!confirm('정말로 이 주문을 삭제하시겠습니까?')) {
        return;
    }
    
    showLoading();
    
    try {
        if (window.USE_SUPABASE) {
            await deleteOrderFromDB(orderId);
        }
        
        // 로컬 데이터에서도 제거
        orders = orders.filter(order => order.id !== orderId);
        
        if (!window.USE_SUPABASE) {
            saveOrders();
        }
        
        renderOrderHistory();
        updateDashboard();
        showNotification('주문이 삭제되었습니다');
        
    } catch (error) {
        console.error('주문 삭제 실패:', error);
        showNotification('주문 삭제에 실패했습니다', 'error');
    } finally {
        hideLoading();
    }
}

// === 통계 기능 ===

// 통계 업데이트
function updateStatistics(period) {
    // 기간 버튼 활성화
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.period === period) {
            btn.classList.add('active');
        }
    });
    
    const stats = calculateStatistics(period);
    
    // 통계 요약 업데이트
    document.getElementById('total-revenue').textContent = formatPrice(stats.totalRevenue);
    document.getElementById('total-orders').textContent = `${stats.totalOrders}건`;
    document.getElementById('avg-order-amount').textContent = formatPrice(stats.avgOrderAmount);
    
    // 상품별 순위 업데이트
    renderProductRanking(stats.productRanking);
    
    // 차트 업데이트 (간단한 텍스트 차트)
    renderSalesChart(stats.salesData, period);
}

// 통계 계산
function calculateStatistics(period) {
    const now = new Date();
    let filteredOrders = [];
    
    if (period === 'daily') {
        const today = now.toISOString().split('T')[0];
        filteredOrders = orders.filter(order => order.date === today);
    } else if (period === 'monthly') {
        const thisMonth = now.toISOString().substring(0, 7); // YYYY-MM
        filteredOrders = orders.filter(order => order.date.startsWith(thisMonth));
    } else if (period === 'yearly') {
        const thisYear = now.getFullYear().toString();
        filteredOrders = orders.filter(order => order.date.startsWith(thisYear));
    }
    
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderAmount = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
    
    // 상품별 판매 통계
    const productStats = {};
    filteredOrders.forEach(order => {
        order.items.forEach(item => {
            if (!productStats[item.productName]) {
                productStats[item.productName] = { quantity: 0, revenue: 0 };
            }
            productStats[item.productName].quantity += item.quantity;
            productStats[item.productName].revenue += item.subtotal;
        });
    });
    
    const productRanking = Object.entries(productStats)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
    
    // 매출 데이터 (기간별)
    const salesData = generateSalesData(filteredOrders, period);
    
    return {
        totalRevenue,
        totalOrders,
        avgOrderAmount,
        productRanking,
        salesData
    };
}

// 매출 데이터 생성
function generateSalesData(orders, period) {
    // 간단한 구현 - 실제로는 더 복잡한 차트 라이브러리 사용 권장
    const salesByDate = {};
    
    orders.forEach(order => {
        let key;
        if (period === 'daily') {
            key = order.time.substring(0, 2) + '시'; // 시간대별
        } else if (period === 'monthly') {
            key = order.date.substring(8) + '일'; // 일별
        } else {
            key = order.date.substring(5, 7) + '월'; // 월별
        }
        
        if (!salesByDate[key]) {
            salesByDate[key] = 0;
        }
        salesByDate[key] += order.total;
    });
    
    return salesByDate;
}

// 상품별 순위 렌더링
function renderProductRanking(ranking) {
    const rankingListEl = document.getElementById('ranking-list');
    
    if (ranking.length === 0) {
        rankingListEl.innerHTML = `
            <div class="empty-state">
                <p>판매 데이터가 없습니다</p>
            </div>
        `;
        return;
    }
    
    rankingListEl.innerHTML = ranking.map((item, index) => `
        <div class="ranking-item">
            <div class="ranking-position">${index + 1}</div>
            <div class="ranking-product">${item.name}</div>
            <div class="ranking-stats">
                ${item.quantity}개 • ${formatPrice(item.revenue)}
            </div>
        </div>
    `).join('');
}

// 간단한 차트 렌더링
function renderSalesChart(salesData, period) {
    const chartEl = document.getElementById('sales-chart');
    const ctx = chartEl.getContext('2d');
    
    // 캔버스 초기화
    ctx.clearRect(0, 0, chartEl.width, chartEl.height);
    
    const entries = Object.entries(salesData);
    if (entries.length === 0) {
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#6c757d';
        ctx.fillText('데이터가 없습니다', chartEl.width / 2, chartEl.height / 2);
        return;
    }
    
    // 간단한 바 차트 그리기
    const maxValue = Math.max(...entries.map(([, value]) => value));
    const barWidth = chartEl.width / entries.length - 20;
    const barMaxHeight = chartEl.height - 60;
    
    ctx.fillStyle = '#8B4513';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    entries.forEach(([label, value], index) => {
        const x = index * (barWidth + 20) + 10;
        const barHeight = maxValue > 0 ? (value / maxValue) * barMaxHeight : 0;
        const y = chartEl.height - 40 - barHeight;
        
        // 바 그리기
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 레이블 그리기
        ctx.fillStyle = '#343a40';
        ctx.fillText(label, x + barWidth / 2, chartEl.height - 25);
        
        // 값 표시
        if (barHeight > 20) {
            ctx.fillStyle = '#ffffff';
            ctx.fillText(formatPrice(value), x + barWidth / 2, y + barHeight / 2);
        }
        
        ctx.fillStyle = '#8B4513';
    });
}

// === 드래그앤드롭 기능 ===

let draggedElement = null;
let draggedProductId = null;

// 드래그앤드롭 이벤트 리스너 추가
function addDragDropListeners() {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        card.addEventListener('dragstart', handleDragStart);
        card.addEventListener('dragover', handleDragOver);
        card.addEventListener('dragenter', handleDragEnter);
        card.addEventListener('dragleave', handleDragLeave);
        card.addEventListener('drop', handleDrop);
        card.addEventListener('dragend', handleDragEnd);
    });
}

function handleDragStart(e) {
    draggedElement = e.target;
    draggedProductId = parseInt(e.target.dataset.productId);
    
    e.target.style.opacity = '0.5';
    e.target.classList.add('dragging');
    
    // 드래그 데이터 설정
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.target.outerHTML);
    
    showNotification('상품을 드래그하여 순서를 변경하세요', 'success');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault(); // 드롭을 허용
    }
    
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    if (e.target !== draggedElement) {
        e.target.classList.add('drag-over');
    }
}

function handleDragLeave(e) {
    e.target.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    const dropTarget = e.target.closest('.product-card');
    if (draggedElement && dropTarget && draggedElement !== dropTarget) {
        const draggedIndex = parseInt(draggedElement.dataset.productIndex);
        const targetIndex = parseInt(dropTarget.dataset.productIndex);
        
        // 상품 순서 변경
        reorderProducts(draggedProductId, draggedIndex, targetIndex);
    }
    
    return false;
}

function handleDragEnd(e) {
    e.target.style.opacity = '';
    e.target.classList.remove('dragging');
    
    // 모든 드래그 관련 클래스 제거
    document.querySelectorAll('.product-card').forEach(card => {
        card.classList.remove('drag-over');
    });
    
    draggedElement = null;
    draggedProductId = null;
}

// 상품 순서 변경 함수
async function reorderProducts(productId, fromIndex, toIndex) {
    try {
        showLoading();
        
        // 현재 순서에 따라 정렬된 products 배열 생성
        const sortedProducts = [...products].sort((a, b) => {
            const orderA = a.order !== undefined ? a.order : a.id;
            const orderB = b.order !== undefined ? b.order : b.id;
            return orderA - orderB;
        });
        
        // 드래그된 상품 제거
        const [movedProduct] = sortedProducts.splice(fromIndex, 1);
        // 새 위치에 삽입
        sortedProducts.splice(toIndex, 0, movedProduct);
        
        // 새로운 order 값 할당
        sortedProducts.forEach((product, index) => {
            const originalProduct = products.find(p => p.id === product.id);
            if (originalProduct) {
                originalProduct.order = index;
            }
        });
        
        // 데이터 저장
        if (window.USE_SUPABASE) {
            // Supabase에 order 정보 업데이트
            await updateProductsOrder(products);
        } else {
            // LocalStorage에 저장
            saveProducts();
        }
        
        // UI 업데이트
        renderProducts();
        renderOrderProductsGrid(); // 주문 페이지의 상품 순서도 업데이트
        
        showNotification(`${movedProduct.name}의 순서가 변경되었습니다`, 'success');
        
    } catch (error) {
        console.error('상품 순서 변경 실패:', error);
        showNotification('순서 변경에 실패했습니다', 'error');
    } finally {
        hideLoading();
    }
}

// 유틸리티 함수들
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// === PWA 기능 ===

// PWA 설정
function setupPWA() {
    // 설치 프롬프트 이벤트 감지
    window.addEventListener('beforeinstallprompt', (e) => {
        console.log('PWA 설치 프롬프트 사용 가능');
        e.preventDefault();
        deferredPrompt = e;
        showInstallButton();
    });

    // PWA 설치 완료 이벤트
    window.addEventListener('appinstalled', (e) => {
        console.log('PWA가 설치되었습니다!');
        hideInstallButton();
        showNotification('구스커피 앱이 설치되었습니다! 홈 화면에서 바로 접근 가능합니다.', 'success');
    });

    // 온라인/오프라인 상태 감지
    window.addEventListener('online', () => {
        showNotification('인터넷에 연결되었습니다', 'success');
    });

    window.addEventListener('offline', () => {
        showNotification('오프라인 상태입니다. 데이터는 로컬에 저장됩니다.', 'warning');
    });

    // 이미 설치되었는지 확인
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        console.log('PWA 모드로 실행 중');
        hideInstallButton();
    }
}

// PWA 설치 버튼 표시
function showInstallButton() {
    // 설치 버튼이 없으면 생성
    let installButton = document.getElementById('install-button');
    if (!installButton) {
        installButton = document.createElement('button');
        installButton.id = 'install-button';
        installButton.className = 'btn btn-primary install-btn';
        installButton.innerHTML = '<i class="fas fa-download"></i> 앱 설치';
        installButton.onclick = installPWA;
        
        // 헤더에 설치 버튼 추가
        const header = document.querySelector('.header .container');
        if (header) {
            header.appendChild(installButton);
        }
    }
    installButton.style.display = 'flex';
}

// PWA 설치 버튼 숨기기
function hideInstallButton() {
    const installButton = document.getElementById('install-button');
    if (installButton) {
        installButton.style.display = 'none';
    }
}

// PWA 설치 실행
async function installPWA() {
    if (!deferredPrompt) {
        showNotification('설치가 현재 불가능합니다', 'warning');
        return;
    }

    try {
        // 설치 프롬프트 표시
        deferredPrompt.prompt();
        
        // 사용자의 응답 대기
        const result = await deferredPrompt.userChoice;
        
        if (result.outcome === 'accepted') {
            console.log('사용자가 PWA 설치를 승인했습니다');
            showNotification('앱을 설치하는 중입니다...', 'success');
        } else {
            console.log('사용자가 PWA 설치를 거부했습니다');
        }
        
        deferredPrompt = null;
        hideInstallButton();
    } catch (error) {
        console.error('PWA 설치 중 오류:', error);
        showNotification('설치 중 오류가 발생했습니다', 'error');
    }
}

// 오프라인 데이터 동기화
function syncOfflineData() {
    if (navigator.onLine) {
        const pendingData = localStorage.getItem('goosCoffeePendingSync');
        if (pendingData) {
            console.log('오프라인 데이터 동기화 시작');
            // 실제 서버가 있다면 여기서 데이터 전송
            localStorage.removeItem('goosCoffeePendingSync');
            showNotification('데이터 동기화 완료', 'success');
        }
    }
}

// 백그라운드 동기화 등록
function registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
            return registration.sync.register('background-sync');
        }).catch((error) => {
            console.log('백그라운드 동기화 등록 실패:', error);
        });
    }
}

// 푸시 알림 권한 요청
async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
            console.log('알림 권한이 허용되었습니다');
            return true;
        } else {
            console.log('알림 권한이 거부되었습니다');
            return false;
        }
    }
    return false;
}

// 로컬 알림 표시
function showLocalNotification(title, body, options = {}) {
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
            body: body,
            icon: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9IiM4QjQ1MTMiLz4KPHBhdGggZD0iTTk2IDQ4Qzc3LjIgNDggNjIgNjMuMiA2MiA4MkM2MiAxMDAuOCA3Ny4yIDExNiA5NiAxMTZDMTE0LjggMTE2IDEzMCAxMDAuOCAxMzAgODJDMTMwIDYzLjIgMTE0LjggNDggOTYgNDhaIiBmaWxsPSIjRkZFNEI1Ii8+CjxwYXRoIGQ9Ik03MiA5NkM3MiA5NiA4NCA4NCA5NiA4NEMxMDggODQgMTIwIDk2IDEyMCA5NkgxNDBWMTMySDUyVjk2SDcyWiIgZmlsbD0iI0QyQjQ4QyIvPgo8cGF0aCBkPSJNNTIgMTMySDU2VjE0NEg1MlYxMzJaTTEzNiAxMzJIMTQwVjE0NEgxMzZWMTMyWiIgZmlsbD0iIzM0M0EzOCIvPgo8L3N2Zz4K',
            badge: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTkyIiBoZWlnaHQ9IjE5MiIgdmlld0JveD0iMCAwIDE5MiAxOTIiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxOTIiIGhlaWdodD0iMTkyIiByeD0iMjQiIGZpbGw9IiM4QjQ1MTMiLz4KPHBhdGggZD0iTTk2IDQ4Qzc3LjIgNDggNjIgNjMuMiA2MiA4MkM2MiAxMDAuOCA3Ny4yIDExNiA5NiAxMTZDMTE0LjggMTE2IDEzMCAxMDAuOCAxMzAgODJDMTMwIDYzLjIgMTE0LjggNDggOTYgNDhaIiBmaWxsPSIjRkZFNEI1Ii8+CjxwYXRoIGQ9Ik03MiA5NkM3MiA5NiA4NCA4NCA5NiA4NEMxMDggODQgMTIwIDk2IDEyMCA5NkgxNDBWMTMySDUyVjk2SDcyWiIgZmlsbD0iI0QyQjQ4QyIvPgo8cGF0aCBkPSJNNTIgMTMySDU2VjE0NEg1MlYxMzJaTTEzNiAxMzJIMTQwVjE0NEgxMzZWMTMyWiIgZmlsbD0iIzM0M0EzOCIvPgo8L3N2Zz4K',
            vibrate: [200, 100, 200],
            tag: 'goos-coffee',
            ...options
        });

        notification.onclick = function() {
            window.focus();
            notification.close();
        };

        // 5초 후 자동 닫기
        setTimeout(() => {
            notification.close();
        }, 5000);
    }
}

