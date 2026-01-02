/**
 * Service Layer Index
 * Centralized exports for all service modules
 */

// Sales Service
export {
    createSale,
    getSales,
    getSalesByDateRange,
    getDailySalesSummary,
    updateSale,
    markSaleAsPaid,
    deleteSale,
    deleteAllSales,
    getSalesByCustomer
} from './salesService';

// Customers Service
export {
    createCustomer,
    getCustomers,
    getCustomerById,
    findCustomersByName,
    updateCustomer,
    deleteCustomer,
    getOrCreateCustomer
} from './customersService';

// Price List Service
export {
    getAllPriceListItems,
    getPriceListByCategory,
    getCategories,
    createPriceListItem,
    updatePriceListItem,
    deactivatePriceListItem,
    deletePriceListItem,
    searchPriceList
} from './priceListService';

// Accounts Service
export {
    getAccounts,
    getAccountsByCustomerName,
    getOutstandingAccounts,
    getOverdueAccounts,
    markAccountAsPaid,
    getAccountBalances,
    getAccountCustomerNames,
    deleteAccount
} from './accountsService';
