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

// 초기화
document.addEventListener('DOMContentLoaded', function() {
    loadData();
    updateCurrentDate();
    setupEventListeners();
    setupPWA();
    updateDashboard();
    renderProducts();
    renderOrderHistory();
    renderOrderProductsGrid(); // 새로운 타일 UI 렌더링
    updateOrderSummary(); // 주문 요약 업데이트
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
}

// 데이터 로드
function loadData() {
    products = JSON.parse(localStorage.getItem('goosCoffeeProducts')) || getDefaultProducts();
    orders = JSON.parse(localStorage.getItem('goosCoffeeOrders')) || [];
    
    // 기본 상품이 없으면 샘플 데이터 생성
    if (products.length === 0) {
        products = getDefaultProducts();
        saveProducts();
    }
}

// 기본 상품 데이터
function getDefaultProducts() {
    return [
        { id: 1, name: '에티오피아 예가체프', price: 15000 },
        { id: 2, name: '콜롬비아 수프리모', price: 16000 },
        { id: 3, name: '브라질 산토스', price: 14000 },
        { id: 4, name: '과테말라 안티구아', price: 17000 },
        { id: 5, name: '케냐 AA', price: 18000 }
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
    return price.toLocaleString('ko-KR') + '원';
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

// 상품 목록 렌더링
function renderProducts() {
    if (products.length === 0) {
        productsGridEl.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-coffee"></i>
                <h3>등록된 상품이 없습니다</h3>
                <p>새 상품을 추가해보세요</p>
            </div>
        `;
        return;
    }

    productsGridEl.innerHTML = products.map(product => `
        <div class="product-card">
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
    `).join('');
}

// 상품 추가/수정 모달 표시
function showAddProductModal() {
    document.getElementById('modal-title').textContent = '새 상품 추가';
    document.getElementById('product-id').value = '';
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';
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
        productModal.classList.add('active');
        document.getElementById('product-name').focus();
    }
}

// 상품 모달 닫기
function closeProductModal() {
    productModal.classList.remove('active');
    productForm.reset();
}

// 상품 저장
function saveProduct(event) {
    event.preventDefault();
    
    const id = document.getElementById('product-id').value;
    const name = document.getElementById('product-name').value.trim();
    const price = parseInt(document.getElementById('product-price').value);
    
    if (!name || !price || price <= 0) {
        showNotification('상품명과 가격을 올바르게 입력해주세요', 'error');
        return;
    }
    
    if (id) {
        // 수정
        const index = products.findIndex(p => p.id === parseInt(id));
        products[index] = { ...products[index], name, price };
        showNotification('상품이 수정되었습니다');
    } else {
        // 추가
        const newId = products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1;
        products.push({ id: newId, name, price });
        showNotification('새 상품이 추가되었습니다');
    }
    
    saveProducts();
    renderProducts();
    renderOrderProductsGrid(); // 주문 UI 업데이트
    closeProductModal();
}

// 상품 삭제
function deleteProduct(id) {
    if (confirm('정말로 이 상품을 삭제하시겠습니까?')) {
        // 현재 주문에서도 해당 상품 제거
        if (currentOrder[id]) {
            delete currentOrder[id];
        }
        
        products = products.filter(p => p.id !== id);
        saveProducts();
        renderProducts();
        renderOrderProductsGrid(); // 주문 UI 업데이트
        updateOrderSummary();
        updateOrderTotal();
        showNotification('상품이 삭제되었습니다');
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
                    <i class="fas fa-plus"></i> 상품 등록하러 가기
                </button>
            </div>
        `;
        return;
    }

    orderProductsGridEl.innerHTML = products.map(product => {
        const quantity = currentOrder[product.id] || 0;
        const subtotal = product.price * quantity;
        const isSelected = quantity > 0;

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
                
                <div class="product-tile-controls">
                    <div class="product-quantity-controls">
                        <button type="button" class="product-quantity-btn" onclick="updateProductQuantity(${product.id}, -1)" ${quantity <= 0 ? 'disabled' : ''}>
                            <i class="fas fa-minus"></i>
                        </button>
                        <div class="product-quantity-display">${quantity}</div>
                        <button type="button" class="product-quantity-btn" onclick="updateProductQuantity(${product.id}, 1)" ${quantity >= 99 ? 'disabled' : ''}>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                    <div class="product-subtotal">
                        ${quantity > 0 ? formatPrice(subtotal) : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// 상품 수량 업데이트
function updateProductQuantity(productId, change) {
    const currentQuantity = currentOrder[productId] || 0;
    let newQuantity = currentQuantity + change;
    
    // 수량 범위 제한
    if (newQuantity < 0) newQuantity = 0;
    if (newQuantity > 99) newQuantity = 99;
    
    // 수량이 0이면 주문에서 제거, 아니면 업데이트
    if (newQuantity === 0) {
        delete currentOrder[productId];
    } else {
        currentOrder[productId] = newQuantity;
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
    
    orderSummaryItemsEl.innerHTML = orderItems.map(([productId, quantity]) => {
        const product = products.find(p => p.id === parseInt(productId));
        if (!product) return '';
        
        const subtotal = product.price * quantity;
        return `
            <div class="order-summary-item">
                <div class="order-summary-name">${product.name}</div>
                <div class="order-summary-details">
                    ${quantity}개 × ${formatPrice(product.price)} = ${formatPrice(subtotal)}
                </div>
            </div>
        `;
    }).join('');
}

// 주문 총액 업데이트  
function updateOrderTotal() {
    let total = 0;
    
    Object.entries(currentOrder).forEach(([productId, quantity]) => {
        const product = products.find(p => p.id === parseInt(productId));
        if (product) {
            total += product.price * quantity;
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
        renderOrderProductsGrid();
        updateOrderSummary();
        updateOrderTotal();
        showNotification('주문이 초기화되었습니다');
    }
}

// 주문 저장
function saveOrder() {
    const orderItems = Object.entries(currentOrder).filter(([_, quantity]) => quantity > 0);
    
    if (orderItems.length === 0) {
        showNotification('주문할 상품을 선택해주세요', 'error');
        return;
    }
    
    const orderData = [];
    let total = 0;
    
    // 주문 데이터 생성
    orderItems.forEach(([productId, quantity]) => {
        const product = products.find(p => p.id === parseInt(productId));
        if (product) {
            const subtotal = product.price * quantity;
            orderData.push({
                productId: product.id,
                productName: product.name,
                price: product.price,
                quantity: quantity,
                subtotal: subtotal
            });
            total += subtotal;
        }
    });
    
    // 주문 저장
    const order = {
        id: Date.now(),
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('ko-KR'),
        items: orderData,
        total: total,
        createdAt: new Date().toISOString()
    };
    
    orders.unshift(order); // 최신 주문이 위에 오도록
    saveOrders();
    
    // 주문 완료 처리
    currentOrder = {};
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
                <div class="order-date">${order.date} ${order.time}</div>
                <div class="order-total-amount">${formatPrice(order.total)}</div>
            </div>
            <div class="order-items-list">
                ${order.items.map(item => `
                    <div class="order-item-row">
                        <span>${item.productName}</span>
                        <span>${item.quantity}개 × ${formatPrice(item.price)} = ${formatPrice(item.subtotal)}</span>
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

// 주문 삭제
function deleteOrder(orderId) {
    if (confirm('정말로 이 주문을 삭제하시겠습니까?')) {
        orders = orders.filter(order => order.id !== orderId);
        saveOrders();
        renderOrderHistory();
        updateDashboard();
        showNotification('주문이 삭제되었습니다');
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

