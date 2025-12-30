/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const categories = [
  { key: 'missingComments', title: 'missing comments' },
  { key: 'missingReturns', title: 'missing returns' },
  { key: 'paramDocMismatches', title: 'param doc mismatches' },
  { key: 'missingComplexTypeInfo', title: 'missing complex type info' },
  { key: 'isAnyType', title: 'any usage' },
  { key: 'noReferences', title: 'no references' },
];

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const normalizePath = (statPath) =>
  path.resolve(__dirname, '../..', statPath.replace(/^packages\/kbn-docs-utils\//, ''));

const emptyCategories = () =>
  categories.reduce((acc, { key }) => {
    acc[key] = [];
    return acc;
  }, {});

const groupByFile = (stats) => {
  const byFile = new Map();
  categories.forEach(({ key }) => {
    const entries = stats[key] || [];
    entries.forEach((entry) => {
      const absPath = normalizePath(entry.path);
      if (!byFile.has(absPath)) byFile.set(absPath, emptyCategories());
      byFile.get(absPath)[key].push(entry);
    });
  });
  return byFile;
};

const formatCategory = (title, entries) => {
  const count = entries.length;
  const lines = [`//   ${title} (${count}):`];
  const sorted = [...entries].sort((a, b) =>
    a.lineNumber === b.lineNumber ? a.label.localeCompare(b.label) : a.lineNumber - b.lineNumber
  );
  sorted.forEach((entry) => {
    lines.push(`//     line ${entry.lineNumber} - ${entry.label}`);
  });
  return lines.join('\n');
};

const buildBlock = (fileStats) => {
  const parts = ['// Expected issues:'];
  let added = false;
  categories.forEach(({ key, title }) => {
    const entries = fileStats[key] || [];
    if (!entries.length) return;
    parts.push(formatCategory(title, entries));
    added = true;
  });
  if (!added) {
    parts.push('//   none');
  }
  return `${parts.join('\n')}\n`;
};

const replaceBlock = (content, block) => {
  const marker = '// Expected issues:';
  const idx = content.lastIndexOf(marker);
  if (idx === -1) {
    const trimmed = content.endsWith('\n') ? content : `${content}\n`;
    return `${trimmed}${block}`;
  }
  return `${content.slice(0, idx)}${block}`;
};

const main = () => {
  const defaultPath = path.resolve(__dirname, '../snapshots/plugin_a.stats.json');

  if (!fs.existsSync(defaultPath)) {
    console.error(`Stats file not found: ${defaultPath}.`);
    process.exit(1);
  }

  const stats = readJson(defaultPath);
  const byFile = groupByFile(stats);

  byFile.forEach((fileStats, absPath) => {
    if (!fs.existsSync(absPath)) return;
    const original = fs.readFileSync(absPath, 'utf8');
    const block = buildBlock(fileStats);
    const next = replaceBlock(original, block);
    if (next !== original) {
      fs.writeFileSync(absPath, next, 'utf8');
      console.log(`Updated: ${absPath}`);
    }
  });
};

main();
