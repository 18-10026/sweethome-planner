import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Layout, Layers, Plus, Trash2, Move, RotateCw, Download, Save, Undo, Redo, Image as ImageIcon, Maximize2 } from 'lucide-react';
import html2canvas from 'html2canvas';

export default function FloorPlanEditor({ selectedRoomId, onSelectRoom, rooms, setRooms, placedItems = [], onPlacedItemsChange }) {
  const [totalBuilding, setTotalBuilding] = useState({ width: 12000, length: 10000 });

  const [history, setHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const saveStateToHistory = useCallback((newRooms, newItems) => {
    const nextHistory = history.slice(0, historyIdx + 1);
    nextHistory.push({ rooms: newRooms, placedItems: newItems });
    setHistory(nextHistory);
    setHistoryIdx(nextHistory.length - 1);
  }, [history, historyIdx]);

  const handleUndo = useCallback(() => {
    if (historyIdx > 0) {
      const prev = history[historyIdx - 1];
      if (setRooms) setRooms(prev.rooms);
      if (onPlacedItemsChange) onPlacedItemsChange(prev.placedItems);
      setHistoryIdx(historyIdx - 1);
    }
  }, [history, historyIdx, setRooms, onPlacedItemsChange]);

  const handleRedo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      const next = history[historyIdx + 1];
      if (setRooms) setRooms(next.rooms);
      if (onPlacedItemsChange) onPlacedItemsChange(next.placedItems);
      setHistoryIdx(historyIdx + 1);
    }
  }, [history, historyIdx, setRooms, onPlacedItemsChange]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        handleRedo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const [dragTarget, setDragTarget] = useState(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [itemCategory, setItemCategory] = useState('FURNITURE');
  const [newItemName, setNewItemName] = useState('');
  const [newItemWidth, setNewItemWidth] = useState('1000');
  const [newItemLength, setNewItemLength] = useState('1000');
  const [newItemImageUrl, setNewItemImageUrl] = useState('');

  const activeRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];

  const handleBuildingSizeChange = (key, valMeter) => {
    const valMm = Math.max(1000, Number(valMeter) * 1000);
    setTotalBuilding(prev => ({ ...prev, [key]: valMm }));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemName.trim() || !activeRoom) {
      alert('제품명을 입력해 주세요.');
      return;
    }

    let color = '#f43f5e';
    if (itemCategory === 'DOOR') color = '#f59e0b';
    if (itemCategory === 'WINDOW') color = '#38bdf8';

    const newItem = {
      id: `item_${Date.now()}`,
      name: newItemName,
      category: itemCategory,
      roomId: activeRoom.id,
      widthMm: Number(newItemWidth) || 1000,
      lengthMm: Number(newItemLength) || 1000,
      xMm: 200,
      yMm: 200,
      rotation: 0,
      color,
      imageUrl: newItemImageUrl
    };

    const updatedItems = [...placedItems, newItem];
    if (onPlacedItemsChange) onPlacedItemsChange(updatedItems);
    saveStateToHistory(rooms, updatedItems);

    setNewItemName('');
    setNewItemImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setNewItemImageUrl(event.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleMouseMove = (e) => {
    if (!dragTarget || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const mouseY = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

    const mmPerPixelX = totalBuilding.width / rect.width;
    const mmPerPixelY = totalBuilding.length / rect.height;

    if (dragTarget.type === 'ROOM') {
      const targetRoom = rooms.find(r => r.id === dragTarget.id);
      if (!targetRoom) return;

      const roomWidthMm = targetRoom.width < 100 ? targetRoom.width * 1000 : targetRoom.width;
      const roomLengthMm = targetRoom.length < 100 ? targetRoom.length * 1000 : targetRoom.length;

      let newXMm = (mouseX - dragTarget.offsetX) * mmPerPixelX;
      let newYMm = (mouseY - dragTarget.offsetY) * mmPerPixelY;

      newXMm = Math.max(0, Math.min(newXMm, totalBuilding.width - roomWidthMm));
      newYMm = Math.max(0, Math.min(newYMm, totalBuilding.length - roomLengthMm));

      if (setRooms) {
        const updatedRooms = rooms.map(r => r.id === dragTarget.id ? { ...r, xMm: Math.round(newXMm), yMm: Math.round(newYMm) } : r);
        setRooms(updatedRooms);
      }
    } else if (dragTarget.type === 'ITEM') {
      const targetItem = placedItems.find(i => i.id === dragTarget.id);
      const parentRoom = rooms.find(r => r.id === targetItem?.roomId);
      if (!parentRoom || !targetItem) return;

      const roomWidthMm = parentRoom.width < 100 ? parentRoom.width * 1000 : parentRoom.width;
      const roomLengthMm = parentRoom.length < 100 ? parentRoom.length * 1000 : parentRoom.length;

      const parentXMm = parentRoom.xMm || 0;
      const parentYMm = parentRoom.yMm || 0;

      let currentMouseXMm = mouseX * mmPerPixelX;
      let currentMouseYMm = mouseY * mmPerPixelY;

      let itemXMm = currentMouseXMm - parentXMm - dragTarget.offsetX;
      let itemYMm = currentMouseYMm - parentYMm - dragTarget.offsetY;

      itemXMm = Math.max(0, Math.min(itemXMm, roomWidthMm - targetItem.widthMm));
      itemYMm = Math.max(0, Math.min(itemYMm, roomLengthMm - targetItem.lengthMm));

      if (onPlacedItemsChange) {
        onPlacedItemsChange(placedItems.map(i => i.id === dragTarget.id ? { ...i, xMm: Math.round(itemXMm), yMm: Math.round(itemYMm) } : i));
      }
    }
  };

  const handleMouseUp = () => {
    if (dragTarget) {
      saveStateToHistory(rooms, placedItems);
    }
    setDragTarget(null);
  };

  const handleRotateItem = (itemId) => {
    const updated = placedItems.map(i => i.id === itemId ? { ...i, rotation: (i.rotation + 90) % 360 } : i);
    if (onPlacedItemsChange) onPlacedItemsChange(updated);
    saveStateToHistory(rooms, updated);
  };

  const handleExportImage = async () => {
    if (!canvasRef.current) return;
    const canvas = await html2canvas(canvasRef.current, { backgroundColor: '#020617' });
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = `floor_plan_${Date.now()}.png`;
    link.click();
  };

  const handleSaveJson = () => {
    const data = JSON.stringify({ totalBuilding, rooms, placedItems }, null, 2);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    link.download = `floor_plan_data_${Date.now()}.json`;
    link.click();
  };

  return (
    <div 
      style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', padding: '28px', color: '#f8fafc', marginBottom: '24px', userSelect: 'none' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '22px', fontWeight: 'bold', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layout style={{ color: '#818cf8' }} /> 우리 신혼집 평면도
          </h3>
          <p style={{ fontSize: '14px', color: '#94a3b8', margin: 0 }}>
            집 전체 크기 변경, 방 및 아이템 드래그 이동 지원
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#020617', padding: '6px 12px', borderRadius: '8px', border: '1px solid #334155', fontSize: '12px' }}>
            <Maximize2 size={14} style={{ color: '#38bdf8' }} />
            <span>집 전체 크기:</span>
            <input
              type="number"
              step="0.5"
              value={totalBuilding.width / 1000}
              onChange={(e) => handleBuildingSizeChange('width', e.target.value)}
              style={{ width: '45px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px', padding: '2px 4px', textAlign: 'center' }}
            />m ×
            <input
              type="number"
              step="0.5"
              value={totalBuilding.length / 1000}
              onChange={(e) => handleBuildingSizeChange('length', e.target.value)}
              style={{ width: '45px', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', borderRadius: '4px', padding: '2px 4px', textAlign: 'center' }}
            />m
          </div>

          <button onClick={handleUndo} disabled={historyIdx <= 0} style={{ backgroundColor: '#334155', opacity: historyIdx <= 0 ? 0.5 : 1, color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Undo size={14} /> Undo
          </button>
          <button onClick={handleRedo} disabled={historyIdx >= history.length - 1} style={{ backgroundColor: '#334155', opacity: historyIdx >= history.length - 1 ? 0.5 : 1, color: '#fff', border: 'none', padding: '8px 12px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Redo size={14} /> Redo
          </button>
          <button onClick={handleExportImage} style={{ backgroundColor: '#10b981', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Download size={14} /> PNG
          </button>
          <button onClick={handleSaveJson} style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Save size={14} /> JSON
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        <div 
          ref={canvasRef}
          style={{ 
            backgroundColor: '#020617', border: '2px solid #1e293b', borderRadius: '12px', position: 'relative', minHeight: '580px', overflow: 'hidden', boxSizing: 'border-box',
            backgroundImage: 'radial-gradient(#334155 1px, transparent 1px)', backgroundSize: '20px 20px'
          }}
        >
          {rooms.map((room, index) => {
            const roomWidthMm = room.width < 100 ? room.width * 1000 : room.width;
            const roomLengthMm = room.length < 100 ? room.length * 1000 : room.length;

            let roomXMm = room.xMm !== undefined ? room.xMm : (index % 2) * 5500 + 300;
            let roomYMm = room.yMm !== undefined ? room.yMm : Math.floor(index / 2) * 4500 + 300;

            const leftPercent = (roomXMm / totalBuilding.width) * 100;
            const topPercent = (roomYMm / totalBuilding.length) * 100;
            const widthPercent = (roomWidthMm / totalBuilding.width) * 100;
            const heightPercent = (roomLengthMm / totalBuilding.length) * 100;
            const isSelected = activeRoom && activeRoom.id === room.id;

            return (
              <div
                key={room.id}
                style={{
                  position: 'absolute', top: `${topPercent}%`, left: `${leftPercent}%`, width: `${widthPercent}%`, height: `${heightPercent}%`,
                  backgroundColor: room.color || '#1e293b', border: `2px solid ${isSelected ? '#38bdf8' : (room.borderColor || '#6366f1')}`, borderRadius: '8px', boxSizing: 'border-box', overflow: 'hidden'
                }}
              >
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    if (onSelectRoom) onSelectRoom(room.id);
                    const rect = canvasRef.current.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    const currentRoomPixelX = (roomXMm / totalBuilding.width) * rect.width;
                    const currentRoomPixelY = (roomYMm / totalBuilding.length) * rect.height;

                    setDragTarget({
                      type: 'ROOM',
                      id: room.id,
                      offsetX: mouseX - currentRoomPixelX,
                      offsetY: mouseY - currentRoomPixelY
                    });
                  }}
                  style={{ backgroundColor: room.borderColor || '#475569', color: '#fff', padding: '4px 8px', fontSize: '11px', fontWeight: 'bold', cursor: 'grab', display: 'flex', justifyContent: 'space-between', userSelect: 'none' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Move size={12} /> {room.name}</span>
                  <span style={{ fontSize: '10px', opacity: 0.8 }}>{(roomWidthMm / 1000).toFixed(1)}m × {(roomLengthMm / 1000).toFixed(1)}m</span>
                </div>

                <div style={{ position: 'relative', width: '100%', height: 'calc(100% - 24px)', overflow: 'hidden' }}>
                  {placedItems.filter(item => item.roomId === room.id).map(item => {
                    const itemLeft = (item.xMm / roomWidthMm) * 100;
                    const itemTop = (item.yMm / roomLengthMm) * 100;
                    const itemWidth = (item.widthMm / roomWidthMm) * 100;
                    const itemHeight = (item.lengthMm / roomLengthMm) * 100;

                    return (
                      <div
                        key={item.id}
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          if (onSelectRoom) onSelectRoom(room.id);
                          const rect = canvasRef.current.getBoundingClientRect();
                          const mouseX = e.clientX - rect.left;
                          const mouseY = e.clientY - rect.top;
                          const mmPerPixelX = totalBuilding.width / rect.width;
                          const mmPerPixelY = totalBuilding.length / rect.height;

                          const currentMouseXMm = mouseX * mmPerPixelX;
                          const currentMouseYMm = mouseY * mmPerPixelY;

                          setDragTarget({
                            type: 'ITEM',
                            id: item.id,
                            offsetX: currentMouseXMm - roomXMm - item.xMm,
                            offsetY: currentMouseYMm - roomYMm - item.yMm
                          });
                        }}
                        style={{
                          position: 'absolute', top: `${itemTop}%`, left: `${itemLeft}%`, width: `${itemWidth}%`, height: `${itemHeight}%`,
                          backgroundColor: item.category === 'DOOR' ? 'rgba(245, 158, 11, 0.9)' : item.category === 'WINDOW' ? 'rgba(56, 189, 248, 0.9)' : 'rgba(15, 23, 42, 0.95)',
                          border: `1.5px solid ${item.color}`, borderRadius: '4px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', color: '#fff',
                          cursor: 'grab', transform: `rotate(${item.rotation || 0}deg)`, zIndex: 10, overflow: 'hidden'
                        }}
                      >
                        {item.imageUrl && (
                          <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '55%', objectFit: 'cover', opacity: 0.8 }} />
                        )}
                        <span style={{ fontWeight: 'bold', fontSize: '9px', textAlign: 'center', padding: '0 2px' }}>{item.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px' }}>
            <h4 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} /> [{activeRoom ? activeRoom.name : '방'}] 배치 및 사진 추가
            </h4>
            
            <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
              {['FURNITURE', 'DOOR', 'WINDOW'].map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setItemCategory(cat)}
                  style={{ flex: 1, backgroundColor: itemCategory === cat ? '#6366f1' : '#0f172a', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {cat === 'FURNITURE' ? '가구/가전' : cat === 'DOOR' ? '문' : '창문'}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddItem} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input
                type="text" placeholder="제품명 (예: LG 세탁기, 침대)" value={newItemName} onChange={(e) => setNewItemName(e.target.value)}
                style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" placeholder="가로(mm)" value={newItemWidth} onChange={(e) => setNewItemWidth(e.target.value)} style={{ width: '50%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }} />
                <input type="number" placeholder="세로(mm)" value={newItemLength} onChange={(e) => setNewItemLength(e.target.value)} style={{ width: '50%', backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '8px 10px', borderRadius: '6px', fontSize: '12px' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#94a3b8' }}>대표 사진 (URL 또는 파일 업로드)</label>
                <input
                  type="text" placeholder="https://... 이미지 링크" value={newItemImageUrl} onChange={(e) => setNewItemImageUrl(e.target.value)}
                  style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#fff', padding: '6px 10px', borderRadius: '6px', fontSize: '11px' }}
                />
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageFileUpload} style={{ fontSize: '11px', color: '#94a3b8' }} />
              </div>

              {newItemImageUrl && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: '#0f172a', padding: '6px', borderRadius: '6px' }}>
                  <img src={newItemImageUrl} alt="미리보기" style={{ width: '32px', height: '32px', borderRadius: '4px', objectFit: 'cover' }} />
                  <span style={{ fontSize: '11px', color: '#10b981' }}>대표 사진 첨부됨</span>
                </div>
              )}

              <button type="submit" style={{ backgroundColor: '#6366f1', color: '#fff', border: 'none', padding: '8px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', marginTop: '4px' }}>
                배치하기
              </button>
            </form>
          </div>

          <div style={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px', flex: 1 }}>
            <h4 style={{ fontSize: '13px', fontWeight: 'bold', margin: '0 0 10px 0', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={15} style={{ color: '#818cf8' }} /> [{activeRoom ? activeRoom.name : '선택된 방'}] 배치 항목 ({placedItems.filter(i => i.roomId === activeRoom?.id).length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {activeRoom && placedItems.filter(i => i.roomId === activeRoom.id).map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', padding: '6px 10px', borderRadius: '6px', border: '1px solid #1e293b', fontSize: '11px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} style={{ width: '24px', height: '24px', borderRadius: '4px', objectFit: 'cover' }} />
                    ) : (
                      <ImageIcon size={16} style={{ color: '#64748b' }} />
                    )}
                    <span>{item.name} ({item.widthMm}x{item.lengthMm})</span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => handleRotateItem(item.id)} style={{ backgroundColor: 'transparent', border: 'none', color: '#38bdf8', cursor: 'pointer' }}><RotateCw size={13} /></button>
                    <button onClick={() => {
                      const updated = placedItems.filter(i => i.id !== item.id);
                      if (onPlacedItemsChange) onPlacedItemsChange(updated);
                      saveStateToHistory(rooms, updated);
                    }} style={{ backgroundColor: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={13} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}