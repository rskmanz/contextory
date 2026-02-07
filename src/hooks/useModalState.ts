import { useState, useCallback } from 'react';

type ModalState<K extends string> = {
  activeModal: K | null;
  data: unknown;
  open: (modal: K, data?: unknown) => void;
  close: () => void;
  isOpen: (modal: K) => boolean;
  getData: <T>() => T | null;
};

export function useModalState<K extends string>(): ModalState<K> {
  const [activeModal, setActiveModal] = useState<K | null>(null);
  const [data, setData] = useState<unknown>(null);

  const open = useCallback((modal: K, modalData?: unknown) => {
    setActiveModal(modal);
    setData(modalData ?? null);
  }, []);

  const close = useCallback(() => {
    setActiveModal(null);
    setData(null);
  }, []);

  const isOpen = useCallback((modal: K) => activeModal === modal, [activeModal]);

  const getData = useCallback(<T,>() => data as T | null, [data]);

  return { activeModal, data, open, close, isOpen, getData };
}
