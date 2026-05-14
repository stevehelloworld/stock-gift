import React, { useState, useEffect, useMemo } from 'react';
import souvenirsData from './data/souvenirs.json';
import './App.css';

const App = () => {
  const [inventory, setInventory] = useState(() => {
    const saved = localStorage.getItem('stock_inventory');
    return saved ? JSON.parse(saved) : [];
  });
  const [newCode, setNewCode] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastSync, setLastSync] = useState(localStorage.getItem('last_sync_time') || new Date().toLocaleDateString());

  useEffect(() => {
    localStorage.setItem('stock_inventory', JSON.stringify(inventory));
  }, [inventory]);

  const triggerUpdate = async () => {
    setIsUpdating(true);
    try {
      const response = await fetch('http://localhost:3001/api/update', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        const now = new Date().toLocaleString();
        setLastSync(now);
        localStorage.setItem('last_sync_time', now);
        alert('資料更新成功！請重新整理頁面以查看最新數據。');
        window.location.reload();
      } else {
        alert('更新失敗：' + data.message);
      }
    } catch (error) {
      alert('無法連接到更新伺服器，請確保後端已啟動。');
    } finally {
      setIsUpdating(false);
    }
  };

  const addStock = (e) => {
    e.preventDefault();
    if (newCode && !inventory.includes(newCode)) {
      setInventory([...inventory, newCode.trim()]);
      setNewCode('');
    }
  };

  const removeStock = (code) => {
    setInventory(inventory.filter(item => item !== code));
  };

  const matchedSouvenirs = useMemo(() => {
    return souvenirsData.filter(s => inventory.includes(s.code));
  }, [inventory]);

  // Sort by meeting date or last buy date
  const sortedSouvenirs = useMemo(() => {
    return [...matchedSouvenirs].sort((a, b) => {
      return a.meetingDate.localeCompare(b.meetingDate);
    });
  }, [matchedSouvenirs]);

  const getOddLotText = (val) => {
    if (!val) return '未公佈';
    if (val === '是') return '✅ 零股可領 (需電子投票)';
    if (val === '否') return '❌ 零股不發放 (或需親自出席)';
    return val;
  };

  return (
    <div className="container">
      <header className="header animate-fade-in">
        <div className="header-top">
          <h1>股東會紀念品 <span>追蹤助手 2026</span></h1>
          <button 
            className={`sync-btn ${isUpdating ? 'loading' : ''}`} 
            onClick={triggerUpdate}
            disabled={isUpdating}
          >
            {isUpdating ? '同步中...' : '一鍵更新資訊'}
          </button>
        </div>
        <p>掌握您的股票庫存，不再錯過任何領取機會</p>
      </header>

      <main className="main-content">
        <section className="inventory-section glass-card animate-fade-in">
          <h2>股票庫存管理</h2>
          <form onSubmit={addStock} className="add-stock-form">
            <input 
              type="text" 
              placeholder="輸入股票代號 (如: 2330)" 
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
            />
            <button type="submit" className="primary">加入</button>
          </form>
          
          <div className="inventory-list">
            {inventory.length === 0 ? (
              <p className="empty-msg">目前沒有庫存，請輸入代號加入</p>
            ) : (
              inventory.map(code => {
                const stock = souvenirsData.find(s => s.code === code);
                return (
                  <div key={code} className="inventory-item">
                    <span className="code">{code}</span>
                    <span className="name">{stock ? stock.name : '未知名稱'}</span>
                    <button onClick={() => removeStock(code)} className="remove-btn">×</button>
                  </div>
                );
              })
            )}
          </div>
        </section>

        <section className="schedule-section">
          <div className="section-header">
            <h2>領取日程表</h2>
            <span className="count">{sortedSouvenirs.length} 個紀念品</span>
          </div>

          <div className="souvenir-grid">
            {sortedSouvenirs.length === 0 ? (
              <div className="no-results glass-card">
                <p>在左側加入股票代號後，這裡會顯示對應的紀念品資訊。</p>
                <p className="hint">若查無資料，可能是該公司尚未公布 2026 年紀念品資訊。</p>
              </div>
            ) : (
              sortedSouvenirs.map(s => (
                <div key={s.code} className="souvenir-card glass-card animate-fade-in">
                  <div className="card-top">
                    <span className="stock-info">{s.code} {s.name}</span>
                    <span className={`status-badge ${s.lastBuyDate.includes('已過') ? 'expired' : 'active'}`}>
                      {s.lastBuyDate}
                    </span>
                  </div>
                  <h3 className="gift-name">{s.souvenir}</h3>
                  <div className="details">
                    <div className="detail-item">
                      <span className="label">開會日期</span>
                      <span className="value">{s.meetingDate}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">領取地點</span>
                      <span className="value location" title={s.location}>{s.location}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">股務代理</span>
                      <span className="value">{s.agent} ({s.phone})</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">零股領取</span>
                      <span className={`value ${s.oddLot === '是' ? 'success' : s.oddLot === '否' ? 'danger' : ''}`}>
                        {getOddLotText(s.oddLot)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
        <section className="guide-section glass-card animate-fade-in">
          <h2>💡 零股領取攻略</h2>
          <div className="guide-content">
            <div className="guide-item">
              <h3>1. 確認領取資格</h3>
              <p>多數公司規定零股股東需<strong>「親自出席」</strong>或<strong>「參加電子投票」</strong>才具備領取資格。請查看卡片中的「零股領取」欄位。</p>
            </div>
            <div className="guide-item">
              <h3>2. 電子投票方式</h3>
              <p>在股東會前，前往「股東e票通」網站完成投票。投票成功後，通常可憑投票證明或開會通知書至指定地點領取。</p>
            </div>
            <div className="guide-item">
              <h3>3. 領取通知書</h3>
              <p>若未收到開會通知書，可於最後買進日後，去電該公司的「股務代理」要求補發，或詢問具體領取規則。</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>資料最後更新：{lastSync}</p>
        <p>資料來源：HiStock 嗨投資 (僅供參考，請以公司公告為準)</p>
      </footer>
    </div>
  );
};

export default App;
