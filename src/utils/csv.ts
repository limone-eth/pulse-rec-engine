import * as fs from 'fs';

import csv from 'csv-parser';
import { write } from 'fast-csv';

export function readCSV(filePath: string): Promise<string[][]> {
  return new Promise((resolve, reject) => {
    const results: string[][] = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: string[]) => {
        results.push(Object.values(data));
      })
      .on('end', () => {
        resolve(results);
      })
      .on('error', (err) => {
        reject(err);
      });
  });
}

export function writeDataToCSV(data: any[], filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(filePath, { flags: 'a' });
    write(data, { headers: true, delimiter: ',' })
      .pipe(ws)
      .on('finish', () => resolve())
      .on('error', (err) => reject(err));
  });
}

export function getLastLinePublishedAt(filePath: string): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const lengthToRead = 1024; // Number of bytes to read from the end of file
    const stats = fs.statSync(filePath);
    const bufferSize = Math.min(lengthToRead, stats.size);
    const buffer = Buffer.alloc(bufferSize);
    let fd: number;

    try {
      fd = fs.openSync(filePath, 'r');
      fs.readSync(fd, buffer, 0, bufferSize, stats.size - bufferSize);
    } catch (err) {
      reject(err);
      return;
    } finally {
      if (fd! !== undefined) {
        fs.closeSync(fd);
      }
    }

    const lines = buffer.toString('utf-8').split('\n');
    const lastLine = lines[lines.length - 1] || lines[lines.length - 2]; // In case the file ends with a newline

    if (!lastLine) {
      resolve(null);
      return;
    }

    const lastColumns = lastLine.split(',');

    resolve(lastColumns[9]);
  });
}
