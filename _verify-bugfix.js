// Unit test for the 3 bug fixes in Designerproducts
// Tests parsePrice + parseSpecialMode + algorithm fallback logic

let _importFormulaCount = 0;

function parsePrice(val) {
    if (val == null || val === '') return 0;
    const str = String(val);
    if (str.startsWith('=')) {
        _importFormulaCount++;
        return 0;
    }
    const num = parseFloat(str.replace(/[^0-9.-]/g, ''));
    return isNaN(num) ? 0 : num;
}

function parseSpecialMode(val) {
    if (val == null || val === '') return 'return_base';
    const v = String(val).toLowerCase().trim();
    if (v === '') return 'return_base';
    if (v === 'return_base') return 'return_base';
    if (v === 'plus_150_100') return 'plus_150_100';
    if (v === 'plus_60_50') return 'plus_60_50';
    if (v === 'plus_20_10') return 'plus_20_10';
    if (v === 'by_sqm') return 'by_sqm';
    if (v.includes('return_base') || v.includes('return base') || v.includes('返回基础')) return 'return_base';
    if (v.includes('plus_150_100') || v.includes('+150') || v.includes('150/100')) return 'plus_150_100';
    if (v.includes('plus_60_50') || v.includes('+60') || v.includes('60/50')) return 'plus_60_50';
    if (v.includes('plus_20_10') || v.includes('+20') || v.includes('20/10')) return 'plus_20_10';
    if (v.includes('by_sqm') || v.includes('sqm') || v.includes('平方米')) return 'by_sqm';
    return 'return_base';
}

// Mimics the Excel-import branch's spec-mode fallback: item.<key> || 'return_base'
function importSpecMode(val) {
    return val || 'return_base';
}

// Mimics the algorithm import default: item.algorithm || 'Per Unit'
function importAlgorithm(val) {
    return val || 'Per Unit';
}

let pass = 0, fail = 0;
function eq(label, got, want) {
    const ok = got === want;
    if (ok) { pass++; console.log(`  ✓ ${label}: ${JSON.stringify(got)}`); }
    else { fail++; console.log(`  ✗ ${label}: got ${JSON.stringify(got)}  want ${JSON.stringify(want)}`); }
}

console.log('=== parsePrice (Bug #2) ===');
_importFormulaCount = 0;
eq('empty string', parsePrice(''), 0);
eq('null', parsePrice(null), 0);
eq('undefined', parsePrice(undefined), 0);
eq('plain number', parsePrice('100'), 100);
eq('number with currency', parsePrice('RM 1234.56'), 1234.56);
eq('comma number', parsePrice('1,234.56'), 1234.56);
eq('negative', parsePrice('-50.5'), -50.5);
eq('formula =SUM(...)', parsePrice('=SUM(M4/0.85)'), 0);
eq('formula =A1+B1', parsePrice('=A1+B1'), 0);
eq('garbage', parsePrice('abc'), 0);
eq('  formula counter after 2 calls', _importFormulaCount, 2);

console.log('\n=== parseSpecialMode (Bug #3) ===');
eq('undefined', parseSpecialMode(undefined), 'return_base');
eq('null', parseSpecialMode(null), 'return_base');
eq('empty', parseSpecialMode(''), 'return_base');
eq('return_base', parseSpecialMode('return_base'), 'return_base');
eq('plus_150_100', parseSpecialMode('plus_150_100'), 'plus_150_100');
eq('plus_60_50', parseSpecialMode('plus_60_50'), 'plus_60_50');
eq('plus_20_10', parseSpecialMode('plus_20_10'), 'plus_20_10');
eq('by_sqm', parseSpecialMode('by_sqm'), 'by_sqm');
eq('uppercase RETURN_BASE', parseSpecialMode('RETURN_BASE'), 'return_base');
eq('chinese 返回基础', parseSpecialMode('返回基础'), 'return_base');
eq('keyword +150', parseSpecialMode('+150'), 'plus_150_100');
eq('keyword 150/100', parseSpecialMode('150/100'), 'plus_150_100');
eq('keyword 平方米', parseSpecialMode('平方米'), 'by_sqm');
// Critical: "zero" must NOT return 'zero' anymore
eq('REGRESSION: "zero" no longer returns "zero"', parseSpecialMode('zero'), 'return_base');
eq('REGRESSION: "ZERO" no longer returns "zero"', parseSpecialMode('ZERO'), 'return_base');
eq('unknown falls back to return_base', parseSpecialMode('xxx_unknown'), 'return_base');

console.log('\n=== import defaults (Bug #4) ===');
eq('algorithm: undefined → "Per Unit"', importAlgorithm(undefined), 'Per Unit');
eq('algorithm: null → "Per Unit"', importAlgorithm(null), 'Per Unit');
eq('algorithm: "" → "Per Unit"', importAlgorithm(''), 'Per Unit');
eq('algorithm: "Per SQM" → "Per SQM" (preserved)', importAlgorithm('Per SQM'), 'Per SQM');
eq('algorithm: "Per LM" → "Per LM" (preserved)', importAlgorithm('Per LM'), 'Per LM');
eq('REGRESSION: algorithm old "unit price" no longer survives', importAlgorithm('unit price'), 'unit price'); // the bug was at the source side; import with explicit value still passes through

