import { useEffect } from 'react';
import { supabase } from './supabaseClient';

export function useSupabaseSync() {
  useEffect(() => {
    // 1. 앱 켜질 때 Supabase에서 최신 데이터 불러와서 localStorage에 채우기
    const loadFromSupabase = async () => {
      const { data, error } = await supabase.from('products').select('*');
      if (!error && data && data.length > 0) {
        // DB에서 가져온 json 전체 저장
        const formattedData = data.map(item => item.content || item);
        localStorage.setItem('interior_products_data', JSON.stringify(formattedData));
        window.dispatchEvent(new Event('storage'));
      }
    };

    loadFromSupabase();

    // 2. ProductManager에서 localStorage가 바뀌면 Supabase DB로 자동 업로드
    const syncToSupabase = async () => {
      const localData = localStorage.getItem('interior_products_data');
      if (localData) {
        const parsed = JSON.parse(localData);
        // DB 단일 행에 전체 데이터 통으로 백업/저장
        await supabase.from('app_state').upsert({ id: 'current_products', data: parsed });
      }
    };

    window.addEventListener('storage', syncToSupabase);
    return () => window.removeEventListener('storage', syncToSupabase);
  }, []);
}