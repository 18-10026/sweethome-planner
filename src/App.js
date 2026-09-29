import React, { useState, useEffect } from 'react';
import FloorPlanEditor from './FloorPlanEditor';
import BudgetDashboard from './BudgetDashboard';
import ProductManager from './ProductManager';
import { supabase } from './supabaseClient';

const SITE_PASSWORD = "0327";
const DEFAULT_ROOMS = [
  { id: 'room_1', name: '거실', width: 5300, length: 5300, xMm: 500, yMm: 500, color: '#1e293b', borderColor: '#6366f1' }
];

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [inputPassword, setInputPassword] = useState('');

  const [selectedRoomId, setSelectedRoomId] = useState('room_1');
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [products, setProducts] = useState([]);
  const [totalBudget, setTotalBudget] = useState(30000000);
  const [placedItems, setPlacedItems] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // DB에서 데이터 로드
  const loadData = async () => {
    try {
      const { data, error } = await supabase
        .from('app_state')
        .select('*')
        .eq('id', 'current_products')
        .single();

      if (!error && data && data.data) {
        const d = data.data;
        if (d.rooms && Array.isArray(d.rooms)) setRooms(d.rooms);
        if (d.products && Array.isArray(d.products)) setProducts(d.products);
        if (d.totalBudget !== undefined) setTotalBudget(Number(d.totalBudget));
        if (d.placedItems && Array.isArray(d.placedItems)) setPlacedItems(d.placedItems);
      }
    } catch (e) {
      console.error('로드 에러:', e);
    } finally {
      setIsLoaded(true);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // DB 업데이트 함수
  const updateDB = async (newRooms, newProducts, newBudget, newItems) => {
    let nextRooms = rooms;
    if (newRooms !== undefined) {
      nextRooms = typeof newRooms === 'function' ? newRooms(rooms) : newRooms;
      setRooms(nextRooms);
    }

    let nextProducts = products;
    if (newProducts !== undefined) {
      nextProducts = typeof newProducts === 'function' ? newProducts(products) : newProducts;
      setProducts(nextProducts);
    }

    let nextBudget = totalBudget;
    if (newBudget !== undefined) {
      nextBudget = Number(newBudget);
      setTotalBudget(nextBudget);
    }

    let nextItems = placedItems;
    if (newItems !== undefined) {
      nextItems = typeof newItems === 'function' ? newItems(placedItems) : newItems;
      setPlacedItems(nextItems);
    }

    const payload = {
      rooms: nextRooms,
      products: nextProducts,
      totalBudget: nextBudget,
      placedItems: nextItems
    };

    const { error } = await supabase.from('app_state').upsert({
      id: 'current_products',
      data: payload
    });

    if (error) {
      console.error('❌ DB 저장 실패:', error);
    } else {
      console.log('💾 [DB 직통 저장 완료]', payload);
    }
  };

  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#020617', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'sans-serif' }}>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            if (inputPassword === SITE_PASSWORD) setIsAuthenticated(true);
            else alert('비밀번호가 올바르지 않습니다.');
          }}
          style={{ backgroundColor: '#0f172a', padding: '32px', borderRadius: '16px', border: '1px solid #1e293b', textAlign: 'center', width: '100%', maxWidth: '320px' }}
        >
          <h2 style={{ marginBottom: '16px', fontSize: '18px', color: '#fff' }}>🔒 신혼집 인테리어 플래너</h2>
          <input
            type="password"
            placeholder="비밀번호 입력"
            value={inputPassword}
            onChange={(e) => setInputPassword(e.target.value)}
            style={{ backgroundColor: '#020617', border: '1px solid #334155', color: '#fff', padding: '10px', borderRadius: '8px', marginBottom: '12px', width: '100%', boxSizing: 'border-box' }}
          />
          <button type="submit" style={{ width: '100%', backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            접속하기
          </button>
        </form>
      </div>
    );
  }

  if (!isLoaded) {
    return <div style={{ color: '#fff', padding: '50px', textAlign: 'center' }}>🔄 데이터 로딩 중...</div>;
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', color: '#f8fafc', padding: '32px', fontFamily: 'sans-serif', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <header style={{ borderBottom: '1px solid #1e293b', paddingBottom: '16px' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#ffffff' }}>
            💍 신혼집 가전·가구 비교 및 평면도 에디터
          </h1>
        </header>

        <BudgetDashboard 
          selectedRoomId={selectedRoomId} 
          totalBudget={totalBudget} 
          onBudgetChange={(b) => updateDB(undefined, undefined, b, undefined)}
          products={products}
        />

        <ProductManager 
          selectedRoomId={selectedRoomId} 
          onSelectRoom={(id) => setSelectedRoomId(id)} 
          rooms={rooms}
          onRoomsChange={(r) => updateDB(r, undefined, undefined, undefined)}
          products={products}
          onProductsChange={(p) => updateDB(undefined, p, undefined, undefined)}
        />

        <FloorPlanEditor 
          selectedRoomId={selectedRoomId} 
          onSelectRoom={(id) => setSelectedRoomId(id)} 
          rooms={rooms}
          setRooms={(r) => updateDB(r, undefined, undefined, undefined)}
          placedItems={placedItems}
          onPlacedItemsChange={(items) => updateDB(undefined, undefined, undefined, items)}
        />
      </div>
    </div>
  );
}