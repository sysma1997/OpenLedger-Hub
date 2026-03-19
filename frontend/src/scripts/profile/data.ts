import { v4 as Uuid } from "uuid";
import dayjs from "dayjs";
import dayjsUtc from "dayjs/plugin/utc";
import Papa from "papaparse";

import { Transaction } from "../../core/transaction/domain/Transaction";
import type { TransactionDto } from "../../core/transaction/domain/Transaction"; 
import type { TransactionRepository } from "../../core/transaction/domain/TransactionRepository";

dayjs.extend(dayjsUtc);

const importCsv = document.getElementById("btnDImportCsv") as HTMLButtonElement;
const exportCsv = document.getElementById("btnDExportCsv") as HTMLButtonElement;
const showApiUrl = document.getElementById("btnDShowApiUrl") as HTMLButtonElement;
const progressBar = document.getElementById("pDProgress") as HTMLProgressElement;

const importParseCsv = async (text: string): Promise<any[]> => {
    return new Promise((res, rej) => {
        Papa.parse(text, {
            header: true, 
            skipEmptyLines: true, 
            delimiter: ',', 
            transformHeader: (header) => header.trim(), 
            transform: (value) => value.trim(), 
            complete: (results) => res(results.data), 
            error: (error: any) => rej(error)
        })
    });
};
const exportParseCSV = (text: string): string => {
    if (!text) return '';
    
    // 1. Escapar comillas dobles
    let escaped = text.replace(/"/g, '""');
    
    // 2. Reemplazar saltos de línea por \n literal (para que sea UNA línea)
    escaped = escaped.replace(/\n/g, '\\n');
    escaped = escaped.replace(/\r/g, '\\r');
    
    // 3. Si tiene comas, comillas o saltos, envolver en comillas
    if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\\n')) {
        escaped = `"${escaped}"`;
    }
    
    return escaped;
};

export const setup = (repository: TransactionRepository) => {
    importCsv.onclick = () => {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".csv";

        input.onchange = async (event: Event) => {
            const file = (event.target as HTMLInputElement).files?.[0];
            if (!file) return;

            if (progressBar.style.display === "none") progressBar.style.display = "block";
            progressBar.removeAttribute("value");

            try {
                const text = await file.text();
                const results = await importParseCsv(text);

                const limit: number = 500;
                const totalTransactions: number = results.length;
                const totalChunks: number = Math.ceil(totalTransactions / limit);
                let transactionsProcessed = 0;
                let totalChunksProcessed = 0;

                while (true) {
                    if (transactionsProcessed > totalTransactions) break;

                    const init = transactionsProcessed;
                    const end = transactionsProcessed + limit;

                    const transactionsChunk: Transaction[] = [];
                    try {
                        for (let i = init; i < end; i++) {
                            const item = results[i];

                            const id: string = Uuid();
                            const date: Date = dayjs.utc(item.Date).toDate();
                            const type: boolean = item.Type === "ingress";
                            const account: string = item.Account;
                            const value: number = Number(item.Value);

                            const category: string | undefined = (item.Category !== "") ? 
                                item.Category : undefined;
                            let description: string | undefined = (item.Description !== "") ? 
                                item.Description : undefined;
                            if (item.__parsed_extra) description += item.__parsed_extra.join("\n");

                            const transaction = new Transaction(date, type, 
                                account, value, 
                                id, undefined, 
                                category, description);
                            transactionsChunk.push(transaction);
                        }
                    } catch (ex: any) {
                        if (ex instanceof Error) console.error(ex);
                    }

                    try {
                        await repository.import(transactionsChunk);
                    } catch (ex: any) {
                        if (ex instanceof Error) console.error(ex);
                    }

                    transactionsProcessed += limit;
                    totalChunksProcessed++;
                    progressBar.value = Math.round((totalChunksProcessed / totalChunks) * 100);
                }
            } catch (ex: any) {
                if (ex instanceof Error) console.error(`Error: ${ex}`);
            }

            progressBar.removeAttribute("value");
            progressBar.style.display = "none";
            window.showAlert("Transactions add successfully.", "Transactions");
        };
        input.click();
    };
    exportCsv.onclick = () => {
        window.showConfirm("Do you want to export your transactions to a CSV file?", "Export transactions", () => {
            if (progressBar.style.display === "none") progressBar.style.display = "block";
            progressBar.removeAttribute("value");

            const transactions: string[] = ["Date,Type,Account,Value,Category,Description"];
            let totalProgress: number = 0;
            repository.export((chunk, progress) => {
                const list = chunk.list as TransactionDto[];
                
                list.forEach(transaction => {
                    const result = `${dayjs.utc(transaction.date).format("YYYY-MM-DDTHH:mm:ss[Z]")},` + 
                        `${(transaction.type) ? "ingress" : "egress"}, ` + 
                        `${exportParseCSV(transaction.account)}, ` + 
                        `${transaction.value}, ` +
                        `${(transaction.category) ? exportParseCSV(transaction.category) : ""}, ` + 
                        `${(transaction.description) ? exportParseCSV(transaction.description) : ""}`;
                    transactions.push(result);
                });
                
                progressBar.value = progress;
                totalProgress = progress;
            }).catch(error => {
                progressBar.removeAttribute("value");
                progressBar.style.display = "none";
                window.showAlert(error.toString().replace("Error: ", ""));
                return;
            })

            const checkCompletion = setInterval(() => {
                if (totalProgress >= 100) {
                    progressBar.removeAttribute("value");
                    clearInterval(checkCompletion);

                    setTimeout(() => {
                        const BOM = '\uFEFF';
                        const csvContent = BOM + transactions.join('\n');
                        const blob = new Blob([csvContent], { 
                            type: 'text/csv;charset=utf-8;' 
                        });
                        
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `OpenLedger_Hub_transactions_${dayjs().format("YYYYMMDD_HHmmss")}.csv`;
                        link.click();
                        URL.revokeObjectURL(url);
                        
                        progressBar.style.display = "none";
                    }, 1000);
                }
            }, 1000);
        });
    };

    showApiUrl.onclick = () => {
        try {
            const apiUrl = import.meta.env.PUBLIC_BACKEND_URL;
            if (apiUrl) window.showAlert(`The current API url is: <a href="${apiUrl}" target="_blank">${apiUrl}</a>`, "API URL");
        } catch (err: any) {
            if (err instanceof Error) {
                console.error(err);
                window.showAlert(err.message);
            }
        }
    };
};