// 데이터베이스 관련 함수들
// LocalStorage와 Supabase를 모두 지원

// === 상품 관련 함수 ===

async function loadProducts() {
    if (window.USE_SUPABASE) {
        try {
            const { data, error } = await window.supabase
                .from('products')
                .select('*')
                .order('order_index', { ascending: true, nullsLast: true })
                .order('created_at', { ascending: true });
            
            if (error) throw error;
            
            // Supabase 데이터를 로컬 형식으로 변환
            return (data || []).map(product => ({
                id: product.id,
                name: product.name,
                price: product.price,
                order: product.order_index !== null ? product.order_index : product.id
            }));
        } catch (error) {
            console.error('Supabase 상품 로드 실패:', error);
            showNotification('서버에서 상품을 불러올 수 없습니다. 잠시 후 다시 시도해주세요.', 'error');
            return [];
        }
    } else {
        // LocalStorage 사용
        return JSON.parse(localStorage.getItem('goosCoffeeProducts')) || [];
    }
}

async function saveProducts(products) {
    if (window.USE_SUPABASE) {
        // Supabase는 개별 상품 CRUD로 관리되므로 이 함수는 LocalStorage에서만 사용
        console.log('Supabase 모드에서는 개별 상품 저장 함수를 사용해주세요');
        return;
    } else {
        localStorage.setItem('goosCoffeeProducts', JSON.stringify(products));
    }
}

