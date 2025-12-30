// Helper per convertire Array di Oggetti in stringa CSV
export const jsonToCsv = (data: any[]): string => {
  if (!data || data.length === 0) return '';

  const header = Object.keys(data[0]);
  const csvRows = [header.join(',')];

  for (const row of data) {
    const values = header.map(fieldName => {
      const val = row[fieldName];
      const escaped = ('' + (val ?? '')).replace(/"/g, '""'); // Escape doppi apici
      return `"${escaped}"`; // Avvolgi tutto in virgolette per gestire virgole nel testo
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

// Helper per scaricare il file
export const downloadCsv = (csvContent: string, filename: string) => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Helper per parsare CSV in JSON
export const csvToJson = (csvText: string): any[] => {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    
    // Regex complessa per gestire correttamente le virgole dentro le virgolette
    const values: string[] = [];
    let match;
    const regex = /(?:^|,)(?:"([^"]*(?:""[^"]*)*)"|([^",]*))/g;
    
    while ((match = regex.exec(currentLine)) !== null) {
      // match[1] è il valore tra virgolette (con escape), match[2] è il valore senza virgolette
      let val = match[1] ? match[1].replace(/""/g, '"') : match[2];
      if (val === undefined) continue; // Skip empty matches at end of line sometimes produced by regex
      values.push(val.trim());
    }

    // Fix: La regex potrebbe produrre un match vuoto alla fine, tronchiamo all'header length
    const cleanValues = values.slice(0, headers.length);

    if (cleanValues.length === headers.length) {
      const obj: any = {};
      headers.forEach((header, index) => {
        // Converti numeri se possibile
        const val = cleanValues[index];
        const num = Number(val);
        // Se è un numero valido e la stringa non è vuota, usa il numero, altrimenti stringa
        obj[header] = (!isNaN(num) && val !== '') ? num : val;
      });
      result.push(obj);
    }
  }
  
  return result;
};