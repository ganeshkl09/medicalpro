const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const { machineIdSync } = require('node-machine-id');
const Database = require('better-sqlite3');
const { autoUpdater } = require('electron-updater');

// ── AUTO-UPDATE SETUP ────────────────────────────────────────────────────────
autoUpdater.checkForUpdatesAndNotify();

// ── 1. MACHINE LOCK ──────────────────────────────────────────────────────────
// To get your machine ID, temporarily add:
//   console.log(machineIdSync());
// Run the app once, copy the printed ID, paste below, then remove the log.
const ALLOWED_MACHINE_ID = 'PASTE_YOUR_MACHINE_ID_HERE';

// ── 2. DATABASE SETUP ────────────────────────────────────────────────────────
// Stored in user's AppData folder — safe outside ASAR
let db;

function initDB() {
  const dbPath = path.join(app.getPath('userData'), 'medical.db');
  db = new Database(dbPath);

  db.exec(`
    CREATE TABLE IF NOT EXISTS medicines (
      id      INTEGER PRIMARY KEY,
      name    TEXT, cat TEXT, mfr TEXT,
      price   REAL, cost REAL,
      stock   INTEGER, min INTEGER,
      expiry  TEXT, batch TEXT, unit TEXT,
      sid     INTEGER, gst REAL
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id      INTEGER PRIMARY KEY,
      name    TEXT, contact TEXT, phone TEXT,
      email   TEXT, addr TEXT, gst TEXT,
      terms   TEXT, balance REAL
    );

    CREATE TABLE IF NOT EXISTS customers (
      id      INTEGER PRIMARY KEY,
      name    TEXT, phone TEXT, email TEXT,
      addr    TEXT, points INTEGER, total REAL
    );

    CREATE TABLE IF NOT EXISTS employees (
      id      INTEGER PRIMARY KEY,
      name    TEXT, role TEXT, phone TEXT,
      email   TEXT, salary REAL,
      joined  TEXT, status TEXT
    );

    CREATE TABLE IF NOT EXISTS sales (
      id       TEXT PRIMARY KEY,
      date     TEXT, customer TEXT,
      items    TEXT,
      subtotal REAL, discount REAL,
      tax      REAL, gstBreakdown TEXT,
      total    REAL, payment TEXT, rx INTEGER
    );

    CREATE TABLE IF NOT EXISTS purchase_orders (
      id       TEXT PRIMARY KEY,
      date     TEXT, supplier TEXT,
      items    TEXT, total REAL,
      status   TEXT, expected TEXT
    );
  `);
}

// ── 3. IPC HANDLERS ──────────────────────────────────────────────────────────

// Medicines
ipcMain.handle('get-medicines', () =>
  db.prepare('SELECT * FROM medicines').all()
);
ipcMain.handle('add-medicine', (_, m) =>
  db.prepare(`INSERT OR REPLACE INTO medicines
    (id,name,cat,mfr,price,cost,stock,min,expiry,batch,unit,sid,gst)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`)
    .run(m.id,m.name,m.cat,m.mfr,m.price,m.cost,m.stock,m.min,m.expiry,m.batch,m.unit,m.sid,m.gst)
);
ipcMain.handle('update-medicine', (_, m) =>
  db.prepare(`UPDATE medicines SET
    name=?,cat=?,mfr=?,price=?,cost=?,stock=?,min=?,expiry=?,batch=?,unit=?,sid=?,gst=?
    WHERE id=?`)
    .run(m.name,m.cat,m.mfr,m.price,m.cost,m.stock,m.min,m.expiry,m.batch,m.unit,m.sid,m.gst,m.id)
);
ipcMain.handle('delete-medicine', (_, id) =>
  db.prepare('DELETE FROM medicines WHERE id=?').run(id)
);

// Suppliers
ipcMain.handle('get-suppliers', () =>
  db.prepare('SELECT * FROM suppliers').all()
);
ipcMain.handle('add-supplier', (_, s) =>
  db.prepare(`INSERT OR REPLACE INTO suppliers
    (id,name,contact,phone,email,addr,gst,terms,balance)
    VALUES (?,?,?,?,?,?,?,?,?)`)
    .run(s.id,s.name,s.contact,s.phone,s.email,s.addr,s.gst,s.terms,s.balance)
);
ipcMain.handle('update-supplier', (_, s) =>
  db.prepare(`UPDATE suppliers SET
    name=?,contact=?,phone=?,email=?,addr=?,gst=?,terms=?,balance=?
    WHERE id=?`)
    .run(s.name,s.contact,s.phone,s.email,s.addr,s.gst,s.terms,s.balance,s.id)
);
ipcMain.handle('delete-supplier', (_, id) =>
  db.prepare('DELETE FROM suppliers WHERE id=?').run(id)
);