async function addProduct(name, price) {
    if (window.USE_SUPABASE) {
        try {
            // 현재 최대 order_index 찾기
            const { data: maxOrderData } = await window.supabase
                .from('products')
                .select('order_index')
                .order('order_index', { ascending: false, nullsLast: false })
                .limit(1);
            
            const maxOrder = maxOrderData && maxOrderData[0] ? maxOrderData[0].order_index : -1;
            const newOrder = maxOrder !== null ? maxOrder + 1 : 0;
            
            const { data, error } = await window.supabase
                .from('products')
                .insert([{ 
                    name, 
                    price, 
                    order_index: newOrder 
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            // 로컬 형식으로 변환하여 반환
            return {
                id: data.id,
                name: data.name,
                price: data.price,
                order: data.order_index
            };
        } catch (error) {
            console.error('상품 추가 실패:', error);
            showNotification('상품 추가에 실패했습니다', 'error');
            throw error;
        }
    } else {
        // LocalStorage 방식은 기존 코드에서 처리
        return null;
    }
}

async function updateProduct(id, name, price) {
    if (window.USE_SUPABASE) {
        try {
            const { data, error } = await window.supabase
                .from('products')
                .update({ name, price, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('상품 수정 실패:', error);
            showNotification('상품 수정에 실패했습니다', 'error');
            throw error;
        }
    } else {
        return null;
    }
}

async function deleteProductFromDB(id) {
    if (window.USE_SUPABASE) {
        try {
            const { error } = await window.supabase
                .from('products')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('상품 삭제 실패:', error);
            showNotification('상품 삭제에 실패했습니다', 'error');
            throw error;
        }
    } else {
        return null;
    }
}

async function updateProductOrder(id, order) {
    if (window.USE_SUPABASE) {
        try {
            const { data, error } = await window.supabase
                .from('products')
                .update({ 
                    order_index: order,
                    updated_at: new Date().toISOString() 
                })
                .eq('id', id)
                .select()
                .single();
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('상품 순서 업데이트 실패:', error);
            // 에러 시 로그만 기록하고 계속 진행 (LocalStorage 폴백)
            console.warn('Supabase 상품 순서 업데이트 실패, LocalStorage로 폴백');
            return null;
        }
    } else {
        return null;
    }
}

// === 주문 관련 함수 ===

async function loadOrders() {
    console.log('💾 loadOrders 호출됨, USE_SUPABASE:', window.USE_SUPABASE);
    
    // Supabase 모드 확인
    if (window.USE_SUPABASE && window.supabase) {
        try {
            console.log('🔄 Supabase 모드로 주문 로드 시도...');
            
            const { data, error } = await window.supabase
                .from('orders')
                .select(`
                    *,
                    order_items (
                        id,
                        product_id,
                        product_name,
                        quantity,
                        unit_price,
                        subtotal
                    )
                `)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            console.log('✅ Supabase 주문 로드 성공!');
            
            // 데이터 포맷을 기존 구조에 맞게 변환 (안전성 강화)
            return data.map(order => ({
                id: order.id,
                date: order.order_date || new Date().toISOString().split('T')[0],
                time: order.order_time || new Date().toTimeString().split(' ')[0],
                total: Number(order.total_amount) || 0,
                createdAt: order.created_at || new Date().toISOString(),
                items: (order.order_items || []).map(item => ({
                    productId: Number(item.product_id) || 0,
                    productName: item.product_name || '알 수 없는 상품',
                    price: Number(item.unit_price) || 0,
                    quantity: Number(item.quantity) || 0,
                    subtotal: Number(item.subtotal) || 0
                }))
            }));
        } catch (error) {
            console.error('❌ Supabase 주문 로드 실패:', error);
            // Supabase 실패시 LocalStorage로 폴백
            console.log('🔄 LocalStorage 폴백 모드로 전환...');
            window.USE_SUPABASE = false;
        }
    }
    
    // LocalStorage 모드
    try {
        console.log('💽 LocalStorage 모드로 주문 로드...');
        const orders = JSON.parse(localStorage.getItem('goosCoffeeOrders')) || [];
        console.log('✅ LocalStorage 주문 로드 성공:', orders.length, '건');
        return orders;
    } catch (error) {
        console.error('❌ LocalStorage 주문 로드 실패:', error);
        return [];
    }
}

async function saveOrderToDB(orderData) {
    console.log('💾 saveOrderToDB 호출됨, USE_SUPABASE:', window.USE_SUPABASE);
    
    // Supabase 모드 확인
    if (window.USE_SUPABASE && window.supabase) {
        try {
            console.log('🔄 Supabase 모드로 주문 저장 시도...');
            
            // 1. 주문 생성
            const { data: order, error: orderError } = await window.supabase
                .from('orders')
                .insert([{
                    order_date: orderData.date,
                    order_time: orderData.time,
                    total_amount: orderData.total
                }])
                .select()
                .single();
            
            if (orderError) throw orderError;
            
            // 2. 주문 상세 아이템들 생성
            const orderItems = orderData.items.map(item => ({
                order_id: order.id,
                product_id: item.productId,
                product_name: item.productName,
                quantity: item.quantity,
                unit_price: item.price,
                subtotal: item.subtotal
            }));
            
            const { error: itemsError } = await window.supabase
                .from('order_items')
                .insert(orderItems);
            
            if (itemsError) throw itemsError;
            
            console.log('✅ Supabase 주문 저장 성공!');
            
            // 일관된 데이터 구조로 반환 (script.js에서 기대하는 형태)
            return {
                id: order.id,
                date: order.order_date || orderData.date,
                time: order.order_time || orderData.time,
                total: Number(order.total_amount) || Number(orderData.total) || 0,
                createdAt: order.created_at || orderData.createdAt,
                items: orderData.items || []
            };
        } catch (error) {
            console.error('❌ Supabase 주문 저장 실패:', error);
            // Supabase 실패시 LocalStorage로 폴백
            console.log('🔄 LocalStorage 폴백 모드로 전환...');
            window.USE_SUPABASE = false;
        }
    }
    
    // LocalStorage 모드 (기본값 또는 폴백)
    try {
        console.log('💽 LocalStorage 모드로 주문 저장...');
        const orders = JSON.parse(localStorage.getItem('goosCoffeeOrders')) || [];
        orders.unshift(orderData);
        localStorage.setItem('goosCoffeeOrders', JSON.stringify(orders));
        console.log('✅ LocalStorage 주문 저장 성공!');
        return orderData;
    } catch (error) {
        console.error('❌ LocalStorage 주문 저장 실패:', error);
        throw error;
    }
}

async function deleteOrderFromDB(orderId) {
    if (window.USE_SUPABASE) {
        try {
            // order_items는 CASCADE 삭제되므로 orders만 삭제하면 됨
            const { error } = await window.supabase
                .from('orders')
                .delete()
                .eq('id', orderId);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('주문 삭제 실패:', error);
            showNotification('주문 삭제에 실패했습니다', 'error');
            throw error;
        }
    } else {
        return null;
    }
}

// === 통계 관련 함수 ===

async function getOrderStatistics(startDate, endDate) {
    if (window.USE_SUPABASE) {
        try {
            const query = window.supabase
                .from('orders')
                .select(`
                    id,
                    order_date,
                    total_amount,
                    order_items (
                        product_name,
                        quantity,
                        subtotal
                    )
                `);
            
            if (startDate) query = query.gte('order_date', startDate);
            if (endDate) query = query.lte('order_date', endDate);
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('통계 데이터 로드 실패:', error);
            return [];
        }
    } else {
        // LocalStorage는 기존 방식 사용
        return [];
    }
}

// === 연결 테스트 함수 ===

async function testSupabaseConnection() {
    if (!window.USE_SUPABASE) {
        console.log('🔧 LocalStorage 모드로 실행 중');
        return false;
    }
    
    try {
        const { data, error } = await window.supabase
            .from('products')
            .select('id')
            .limit(1);
        
        if (error) throw error;
        
        console.log('✅ Supabase 연결 성공!');
        showNotification('서버에 성공적으로 연결되었습니다!', 'success');
        return true;
    } catch (error) {
        console.error('❌ Supabase 연결 실패:', error);
        showNotification('서버 연결에 실패했습니다. 로컬 모드로 실행됩니다.', 'warning');
        return false;
    }
}
