// Simple tests for core utilities (Node.js)
// Run with: node tests/utils.test.js

const assert = require('assert');

// Deduplication logic (same as used in dedup.py, but in JS for test)
function deduplicateVictims(victims) {
  const seen = new Set();
  const deduped = [];
  for (const v of victims) {
    const key = `${v.name.trim().toLowerCase()}|${v.age}|${v.city.trim().toLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(v);
    }
  }
  // Renumber IDs sequentially
  deduped.forEach((v, i) => v.id = i + 1);
  return deduped;
}

// Pagination math
function getPageItems(items, page, pageSize) {
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  return items.slice(start, end);
}

// Filter by name (case-insensitive)
function filterByName(victims, term) {
  if (!term) return victims;
  const lower = term.toLowerCase();
  return victims.filter(v => v.name.toLowerCase().includes(lower));
}

// Tests
function runTests() {
  let passed = 0, failed = 0;

  // Test deduplication
  const sample = [
    { id: 1, name: 'Arvin Vafaie', age: 17, city: 'Tehran' },
    { id: 2, name: 'Arvin Vafaie', age: 17, city: 'tehran' },
    { id: 3, name: 'Parnia Khalaji', age: 17, city: 'Tehran' },
    { id: 4, name: 'Parnia Khalaji', age: 17, city: 'Tehran' },
  ];
  const deduped = deduplicateVictims(sample);
  if (deduped.length === 2) {
    console.log('✓ Deduplication removes exact duplicates');
    passed++;
  } else {
    console.log(`✗ Deduplication expected 2, got ${deduped.length}`);
    failed++;
  }
  if (deduped[0].id === 1 && deduped[1].id === 2) {
    console.log('✓ IDs renumbered sequentially');
    passed++;
  } else {
    console.log('✗ IDs not sequential');
    failed++;
  }

  // Test pagination
  const items = Array.from({ length: 50 }, (_, i) => ({ id: i + 1 }));
  const page1 = getPageItems(items, 1, 20);
  const page2 = getPageItems(items, 2, 20);
  const page3 = getPageItems(items, 3, 20);
  if (page1.length === 20 && page2.length === 20 && page3.length === 10) {
    console.log('✓ Pagination math correct');
    passed++;
  } else {
    console.log('✗ Pagination math incorrect');
    failed++;
  }

  // Test name filter
  const filtered = filterByName(items, '5');
  if (filtered.length === 5) { // ids 5, 15, 25, 35, 45
    console.log('✓ Name filter (partial) works');
    passed++;
  } else {
    console.log(`✗ Filter '5' expected 5, got ${filtered.length}`);
    failed++;
  }

  console.log(`\nResults: ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests();
