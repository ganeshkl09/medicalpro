const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('db', {

  // Medicines
  getMedicines:       ()  => ipcRenderer.invoke('get-medicines'),
  addMedicine:        (m) => ipcRenderer.invoke('add-medicine', m),
  updateMedicine:     (m) => ipcRenderer.invoke('update-medicine', m),
  deleteMedicine:     (id)=> ipcRenderer.invoke('delete-medicine', id),

  // Suppliers
  getSuppliers:       ()  => ipcRenderer.invoke('get-suppliers'),
  addSupplier:        (s) => ipcRenderer.invoke('add-supplier', s),
  updateSupplier:     (s) => ipcRenderer.invoke('update-supplier', s),
  deleteSupplier:     (id)=> ipcRenderer.invoke('delete-supplier', id),

  // Customers
  getCustomers:       ()  => ipcRenderer.invoke('get-customers'),
  addCustomer:        (c) => ipcRenderer.invoke('add-customer', c),
  updateCustomer:     (c) => ipcRenderer.invoke('update-customer', c),
  deleteCustomer:     (id)=> ipcRenderer.invoke('delete-customer', id),

  // Employees
  getEmployees:       ()  => ipcRenderer.invoke('get-employees'),
  addEmployee:        (e) => ipcRenderer.invoke('add-employee', e),
  updateEmployee:     (e) => ipcRenderer.invoke('update-employee', e),
  deleteEmployee:     (id)=> ipcRenderer.invoke('delete-employee', id),

  // Sales
  getSales:           ()  => ipcRenderer.invoke('get-sales'),
  addSale:            (s) => ipcRenderer.invoke('add-sale', s),
  deleteSale:         (id)=> ipcRenderer.invoke('delete-sale', id),

  // Purchase Orders
  getPurchaseOrders:  ()   => ipcRenderer.invoke('get-purchase-orders'),
  addPurchaseOrder:   (po) => ipcRenderer.invoke('add-purchase-order', po),
  updatePurchaseOrder:(po) => ipcRenderer.invoke('update-purchase-order', po),
  deletePurchaseOrder:(id) => ipcRenderer.invoke('delete-purchase-order', id),

});
