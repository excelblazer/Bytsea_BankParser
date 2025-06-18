
import React from 'react';
import { ParsedTransaction } from '../types';

// For XLSX, we rely on the global XLSX object from the CDN script
declare var XLSX: any; 

interface TransactionDisplayProps {
  transactions: ParsedTransaction[];
}

const TransactionDisplay: React.FC<TransactionDisplayProps> = ({ transactions }) => {
  if (transactions.length === 0) {
    return <p className="text-center text-slate-400 mt-6">No transactions to display.</p>;
  }

  const generateExportFileName = (extension: string) => {
    // Get client name and bank name from the first transaction
    const clientName = transactions[0]?.clientName || "Client";
    const bankName = transactions[0]?.bankName || "Bank";
    
    // Get statement period and currency from localStorage if available
    const period = localStorage.getItem('statement_period') || "Statement";
    const currency = localStorage.getItem('statement_currency') || "";
    
    // Clean up names for filename (remove spaces, special chars)
    const cleanClientName = clientName.replace(/[^a-zA-Z0-9]/g, '');
    const cleanBankName = bankName.replace(/[^a-zA-Z0-9]/g, '');
    const cleanPeriod = period.replace(/[^a-zA-Z0-9]/g, '');
    
    // Include currency in the filename if available
    const currencyPart = currency ? `-${currency}` : "";
    
    // Create filename: ClientName-BankName-Period-Currency.extension
    return `${cleanClientName}-${cleanBankName}-${cleanPeriod}${currencyPart}.${extension}`;
  };

  const exportToCsv = () => {
    // Get currency for the header if available
    const currency = localStorage.getItem('statement_currency');
    const amountHeader = currency ? `Amount (${currency})` : "Amount";
    
    // Headers with possible currency indicator
    const headers = `Transaction Date,Description,Reference Number,${amountHeader}\n`;
    const rows = transactions.map(t =>
      `"${t.transactionDate}","${t.description.replace(/"/g, '""')}","${t.referenceNumber.replace(/"/g, '""')}",${t.amount}`
    ).join("\n");
    
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", generateExportFileName('csv'));
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const exportToExcel = () => {
    // Get currency for column header if available
    const currency = localStorage.getItem('statement_currency');
    const amountHeader = currency ? `Amount (${currency})` : "Amount";
    
    // Remove Bank Name and Client Name from the Excel output, but add currency info to Amount header
    const worksheet = XLSX.utils.json_to_sheet(transactions.map(t => ({
        "Transaction Date": t.transactionDate,
        "Description": t.description,
        "Reference Number": t.referenceNumber,
        [amountHeader]: t.amount
    })));
    const workbook = XLSX.utils.book_new();
    
    // Add a metadata sheet with bank name, client name, statement period, and currency
    if (transactions.length > 0) {
      const bankName = transactions[0].bankName;
      const clientName = transactions[0].clientName;
      const period = localStorage.getItem('statement_period') || "N/A";
      const currency = localStorage.getItem('statement_currency') || "Not detected";
      
      const metadataSheet = XLSX.utils.aoa_to_sheet([
        ["Statement Information"],
        ["Bank", bankName],
        ["Client", clientName],
        ["Period", period],
        ["Currency", currency]
      ]);
      
      XLSX.utils.book_append_sheet(workbook, metadataSheet, "Metadata");
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, generateExportFileName('xlsx'));
  };

  return (
    <div className="mt-8 w-full bg-slate-800 shadow-xl rounded-lg p-6">
      <h3 className="text-2xl font-semibold text-blue-400 mb-4 text-center">Extracted Transactions</h3>
      
      {/* Statement Info */}
      {transactions.length > 0 && (
        <div className="bg-slate-700 rounded-lg p-4 mb-6">
          <h4 className="text-lg font-medium text-blue-300 mb-2">Statement Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <p className="text-slate-400 text-sm">Bank</p>
              <p className="text-slate-200">{transactions[0].bankName}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Client</p>
              <p className="text-slate-200">{transactions[0].clientName}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Period</p>
              <p className="text-slate-200">{localStorage.getItem('statement_period') || "Not available"}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm">Currency</p>
              <p className="text-slate-200">{localStorage.getItem('statement_currency') || "Not detected"}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="flex justify-center space-x-4 mb-6">
        <button
          onClick={exportToCsv}
          className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-opacity-75"
        >
          Download CSV
        </button>
        <button
          onClick={exportToExcel}
          className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
        >
          Download Excel
        </button>
      </div>
      <div className="overflow-x-auto max-h-[50vh] rounded-md">
        <table className="min-w-full divide-y divide-slate-700 ">
          <thead className="bg-slate-700 sticky top-0">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Description
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                Reference
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                {`Amount${localStorage.getItem('statement_currency') ? ` (${localStorage.getItem('statement_currency')})` : ''}`}
              </th>
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700">
            {transactions.map((transaction, index) => (
              <tr key={index} className="hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{transaction.transactionDate}</td>
                <td className="px-6 py-4 text-sm text-slate-300 min-w-[200px] max-w-xs truncate" title={transaction.description}>{transaction.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{transaction.referenceNumber}</td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {transaction.amount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionDisplay;
    