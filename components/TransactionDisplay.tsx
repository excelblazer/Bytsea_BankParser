
import React from 'react';
import { ParsedTransaction } from '../types';

// For XLSX, we rely on the global XLSX object from the CDN script
declare var XLSX: any; 

interface TransactionDisplayProps {
  transactions: ParsedTransaction[];
  fileNamePrefix?: string;
}

const TransactionDisplay: React.FC<TransactionDisplayProps> = ({ transactions, fileNamePrefix = "statement_export" }) => {
  if (transactions.length === 0) {
    return <p className="text-center text-slate-400 mt-6">No transactions to display.</p>;
  }

  const exportToCsv = () => {
    const headers = "Bank Name,Client Name,Transaction Date,Description,Reference Number,Amount\n";
    const rows = transactions.map(t =>
      `"${t.bankName.replace(/"/g, '""')}","${t.clientName.replace(/"/g, '""')}","${t.transactionDate}","${t.description.replace(/"/g, '""')}","${t.referenceNumber.replace(/"/g, '""')}",${t.amount}`
    ).join("\n");
    
    const csvContent = headers + rows;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${fileNamePrefix}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(transactions.map(t => ({
        "Bank Name": t.bankName,
        "Client Name": t.clientName,
        "Transaction Date": t.transactionDate,
        "Description": t.description,
        "Reference Number": t.referenceNumber,
        "Amount": t.amount
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
    XLSX.writeFile(workbook, `${fileNamePrefix}.xlsx`);
  };

  return (
    <div className="mt-8 w-full bg-slate-800 shadow-xl rounded-lg p-6">
      <h3 className="text-2xl font-semibold text-blue-400 mb-6 text-center">Extracted Transactions</h3>
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
              {['Bank Name', 'Client Name', 'Date', 'Description', 'Reference', 'Amount'].map(header => (
                <th key={header} scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-slate-800 divide-y divide-slate-700">
            {transactions.map((transaction, index) => (
              <tr key={index} className="hover:bg-slate-700/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{transaction.bankName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{transaction.clientName}</td>
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
    