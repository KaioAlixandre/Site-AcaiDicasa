
// Log global para depuração: saber se o componente está montando
(window as any).AdminOrderNotificationLoaded = true;
console.log("AdminOrderNotification: componente montado");

import React, { useEffect, useRef, useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const POLL_INTERVAL = 10000; // 10 segundos


const AdminOrderNotification: React.FC = () => {
  const { user } = useAuth();
  console.log("AdminOrderNotification: user:", user);
  if (user) {
    console.log("AdminOrderNotification: user.funcao:", user.funcao);
  }
  const [show, setShow] = useState(false);
  const lastOrderIdRef = useRef<number | null>(null);
  const isFirstLoadRef = useRef(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!user || user.funcao !== 'admin') return;

    let interval: NodeJS.Timeout;

    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/orders/orders', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const orders = res.data;
        console.log('[AdminOrderNotification] Resposta da API de pedidos:', orders);
        if (Array.isArray(orders) && orders.length > 0) {
          const newestOrder = orders[0];
          console.log('[AdminOrderNotification] ID do último pedido salvo:', lastOrderIdRef.current);
          console.log('[AdminOrderNotification] ID do pedido mais recente:', newestOrder.id);
          if (isFirstLoadRef.current) {
            lastOrderIdRef.current = newestOrder.id;
            isFirstLoadRef.current = false;
            console.log('[AdminOrderNotification] Primeira carga, setando lastOrderId:', newestOrder.id);
          } else if (newestOrder.id !== lastOrderIdRef.current) {
            lastOrderIdRef.current = newestOrder.id;
            setShow(true);
            console.log('[AdminOrderNotification] Novo pedido detectado! Exibindo notificação.');
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play();
            }
          }
        } else {
          console.log('[AdminOrderNotification] Nenhum pedido retornado pela API.');
        }
      } catch (err) {
        console.error('[AdminOrderNotification] Erro ao buscar pedidos:', err);
      }
    };

    fetchOrders();
    interval = setInterval(fetchOrders, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [user]);

  if (!user || user.funcao !== 'admin') return null;
  if (show) {
    console.log('[AdminOrderNotification] JSX: bloco de notificação renderizado');
  }
  return (
    <>
      <audio ref={audioRef} src="\public\audio.m4a" preload="auto" loop />
      {show && (
        <div
          className="fixed top-6 right-6 z-50 flex items-center justify-center w-16 h-16 bg-purple-600 text-white rounded-full shadow-lg animate-fade-in animate-pulse-notification cursor-pointer"
          style={{ boxShadow: '0 4px 24px 0 rgba(80,0,120,0.18)' }}
          onClick={() => {
            setShow(false);
            if (audioRef.current) {""
              audioRef.current.pause();
              audioRef.current.currentTime = 0;
            }
          }}
          title="Clique para silenciar a notificação"
        >
          <Bell size={36} />
        </div>
      )}
    </>
  );
};

export default AdminOrderNotification;
