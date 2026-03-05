"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem, ProductType } from "@/types";

interface CartStore {
    items: CartItem[];
    addItem: (item: Omit<CartItem, "quantity"> & { quantity?: number }) => void;
    removeItem: (productId: number, typeId: number) => void;
    updateQty: (productId: number, typeId: number, quantity: number) => void;
    clearCart: () => void;
    totalItems: () => number;
    totalPrice: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (incoming) => {
                const qty = incoming.quantity ?? 1;
                set((state) => {
                    const existing = state.items.find(
                        (i) => i.productId === incoming.productId && i.typeId === incoming.typeId
                    );
                    if (existing) {
                        return {
                            items: state.items.map((i) =>
                                i.productId === incoming.productId && i.typeId === incoming.typeId
                                    ? { ...i, quantity: i.quantity + qty }
                                    : i
                            ),
                        };
                    }
                    return { items: [...state.items, { ...incoming, quantity: qty }] };
                });
            },

            removeItem: (productId, typeId) =>
                set((state) => ({
                    items: state.items.filter(
                        (i) => !(i.productId === productId && i.typeId === typeId)
                    ),
                })),

            updateQty: (productId, typeId, quantity) =>
                set((state) => ({
                    items:
                        quantity <= 0
                            ? state.items.filter(
                                (i) => !(i.productId === productId && i.typeId === typeId)
                            )
                            : state.items.map((i) =>
                                i.productId === productId && i.typeId === typeId
                                    ? { ...i, quantity }
                                    : i
                            ),
                })),

            clearCart: () => set({ items: [] }),

            totalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: () =>
                get().items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0),
        }),
        { name: "vetworld-cart" }
    )
);