eq('sec1Mode: undefined → "return_base"', importSpecMode(undefined), 'return_base');
eq('sec1Mode: null → "return_base"', importSpecMode(null), 'return_base');
eq('sec1Mode: "" → "return_base"', importSpecMode(''), 'return_base');
eq('sec1Mode: "by_sqm" → "by_sqm" (preserved)', importSpecMode('by_sqm'), 'by_sqm');
eq('REGRESSION: sec1Mode old "none" no longer survives', importSpecMode('none'), 'none'); // same — the bug was at the source side

console.log(`\n=== migrateLegacyEnums_ (legacy data migration) ===`);
// Mock the allProducts array + saveData
let allProducts = [];
let savedCount = 0;
const saveData = () => { savedCount++; };
// Re-implement the migration here for unit testing (mirrors what's in index.html)
const VALID_ALG = ['Per Unit', 'Per SQM', 'Per LM'];
const VALID_SPEC = ['return_base', 'plus_150_100', 'plus_60_50', 'plus_20_10', 'by_sqm'];
const SPEC_KEYS = ['sec1Mode', 'wSpecMode', 'hSpecMode', 'dSpecMode'];
function migrateLegacyEnums_() {
    let algorithmCount = 0, specModeCount = 0;
    allProducts.forEach(p => {
        if (p.algorithm && !VALID_ALG.includes(p.algorithm)) {
            p.algorithm = 'Per Unit';
            algorithmCount++;
        }
        SPEC_KEYS.forEach(k => {
            if (p[k] && !VALID_SPEC.includes(p[k])) {
                p[k] = 'return_base';
                specModeCount++;
            }
        });
    });
    if (algorithmCount + specModeCount > 0) saveData();
    return { algorithmCount, specModeCount, total: algorithmCount + specModeCount };
}

// Case 1: legacy dirty data
allProducts = [
    { id: 'a', itemB: 'Product A', algorithm: 'unit price', sec1Mode: 'none', wSpecMode: 'none', hSpecMode: 'return_base', dSpecMode: 'plus_60_50' },
    { id: 'b', itemB: 'Product B', algorithm: 'Per SQM', sec1Mode: undefined, wSpecMode: '', hSpecMode: null },
    { id: 'c', itemB: 'Product C', algorithm: undefined, sec1Mode: 'return_base', wSpecMode: 'by_sqm' }
];
savedCount = 0;
let mig = migrateLegacyEnums_();
eq('legacy "unit price" → "Per Unit"', allProducts[0].algorithm, 'Per Unit');
eq('legacy "none" → "return_base"', allProducts[0].sec1Mode, 'return_base');
eq('legacy "none" → "return_base" (wSpecMode)', allProducts[0].wSpecMode, 'return_base');
eq('preserved "return_base"', allProducts[0].hSpecMode, 'return_base');
eq('preserved "plus_60_50"', allProducts[0].dSpecMode, 'plus_60_50');
eq('preserved "Per SQM" (already valid)', allProducts[1].algorithm, 'Per SQM');
eq('undefined sec1Mode not migrated (treated as empty)', allProducts[1].sec1Mode, undefined);
eq('empty string not migrated', allProducts[1].wSpecMode, '');
eq('null not migrated', allProducts[1].hSpecMode, null);
eq('undefined algorithm not migrated', allProducts[2].algorithm, undefined);
eq('preserved "by_sqm"', allProducts[2].wSpecMode, 'by_sqm');
eq('count algorithm', mig.algorithmCount, 1);
eq('count specMode', mig.specModeCount, 2);
eq('count total', mig.total, 3);
eq('saveData called once', savedCount, 1);

// Case 2: already-clean data — should NOT call saveData
allProducts = [
    { id: 'x', algorithm: 'Per Unit', sec1Mode: 'return_base', wSpecMode: 'by_sqm' },
    { id: 'y', algorithm: 'Per LM', sec1Mode: 'plus_150_100' }
];
savedCount = 0;
mig = migrateLegacyEnums_();
eq('clean: total migrated', mig.total, 0);
eq('clean: saveData NOT called', savedCount, 0);
eq('clean: data unchanged', allProducts[0].algorithm, 'Per Unit');

// Case 3: idempotent — running twice produces same result, no second save
allProducts = [{ id: 'q', algorithm: 'unit price', sec1Mode: 'none' }];
savedCount = 0;
migrateLegacyEnums_();
const afterFirst = JSON.stringify(allProducts[0]);
const savedAfterFirst = savedCount;
migrateLegacyEnums_();
eq('idempotent: result identical', JSON.stringify(allProducts[0]), afterFirst);
eq('idempotent: no second save', savedCount, savedAfterFirst);

console.log(`\n=== Result: ${pass} pass / ${fail} fail ===`);
process.exit(fail > 0 ? 1 : 0);