// Customers
ipcMain.handle('get-customers', () =>
  db.prepare('SELECT * FROM customers').all()
);
ipcMain.handle('add-customer', (_, c) =>
  db.prepare(`INSERT OR REPLACE INTO customers
    (id,name,phone,email,addr,points,total)
    VALUES (?,?,?,?,?,?,?)`)
    .run(c.id,c.name,c.phone,c.email,c.addr,c.points,c.total)
);
ipcMain.handle('update-customer', (_, c) =>
  db.prepare(`UPDATE customers SET
    name=?,phone=?,email=?,addr=?,points=?,total=?
    WHERE id=?`)
    .run(c.name,c.phone,c.email,c.addr,c.points,c.total,c.id)
);
ipcMain.handle('delete-customer', (_, id) =>
  db.prepare('DELETE FROM customers WHERE id=?').run(id)
);

// Employees
ipcMain.handle('get-employees', () =>
  db.prepare('SELECT * FROM employees').all()
);
ipcMain.handle('add-employee', (_, e) =>
  db.prepare(`INSERT OR REPLACE INTO employees
    (id,name,role,phone,email,salary,joined,status)
    VALUES (?,?,?,?,?,?,?,?)`)
    .run(e.id,e.name,e.role,e.phone,e.email,e.salary,e.joined,e.status)
);
ipcMain.handle('update-employee', (_, e) =>
  db.prepare(`UPDATE employees SET
    name=?,role=?,phone=?,email=?,salary=?,joined=?,status=?
    WHERE id=?`)
    .run(e.name,e.role,e.phone,e.email,e.salary,e.joined,e.status,e.id)
);
ipcMain.handle('delete-employee', (_, id) =>
  db.prepare('DELETE FROM employees WHERE id=?').run(id)
);

// Sales
ipcMain.handle('get-sales', () =>
  db.prepare('SELECT * FROM sales').all().map(r => ({
    ...r,
    items: JSON.parse(r.items),
    gstBreakdown: JSON.parse(r.gstBreakdown),
    rx: !!r.rx
  }))
);
ipcMain.handle('add-sale', (_, s) =>
  db.prepare(`INSERT OR REPLACE INTO sales
    (id,date,customer,items,subtotal,discount,tax,gstBreakdown,total,payment,rx)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
    .run(s.id,s.date,s.customer,JSON.stringify(s.items),s.subtotal,s.discount,s.tax,
         JSON.stringify(s.gstBreakdown),s.total,s.payment,s.rx?1:0)
);
ipcMain.handle('delete-sale', (_, id) =>
  db.prepare('DELETE FROM sales WHERE id=?').run(id)
);

// Purchase Orders
ipcMain.handle('get-purchase-orders', () =>
  db.prepare('SELECT * FROM purchase_orders').all().map(r => ({
    ...r,
    items: JSON.parse(r.items)
  }))
);
ipcMain.handle('add-purchase-order', (_, po) =>
  db.prepare(`INSERT OR REPLACE INTO purchase_orders
    (id,date,supplier,items,total,status,expected)
    VALUES (?,?,?,?,?,?,?)`)
    .run(po.id,po.date,po.supplier,JSON.stringify(po.items),po.total,po.status,po.expected)
);
ipcMain.handle('update-purchase-order', (_, po) =>
  db.prepare(`UPDATE purchase_orders SET
    date=?,supplier=?,items=?,total=?,status=?,expected=?
    WHERE id=?`)
    .run(po.date,po.supplier,JSON.stringify(po.items),po.total,po.status,po.expected,po.id)
);
ipcMain.handle('delete-purchase-order', (_, id) =>
  db.prepare('DELETE FROM purchase_orders WHERE id=?').run(id)
);

// ── 4. WINDOW ────────────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'assets/icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    }
  });
  win.loadFile(path.join(__dirname, 'build/index.html'));
}

// ── 5. APP START ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // const currentId = machineIdSync();
  // if (currentId !== ALLOWED_MACHINE_ID) {
  //   dialog.showErrorBox(
  //     'Unauthorized Device',
  //     'This application is not licensed for this computer.'
  //   );
  //   app.quit();
  //   return;
  // }
  initDB();
  createWindow();
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
