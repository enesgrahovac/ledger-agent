import localforage from "localforage"
import { Transaction } from "@/components/pageContent/dashboard"

localforage.config({ name: "rocket-money-dashboard" })

const TX_KEY = "transactions"
const IGNORED_KEY = "ignoredCategories"

export const repo = {
    /* Transactions */
    async getTransactions(): Promise<Transaction[]> {
        return (await localforage.getItem<Transaction[]>(TX_KEY)) ?? []
    },
    async setTransactions(list: Transaction[]) {
        await localforage.setItem(TX_KEY, list)
    },
    async clearTransactions() {
        await localforage.removeItem(TX_KEY)
    },

    /* Ignored categories */
    async getIgnored(): Promise<string[]> {
        return (await localforage.getItem<string[]>(IGNORED_KEY)) ?? []
    },
    async setIgnored(list: string[]) {
        await localforage.setItem(IGNORED_KEY, list)
    },
    async clearIgnored() {
        await localforage.removeItem(IGNORED_KEY)
    },

    /* Everything */
    async clearAll() {
        await Promise.all([this.clearTransactions(), this.clearIgnored()])
    },
}