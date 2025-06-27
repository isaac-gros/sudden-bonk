import '../../shared/types/game';
import { DrawingPoint } from '../../shared/types/game';

const loadCsvContent = async function (filePath: string) {
  const file = await fetch(filePath);
  const fileContent = await file.text();
  return fileContent.toString();
};

const csvToJsonDataPoints = function (
  csvContent: string,
  delimiter: ';' | ',' = ';'
): DrawingPoint[] {
  const rows = csvContent.split('\n');
  const result = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    if (typeof row !== 'undefined') {
      const cells = row.split(delimiter);

      // Ignore first row (header)
      if (i > 0) {
        const xPoint = cells[0];
        const yPoint = cells[1];
        if (cells.length == 2 && xPoint && yPoint) {
          result.push({
            x: parseInt(xPoint.toString()),
            y: parseInt(yPoint.toString()),
          });
        }
      }
    }
  }

  return result;
};

const csvToDataPoints = async function (csvPath: string): Promise<DrawingPoint[]> {
  const csvContent = await loadCsvContent(csvPath);
  const dataPoints = csvToJsonDataPoints(csvContent);
  return dataPoints;
};

export default csvToDataPoints;
