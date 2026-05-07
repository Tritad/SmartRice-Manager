// ============================================================
// 📌 STEP 1: เปลี่ยน SHEET_ID เป็น ID ของ Google Sheets คุณ
//    (ดูจาก URL: docs.google.com/spreadsheets/d/<<SHEET_ID>>/edit)
// ============================================================
const SHEET_ID = '1e2NgEjc3JtoK_Kce6RFfFUcRYiNa7voDfB394JmH6Qc';

const HEADERS = {
  transactions: ['id', 'userId', 'userEmail', 'date', 'type', 'category', 'amount', 'description', 'season', 'createdAt'],
};

// =============== CORS & Router ===============
function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    const params = e.parameter || {};
    const method = params.method || (e.postData ? 'POST' : 'GET');
    const action = params.action;

    let result;

    if (action === 'getTransactions') {
      result = getTransactions(params.userId);
    } else if (action === 'addTransaction') {
      const data = JSON.parse(e.postData.contents);
      result = addTransaction(data);
    } else if (action === 'deleteTransaction') {
      result = deleteTransaction(params.id, params.userId);
    } else if (action === 'getSummary') {
      result = getSummary(params.userId, params.year, params.month);
    } else if (action === 'ping') {
      result = { status: 'ok', message: 'Rice Farm API is running 🌾' };
    } else {
      result = { error: 'Unknown action' };
    }

    output.setContent(JSON.stringify({ success: true, data: result }));
  } catch (err) {
    output.setContent(JSON.stringify({ success: false, error: err.message }));
  }

  return output;
}

// =============== Sheet Setup ===============
function setupSheets() {
  const ss = SpreadsheetApp.openById(SHEET_ID);

  // สร้าง sheet transactions ถ้ายังไม่มี
  let txSheet = ss.getSheetByName('transactions');
  if (!txSheet) {
    txSheet = ss.insertSheet('transactions');
    txSheet.appendRow(HEADERS.transactions);
    txSheet.getRange(1, 1, 1, HEADERS.transactions.length)
      .setFontWeight('bold')
      .setBackground('#2D7A4F')
      .setFontColor('#ffffff');
  }

  return { message: 'Sheets setup complete ✅' };
}

// =============== Transactions ===============
function getTransactions(userId) {
  if (!userId) throw new Error('userId required');
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('transactions');
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const rows = data.slice(1);

  return rows
    .filter(row => row[headers.indexOf('userId')] === userId)
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => obj[h] = row[i]);
      return obj;
    })
    .reverse(); // newest first
}

function addTransaction(data) {
  const required = ['userId', 'userEmail', 'date', 'type', 'category', 'amount'];
  required.forEach(f => {
    if (!data[f]) throw new Error(`Missing field: ${f}`);
  });

  const ss = SpreadsheetApp.openById(SHEET_ID);
  let sheet = ss.getSheetByName('transactions');
  if (!sheet) {
    setupSheets();
    sheet = ss.getSheetByName('transactions');
  }

  const id = Utilities.getUuid();
  const row = [
    id,
    data.userId,
    data.userEmail,
    data.date,
    data.type,           // 'income' หรือ 'expense'
    data.category,
    parseFloat(data.amount),
    data.description || '',
    data.season || '',
    new Date().toISOString(),
  ];

  sheet.appendRow(row);
  return { id, message: 'Transaction saved ✅' };
}

function deleteTransaction(id, userId) {
  if (!id || !userId) throw new Error('id and userId required');
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName('transactions');
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idIdx = headers.indexOf('id');
  const userIdx = headers.indexOf('userId');

  for (let i = 1; i < data.length; i++) {
    if (data[i][idIdx] === id && data[i][userIdx] === userId) {
      sheet.deleteRow(i + 1);
      return { message: 'Deleted ✅' };
    }
  }
  throw new Error('Transaction not found');
}

function getSummary(userId, year, month) {
  const transactions = getTransactions(userId);

  let filtered = transactions;
  if (year) filtered = filtered.filter(t => t.date && t.date.toString().startsWith(year));
  if (month) filtered = filtered.filter(t => t.date && t.date.toString().startsWith(`${year}-${month.toString().padStart(2, '0')}`));

  const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);
  const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0);

  // สรุปตามหมวดหมู่
  const byCategory = {};
  filtered.forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = { income: 0, expense: 0 };
    if (t.type === 'income') byCategory[t.category].income += parseFloat(t.amount) || 0;
    else byCategory[t.category].expense += parseFloat(t.amount) || 0;
  });

  // รายการรายเดือน (12 เดือน)
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const m = (i + 1).toString().padStart(2, '0');
    const monthTx = transactions.filter(t => t.date && t.date.toString().startsWith(`${year || new Date().getFullYear()}-${m}`));
    return {
      month: m,
      income: monthTx.filter(t => t.type === 'income').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0),
      expense: monthTx.filter(t => t.type === 'expense').reduce((s, t) => s + (parseFloat(t.amount) || 0), 0),
    };
  });

  return {
    totalIncome: income,
    totalExpense: expense,
    netProfit: income - expense,
    byCategory,
    monthly,
    count: filtered.length,
  };
}
