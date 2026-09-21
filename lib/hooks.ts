'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, orderBy, query, where, limit, type QueryConstraint } from 'firebase/firestore';
import { getDbFirebase } from '@/lib/firebase';
import type { Order, Service, ServiceCategory, Ticket, TicketMessage, Transaction } from '@/lib/types';

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
        () => {}
      );
    } catch {
      // Firebase não configurado — lista permanece vazia.
    }
    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, serialized, depKey]);

  return rows;
}

export function useCategories(): ServiceCategory[] {
  return useCollection<ServiceCategory>('categories', [orderBy('name')], []);
}

export function useServices(): Service[] {
  return useCollection<Service>('services', [orderBy('price')], []);
}

export function useOrders(userId: string | undefined, max = 50): Order[] {
  const constraints: QueryConstraint[] = useMemo(() => {
    if (!userId) return [];
    return [where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(max)];
  }, [userId, max]);
  return useCollection<Order>('orders', constraints, [userId, max]);
}

export function useTickets(userId: string | undefined): Ticket[] {
  const constraints: QueryConstraint[] = useMemo(() => {
    if (!userId) return [];
    return [where('userId', '==', userId), orderBy('createdAt', 'desc')];
  }, [userId]);
  return useCollection<Ticket>('tickets', constraints, [userId]);
}

export function useTicketMessages(ticketId: string | null): TicketMessage[] {
  const constraints: QueryConstraint[] = useMemo(() => {
    if (!ticketId) return [];
    return [where('ticketId', '==', ticketId), orderBy('createdAt', 'asc')];
  }, [ticketId]);
  return useCollection<TicketMessage>('ticketMessages', constraints, [ticketId]);
}

export function useTransactions(userId: string | undefined): Transaction[] {
  const constraints: QueryConstraint[] = useMemo(() => {
    if (!userId) return [];
    return [where('userId', '==', userId), orderBy('createdAt', 'desc')];
  }, [userId]);
  return useCollection<Transaction>('transactions', constraints, [userId]);
}