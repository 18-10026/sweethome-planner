import React, { useState } from 'react';
import { Plus, Trash2, Tag, Image as ImageIcon, Upload, X, Edit2 } from 'lucide-react';

export default function ProductManager({ selectedRoomId, onSelectRoom, rooms, onRoomsChange, products, onProductsChange }) {
  // 방 추가 입력 폼
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomWidth, setNewRoomWidth] = useState('5300');
  const [newRoomLength, setNewRoomLength] = useState('5300');

  // 방 수정 상태 관리
  const [editingRoomId, setEditingRoomId] = useState(null);
  const [editRoomName, setEditRoomName] = useState('');
  const [editRoomWidth, setEditRoomWidth] = useState('');
  const [editRoomLength, setEditRoomLength] = useState('');

  // 필터링 상태 ('ALL' 또는 roomId)
  const [filterRoomId, setFilterRoomId] = useState('ALL');

  // 신규 제품 등록 폼 상태
  const [formRoomId, setFormRoomId] = useState(selectedRoomId || (rooms[0]?.id || ''));
  const [mainCategory, setMainCategory] = useState('가전');
  const [subCategory, setSubCategory] = useState('냉장고');
  const [brand, setBrand] = useState('');
  const [productName, setProductName] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [imageFileUrl, setImageFileUrl] = useState('');
  const [productUrl, setProductUrl] = useState('');
  const [status, setStatus] = useState('구매완료');

  // 모달 팝업 상태
  const [activeModalProdId, setActiveModalProdId] = useState(null);
  const [vendorName, setVendorName] = useState('');
  const [vendorPrice, setVendorPrice] = useState('');
  const [vendorMemo, setVendorMemo] = useState('');

  const modalProduct = products.find(p => p.id === activeModalProdId);

  // 가격 추출 헬퍼
  const getProductPrice = (p) => {
    if (p.price !== undefined && p.price !== null) return Number(p.price) || 0;
    const selectedVendor = p.vendors?.find(v => v.isSelected || v.id === p.selectedVendorId) || p.vendors?.[0];
    return selectedVendor ? Number(selectedVendor.price) || 0 : 0;
  };

  // 이미지 업로드
  const handleImageUpload = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('파일 크기가 너무 큽니다. (5MB 이하)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // 방 추가/삭제
  const handleAddRoom = (e) => {
    e.preventDefault();
    if (!newRoomName.trim()) return;
    const newRoom = {
      id: `room_${Date.now()}`,
      name: newRoomName.trim(),
      width: Number(newRoomWidth) || 4000,
      length: Number(newRoomLength) || 4000,
      xMm: (rooms.length % 2) * 5500 + 300,
      yMm: Math.floor(rooms.length / 2) * 4500 + 300,
      color: '#1e293b',
      borderColor: '#6366f1'
    };
    onRoomsChange([...rooms, newRoom]);
    onSelectRoom(newRoom.id);
    setNewRoomName('');
  };

  const handleDeleteRoom = (roomId) => {
    if (rooms.length <= 1) return alert('최소 1개 이상의 방이 필요합니다.');
    if (window.confirm('이 방과 관련된 리스트를 삭제하시겠습니까?')) {
      onRoomsChange(rooms.filter(r => r.id !== roomId));
      onProductsChange(products.filter(p => p.roomId !== roomId));
      if (selectedRoomId === roomId) onSelectRoom(rooms[0].id);
    }
  };

  // 방 수정 시작
  const startEditRoom = (room) => {
    setEditingRoomId(room.id);
    setEditRoomName(room.name);
    setEditRoomWidth(room.width);
    setEditRoomLength(room.length);
  };

  // 방 수정 저장
  const handleSaveRoomEdit = (roomId) => {
    if (!editRoomName.trim()) return alert('방 이름을 입력해주세요.');
    const updatedRooms = rooms.map(r => r.id === roomId ? {
      ...r,
      name: editRoomName.trim(),
      width: Number(editRoomWidth) || r.width,
      length: Number(editRoomLength) || r.length
    } : r);
    onRoomsChange(updatedRooms);
    setEditingRoomId(null);
  };

  // 제품 등록
  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!productName.trim()) return alert('제품명을 입력해주세요.');

    const initialPrice = Number(basePrice) || 0;
    const newProd = {
      id: `prod_${Date.now()}`,
      roomId: formRoomId || 'UNASSIGNED',
      mainCategory,
      subCategory,
      brand,
      name: productName,
      imageUrl: imageFileUrl,
      productUrl,
      price: initialPrice,
      status: status || '구매완료',
      selectedVendorId: 'v_default',
      vendors: [
        {
          id: 'v_default',
          name: '기본 등록가',
          price: initialPrice,
          memo: '기본 등록 금액',
          isSelected: true
        }
      ]
    };

    onProductsChange([...products, newProd]);
    setProductName('');
    setBrand('');
    setBasePrice('');
    setImageFileUrl('');
    setProductUrl('');
  };

  const handleDeleteProduct = (prodId) => {
    if (window.confirm('이 제품을 삭제하시겠습니까?')) {
      onProductsChange(products.filter(p => p.id !== prodId));
    }
  };

  // 상태 변경
  const handleStatusChange = (prodId, newStatus) => {
    const updatedProducts = products.map(p => p.id === prodId ? { ...p, status: newStatus } : p);
    onProductsChange(updatedProducts);
  };

  // 판매처 관리
  const handleAddVendor = (e) => {
    e.preventDefault();
    if (!vendorName.trim() || !modalProduct) return;

    const newVendor = {
      id: `v_${Date.now()}`,
      name: vendorName,
      price: Number(vendorPrice) || 0,
      memo: vendorMemo,
      isSelected: false
    };

    const updatedVendors = [...(modalProduct.vendors || []), newVendor];
    const updatedProducts = products.map(p => p.id === modalProduct.id ? { ...p, vendors: updatedVendors } : p);
    onProductsChange(updatedProducts);

    setVendorName('');
    setVendorPrice('');
    setVendorMemo('');
  };

  const handleSelectVendor = (prodId, vendorId) => {
    const updatedProducts = products.map(p => {
      if (p.id === prodId) {
        const updatedVendors = p.vendors.map(v => ({ ...v, isSelected: v.id === vendorId }));
        const selectedVendor = updatedVendors.find(v => v.id === vendorId);
        return {
          ...p,
          selectedVendorId: vendorId,
          vendors: updatedVendors,
          price: selectedVendor ? selectedVendor.price : p.price
        };
      }
      return p;
    });
    onProductsChange(updatedProducts);
  };

  const handleDeleteVendor = (prodId, vendorId) => {
    const updatedProducts = products.map(p => {
      if (p.id === prodId) {
        const updatedVendors = p.vendors.filter(v => v.id !== vendorId);
        return { ...p, vendors: updatedVendors };
      }
      return p;
    });
    onProductsChange(updatedProducts);
  };

  const handleUpdateProductDetail = (field, value) => {
    if (!modalProduct) return;
    const updatedProducts = products.map(p => p.id === modalProduct.id ? { ...p, [field]: value } : p);
    onProductsChange(updatedProducts);
  };

  const filteredProducts = products.filter(p => filterRoomId === 'ALL' || p.roomId === filterRoomId);

  return (
    <div style={{ backgroundColor: '#0d1322', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px' }}>
      
      {/* 1. 방 공간 목록 관리 & 수정 */}
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>현재 방 목록 (총 {rooms.length}개):</span>
          {rooms.map(r => {
            const isEditing = editingRoomId === r.id;
            return (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#1e293b', padding: '6px 10px', borderRadius: '20px', fontSize: '12px', border: '1px solid #334155' }}>
                {isEditing ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input 
                      type="text" 
                      value={editRoomName} 
                      onChange={e => setEditRoomName(e.target.value)} 
                      style={{ width: '70px', backgroundColor: '#060913', border: '1px solid #334155', color: '#fff', padding: '2px 4px', borderRadius: '4px', fontSize: '11px' }} 
                    />
                    <input 
                      type="number" 
                      value={editRoomWidth} 
                      onChange={e => setEditRoomWidth(e.target.value)} 
                      style={{ width: '55px', backgroundColor: '#060913', border: '1px solid #334155', color: '#fff', padding: '2px 4px', borderRadius: '4px', fontSize: '11px' }} 
                      placeholder="가로"
                    />
                    <span style={{ color: '#94a3b8' }}>×</span>
                    <input 
                      type="number" 
                      value={editRoomLength} 
                      onChange={e => setEditRoomLength(e.target.value)} 
                      style={{ width: '55px', backgroundColor: '#060913', border: '1px solid #334155', color: '#fff', padding: '2px 4px', borderRadius: '4px', fontSize: '11px' }} 
                      placeholder="세로"
                    />
                    <button onClick={() => handleSaveRoomEdit(r.id)} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold', cursor: 'pointer' }}>저장</button>
                    <button onClick={() => setEditingRoomId(null)} style={{ backgroundColor: '#64748b', color: '#fff', border: 'none', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>취소</button>
                  </div>
                ) : (
                  <>
                    <span style={{ fontWeight: 'bold', color: '#f8fafc' }}>{r.name}</span>
                    <span style={{ color: '#94a3b8' }}>({r.width} × {r.length}mm)</span>
                    <button onClick={() => startEditRoom(r)} style={{ backgroundColor: 'transparent', border: 'none', color: '#818cf8', cursor: 'pointer', padding: '0 2px', display: 'flex', alignItems: 'center' }} title="방 크기/이름 수정">
                      <Edit2 size={12} />
                    </button>
                    <button onClick={() => handleDeleteRoom(r.id)} style={{ backgroundColor: 'transparent', border: 'none', color: '#f87171', cursor: 'pointer', padding: 0 }} title="방 삭제">
                      <X size={12} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        <form onSubmit={handleAddRoom} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <input type="text" placeholder="방 이름 (예: 서재)" value={newRoomName} onChange={e => setNewRoomName(e.target.value)} style={{ backgroundColor: '#060913', border: '1px solid #334155', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '12px', width: '110px' }} />
          <input type="number" placeholder="가로(mm)" value={newRoomWidth} onChange={e => setNewRoomWidth(e.target.value)} style={{ backgroundColor: '#060913', border: '1px solid #334155', color: '#fff', padding: '6px 6px', borderRadius: '6px', fontSize: '12px', width: '70px' }} />
          <input type="number" placeholder="세로(mm)" value={newRoomLength} onChange={e => setNewRoomLength(e.target.value)} style={{ backgroundColor: '#060913', border: '1px solid #334155', color: '#fff', padding: '6px 6px', borderRadius: '6px', fontSize: '12px', width: '70px' }} />
          <button type="submit" style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>+ 방 추가</button>
        </form>
      </div>

      {/* 2. 제품 리스트 타이틀 및 필터 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🛍️</span> 가전 & 가구 비교 관리 리스트
        </h3>

        <div style={{ display: 'flex', backgroundColor: '#060913', padding: '4px', borderRadius: '8px', border: '1px solid #1e293b' }}>
          <button onClick={() => setFilterRoomId('ALL')} style={{ backgroundColor: filterRoomId === 'ALL' ? '#4f46e5' : 'transparent', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>전체</button>
          {rooms.map(r => (
            <button key={r.id} onClick={() => setFilterRoomId(r.id)} style={{ backgroundColor: filterRoomId === r.id ? '#4f46e5' : 'transparent', color: '#fff', border: 'none', padding: '6px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer' }}>{r.name}</button>
          ))}
        </div>
      </div>

      {/* 3. 신규 제품 등록 폼 */}
      <form onSubmit={handleAddProduct} style={{ backgroundColor: '#060913', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.2fr 1fr 1fr 1.2fr 2fr 1.5fr', gap: '8px' }}>
          <select value={formRoomId} onChange={e => setFormRoomId(e.target.value)} style={{ backgroundColor: '#0d1322', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}>
            <option value="UNASSIGNED">📍 공간 미지정</option>
            {rooms.map(r => <option key={r.id} value={r.id}>📍 {r.name}</option>)}
          </select>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ backgroundColor: '#0d1322', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}>
            <option value="구매완료">✅ 구매완료</option>
            <option value="후보군">⏱️ 후보군</option>
            <option value="제외">🚫 제외</option>
          </select>
          <select value={mainCategory} onChange={e => setMainCategory(e.target.value)} style={{ backgroundColor: '#0d1322', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }}>
            <option value="가전">가전</option>
            <option value="가구">가구</option>
            <option value="기타">기타</option>
          </select>
          <input type="text" placeholder="세부분류" value={subCategory} onChange={e => setSubCategory(e.target.value)} style={{ backgroundColor: '#0d1322', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }} />
          <input type="text" placeholder="브랜드" value={brand} onChange={e => setBrand(e.target.value)} style={{ backgroundColor: '#0d1322', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }} />
          <input type="text" placeholder="제품명 *" value={productName} onChange={e => setProductName(e.target.value)} style={{ backgroundColor: '#0d1322', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }} />
          <input type="number" placeholder="기준 가격(원) *" value={basePrice} onChange={e => setBasePrice(e.target.value)} style={{ backgroundColor: '#0d1322', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0d1322', border: '1px dashed #334155', padding: '6px 12px', borderRadius: '6px' }}>
            <Upload size={14} style={{ color: '#818cf8' }} />
            <label style={{ fontSize: '12px', color: '#cbd5e1', cursor: 'pointer', flex: 1 }}>
              {imageFileUrl ? '📷 이미지 등록됨 (클릭 시 변경)' : '📷 이미지 파일 첨부하기'}
              <input type="file" accept="image/*" onChange={e => handleImageUpload(e, setImageFileUrl)} style={{ display: 'none' }} />
            </label>
            {imageFileUrl && <img src={imageFileUrl} alt="preview" style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />}
          </div>

          <input type="text" placeholder="구매/상세 페이지 URL (링크)" value={productUrl} onChange={e => setProductUrl(e.target.value)} style={{ backgroundColor: '#0d1322', border: '1px solid #334155', color: '#fff', padding: '8px', borderRadius: '6px', fontSize: '12px' }} />
          
          <button type="submit" style={{ backgroundColor: '#4f46e5', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Plus size={14} /> 신규 등록
          </button>
        </div>
      </form>

      {/* 4. 제품 목록 테이블 */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b', fontSize: '12px' }}>
              <th style={{ padding: '12px' }}>공간</th>
              <th style={{ padding: '12px' }}>상태</th>
              <th style={{ padding: '12px' }}>분류</th>
              <th style={{ padding: '12px' }}>사진</th>
              <th style={{ padding: '12px' }}>브랜드</th>
              <th style={{ padding: '12px' }}>제품명 (클릭 시 상세)</th>
              <th style={{ padding: '12px' }}>비교 업체</th>
              <th style={{ padding: '12px', textAlign: 'right' }}>선택/최저가</th>
              <th style={{ padding: '12px', textAlign: 'center' }}>삭제</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map(p => {
              const room = rooms.find(r => r.id === p.roomId);
              const displayPrice = getProductPrice(p);
              const currentStatus = p.status || '구매완료';

              return (
                <tr key={p.id} style={{ borderBottom: '1px solid #1e293b', opacity: currentStatus === '제외' ? 0.4 : 1 }}>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: '#1e293b', color: '#94a3b8', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                      {room ? room.name : '미지정'}
                    </span>
                  </td>

                  <td style={{ padding: '12px' }}>
                    <select
                      value={currentStatus}
                      onChange={e => handleStatusChange(p.id, e.target.value)}
                      style={{
                        backgroundColor: '#060913',
                        border: `1px solid ${currentStatus === '구매완료' ? '#10b981' : currentStatus === '제외' ? '#64748b' : '#f59e0b'}`,
                        color: currentStatus === '구매완료' ? '#10b981' : currentStatus === '제외' ? '#94a3b8' : '#f59e0b',
                        borderRadius: '12px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="구매완료">✅ 구매완료</option>
                      <option value="후보군">⏱️ 후보군</option>
                      <option value="제외">🚫 제외</option>
                    </select>
                  </td>

                  <td style={{ padding: '12px', color: '#818cf8' }}>{p.mainCategory} → {p.subCategory}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '6px', backgroundColor: '#1e293b', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        <ImageIcon size={18} style={{ color: '#64748b' }} />
                      )}
                    </div>
                  </td>
                  <td style={{ padding: '12px', color: '#cbd5e1' }}>{p.brand || '-'}</td>
                  <td style={{ padding: '12px' }}>
                    <button onClick={() => setActiveModalProdId(p.id)} style={{ backgroundColor: 'transparent', border: 'none', color: '#f8fafc', fontWeight: 'bold', fontSize: '13px', cursor: 'pointer', textAlign: 'left', padding: 0 }}>
                      {p.name} <Tag size={12} style={{ color: '#818cf8', display: 'inline', marginLeft: '4px' }} />
                    </button>
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ backgroundColor: '#060913', border: '1px solid #334155', color: '#38bdf8', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold' }}>
                      {p.vendors?.length || 1} 곳 비교중
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 'bold', color: '#38bdf8', fontSize: '14px' }}>
                    {displayPrice.toLocaleString()} 원
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <button onClick={() => handleDeleteProduct(p.id)} style={{ backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 5. 상세 모달 */}
      {modalProduct && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ backgroundColor: '#0d1322', border: '1px solid #1e293b', borderRadius: '16px', width: '100%', maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', color: '#fff', position: 'relative' }}>
            
            <button onClick={() => setActiveModalProdId(null)} style={{ position: 'absolute', top: '20px', right: '20px', backgroundColor: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>
              <X size={20} />
            </button>

            <div style={{ display: 'flex', gap: '20px', marginBottom: '24px' }}>
              <div style={{ width: '100px', height: '100px', borderRadius: '12px', backgroundColor: '#1e293b', overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {modalProduct.imageUrl ? (
                  <img src={modalProduct.imageUrl} alt={modalProduct.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: '#64748b', fontSize: '11px' }}>사진 없음</div>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span style={{ backgroundColor: '#4f46e5', color: '#fff', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                    {modalProduct.brand || '브랜드'}
                  </span>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{modalProduct.mainCategory} → {modalProduct.subCategory}</span>
                </div>

                <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '2px 0' }}>{modalProduct.name}</h2>

                <div>
                  <label style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Upload size={12} /> 이미지 파일 첨부/교체
                    <input type="file" accept="image/*" onChange={e => handleImageUpload(e, url => handleUpdateProductDetail('imageUrl', url))} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            </div>

            {/* 판매처 가격 비교 */}
            <div style={{ backgroundColor: '#060913', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#38bdf8' }}>🏆 판매처별 가격 비교</h4>
              
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #1e293b', color: '#64748b' }}>
                    <th style={{ padding: '8px', width: '30px' }}>선택</th>
                    <th style={{ padding: '8px' }}>판매처</th>
                    <th style={{ padding: '8px' }}>판매가</th>
                    <th style={{ padding: '8px' }}>메모</th>
                    <th style={{ padding: '8px', width: '30px' }}>삭제</th>
                  </tr>
                </thead>
                <tbody>
                  {modalProduct.vendors?.map(v => {
                    const isSelected = v.isSelected || v.id === modalProduct.selectedVendorId;
                    return (
                      <tr key={v.id} style={{ borderBottom: '1px solid #0d1322', backgroundColor: isSelected ? 'rgba(79, 70, 229, 0.15)' : 'transparent' }}>
                        <td style={{ padding: '8px' }}>
                          <input type="radio" name={`v_${modalProduct.id}`} checked={isSelected} onChange={() => handleSelectVendor(modalProduct.id, v.id)} style={{ accentColor: '#4f46e5' }} />
                        </td>
                        <td style={{ padding: '8px', fontWeight: 'bold' }}>{v.name}</td>
                        <td style={{ padding: '8px', color: '#10b981', fontWeight: 'bold' }}>{Number(v.price).toLocaleString()} 원</td>
                        <td style={{ padding: '8px', color: '#cbd5e1' }}>{v.memo || '-'}</td>
                        <td style={{ padding: '8px' }}>
                          <button onClick={() => handleDeleteVendor(modalProduct.id, v.id)} style={{ backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <form onSubmit={handleAddVendor} style={{ marginTop: '12px', display: 'flex', gap: '6px' }}>
                <input type="text" placeholder="판매처명" value={vendorName} onChange={e => setVendorName(e.target.value)} style={{ backgroundColor: '#0d1322', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '11px', flex: 1 }} />
                <input type="number" placeholder="판매가" value={vendorPrice} onChange={e => setVendorPrice(e.target.value)} style={{ backgroundColor: '#0d1322', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '11px', width: '90px' }} />
                <input type="text" placeholder="메모" value={vendorMemo} onChange={e => setVendorMemo(e.target.value)} style={{ backgroundColor: '#0d1322', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '4px', fontSize: '11px', flex: 1.5 }} />
                <button type="submit" style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>+ 추가</button>
              </form>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8' }}>구매/상세 URL</label>
                <input type="text" value={modalProduct.productUrl || ''} onChange={e => handleUpdateProductDetail('productUrl', e.target.value)} style={{ width: '100%', backgroundColor: '#060913', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '11px', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#94a3b8' }}>실물 규격 (mm)</label>
                <input type="text" value={modalProduct.dimensions || ''} onChange={e => handleUpdateProductDetail('dimensions', e.target.value)} style={{ width: '100%', backgroundColor: '#060913', border: '1px solid #334155', color: '#fff', padding: '6px', borderRadius: '6px', fontSize: '11px', boxSizing: 'border-box' }} />
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}