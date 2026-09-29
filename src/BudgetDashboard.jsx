import React from 'react';

export default function BudgetDashboard({ totalBudget, onBudgetChange, products = [] }) {
  // 상태값 조건 완벽 통일 (이모지 및 띄어쓰기 대응)
  const isPurchased = (status) => status === '구매완료' || status === '✅ 구매완료' || status === 'PURCHASED';
  const isCandidate = (status) => status === '후보군' || status === '⏱️ 후보군' || status === 'CANDIDATE';

  // 가격 계산 헬퍼
  const getPrice = (p) => {
    if (p.price !== undefined && p.price !== null) return Number(p.price) || 0;
    const selectedVendor = p.vendors?.find(v => v.isSelected || v.id === p.selectedVendorId) || p.vendors?.[0];
    return selectedVendor ? Number(selectedVendor.price) || 0 : 0;
  };

  // 1. 지출 확정 (구매완료)
  const purchasedProducts = products.filter(p => isPurchased(p.status));
  const confirmedSpent = purchasedProducts.reduce((sum, p) => sum + getPrice(p), 0);

  // 2. 구매 예정 (후보군)
  const candidateProducts = products.filter(p => isCandidate(p.status));
  const pendingSpent = candidateProducts.reduce((sum, p) => sum + getPrice(p), 0);

  // 3. 잔여 예산 및 총합계
  const remainingBudget = Number(totalBudget) - confirmedSpent;
  const totalProjectedSpent = confirmedSpent + pendingSpent;
  const progressPercent = totalBudget > 0 ? Math.min(Math.round((confirmedSpent / totalBudget) * 100), 100) : 0;

  // 카테고리별 지출 현황 (구매완료 항목 기준)
  const categorySpentMap = purchasedProducts.reduce((acc, p) => {
    const cat = p.mainCategory || '기타';
    acc[cat] = (acc[cat] || 0) + getPrice(p);
    return acc;
  }, {});

  return (
    <div style={{ backgroundColor: '#0d1322', border: '1px solid #1e293b', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 상단 타이틀 & 예산 입력 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>💼</span> 예산 관리 대시보드
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>총 설정 예산:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <input
              type="number"
              value={totalBudget}
              onChange={(e) => onBudgetChange(e.target.value)}
              style={{ backgroundColor: '#060913', border: '1px solid #334155', color: '#38bdf8', fontSize: '16px', fontWeight: 'bold', padding: '6px 12px', borderRadius: '8px', width: '140px', textAlign: 'right' }}
            />
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>원</span>
          </div>
        </div>
      </div>

      {/* 예산 집행률 바 */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>
          <span>예산 집행률 (확정 지출 기준)</span>
          <span style={{ color: '#38bdf8', fontWeight: 'bold' }}>{progressPercent}%</span>
        </div>
        <div style={{ width: '100%', height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPercent}%`, height: '100%', backgroundColor: '#6366f1', borderRadius: '4px', transition: 'width 0.3s ease' }} />
        </div>
      </div>

      {/* 4대 주요 지표 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        
        {/* 지출 확정 */}
        <div style={{ backgroundColor: '#060913', border: '1px solid #10b981', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 'bold', marginBottom: '4px' }}>
            ✅ 지출 확정 (구매완료)
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {confirmedSpent.toLocaleString()} 원
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            총 {purchasedProducts.length}개 품목
          </div>
        </div>

        {/* 구매 예정 */}
        <div style={{ backgroundColor: '#060913', border: '1px solid #f59e0b', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#f59e0b', fontWeight: 'bold', marginBottom: '4px' }}>
            ⏱️ 구매 예정 (후보군)
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {pendingSpent.toLocaleString()} 원
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            총 {candidateProducts.length}개 품목
          </div>
        </div>

        {/* 잔여 예산 */}
        <div style={{ backgroundColor: '#060913', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 'bold', marginBottom: '4px' }}>
            💰 잔여 예산
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: remainingBudget < 0 ? '#ef4444' : '#38bdf8' }}>
            {remainingBudget.toLocaleString()} 원
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            {remainingBudget < 0 ? '⚠️ 예산 초과' : '여유 예산'}
          </div>
        </div>

        {/* 총 합계 */}
        <div style={{ backgroundColor: '#060913', border: '1px solid #334155', borderRadius: '12px', padding: '16px' }}>
          <div style={{ fontSize: '12px', color: '#818cf8', fontWeight: 'bold', marginBottom: '4px' }}>
            🏷️ 총 합계 (확정+예정)
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#ffffff' }}>
            {totalProjectedSpent.toLocaleString()} 원
          </div>
          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
            전체 품목 구매 시 예상 금액
          </div>
        </div>

      </div>

      {/* 카테고리별 지출 현황 */}
      <div style={{ backgroundColor: '#060913', border: '1px solid #1e293b', borderRadius: '12px', padding: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#cbd5e1', marginBottom: '10px' }}>
          🏷️ 카테고리별 구매완료 지출 현황
        </div>
        {Object.keys(categorySpentMap).length === 0 ? (
          <div style={{ fontSize: '12px', color: '#64748b' }}>
            아직 구매완료된 항목이 없습니다. 제품 리스트에서 상태를 '구매완료'로 바꿔보세요.
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {Object.entries(categorySpentMap).map(([cat, sum]) => (
              <div key={cat} style={{ backgroundColor: '#0d1322', border: '1px solid #334155', padding: '8px 12px', borderRadius: '8px', fontSize: '12px' }}>
                <span style={{ color: '#94a3b8' }}>{cat}: </span>
                <span style={{ color: '#10b981', fontWeight: 'bold' }}>{sum.toLocaleString()} 원</span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}