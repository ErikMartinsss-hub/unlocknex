'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where, limit, type QueryConstraint } from 'firebase/firestore';
import { getDbFirebase } from '@/lib/firebase';
import type { DownloadItem, Order, Service, ServiceCategory, Ticket, TicketMessage, Transaction } from '@/lib/types';

function useCollection<T>(name: string, constraints: QueryConstraint[] = [], deps: unknown[] = []): T[] {
  const [rows, setRows] = useState<T[]>([]);

  const serialized = useMemo(() => constraints.map((c) => String(c)).join('|'), [constraints]);
  const depKey = JSON.stringify(deps);

  useEffect(() => {
    let unsub = () => {};
    try {
      const q = query(collection(getDbFirebase(), name), ...constraints);
      unsub = onSnapshot(
        q,
        (snap) => {
          setRows(snap.docs.map((d) => ({ ...d.data(), id: d.id }) as T));
        },
        (err) => {
          // Erro comum: índice composto ausente no Firestore
          // (where + orderBy). O err.message traz o link para criar.
          console.error(`[firestore] falha ao ler '${name}':`, err);
        }
      );
    } catch {
      // Firebase não configurado — lista permanece vazia.
    }
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, serialized, depKey]);

  return rows;
}

function sortByCreatedAtDesc<T extends { createdAt?: number }>(rows: T[]): T[] {
  return rows.slice().sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

export function useCategories(): ServiceCategory[] {
  return useCollection<ServiceCategory>('categories', [orderBy('name')], []);
}

export function useServices(): Service[] {
  return useCollection<Service>('services', [orderBy('price')], []);
}

export function useDownloads(): DownloadItem[] {
  return useCollection<DownloadItem>('downloads', [orderBy('name')], []);
}

export function useOrders(userId: string | undefined, max = 50): Order[] {
  // Sem orderBy no servidor (evita exigir índice composto): filtra por dono,
  // ordena e corta no cliente.
  const fetchMax = Math.max(max, 100);
  const rows = useCollection<Order>(
    'orders',
    userId ? [where('userId', '==', userId), limit(fetchMax)] : [],
    [userId, fetchMax]
  );
  return useMemo(() => sortByCreatedAtDesc(rows).slice(0, max), [rows, max]);
}

export function useTickets(userId: string | undefined): Ticket[] {
  const rows = useCollection<Ticket>(
    'tickets',
    userId ? [where('userId', '==', userId), limit(100)] : [],
    [userId]
  );
  return useMemo(() => sortByCreatedAtDesc(rows), [rows]);
}

export function useTicketMessages(ticketId: string | null): TicketMessage[] {
  const rows = useCollection<TicketMessage>(
    'ticketMessages',
    ticketId ? [where('ticketId', '==', ticketId), limit(200)] : [],
    [ticketId]
  );
  return useMemo(
    () => rows.slice().sort((a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0)),
    [rows]
  );
}

export function useTransactions(userId: string | undefined): Transaction[] {
  const rows = useCollection<Transaction>(
    'transactions',
    userId ? [where('userId', '==', userId), limit(200)] : [],
    [userId]
  );
  return useMemo(() => sortByCreatedAtDesc(rows), [rows]);
}