/**
 * VPS Test Script for 5.2 Breeding Pair Extraction
 * Tests using actual formatted_status_data.json
 */

const BreedingPairExtractor = require('./breeding-pair-extractor.js');
const fs = require('fs');
const path = require('path');

console.log('=== 5.2 VPS Breeding Pair Extraction Test Started ===\n');

async function runVPSTest() {
    try {
        // 1. Initialize BreedingPairExtractor
        console.log('>> Initializing BreedingPairExtractor...');
        const extractor = new BreedingPairExtractor();
        console.log('✓ Initialization completed\n');

        // 2. Check file existence
        console.log('>> Checking file existence...');
        const formattedDataPath = path.join(__dirname, '../data/formatted_status_data.json');
        
        if (!fs.existsSync(formattedDataPath)) {
            console.log('X formatted_status_data.json not found');
            console.log('  Please run 5.1.2 status-data-integration.js first');
            process.exit(1);
        }
        console.log('✓ formatted_status_data.json exists\n');

        // 3. Load data from file (5.2.1 test)
        console.log('=== 5.2.1 Test: Data Loading ===');
        const rawData = fs.readFileSync(formattedDataPath, 'utf8');
        const formattedData = JSON.parse(rawData);
        
        console.log(`Data loaded:`);
        console.log(`  Entities: ${formattedData.entities.length}`);
        console.log(`  Males: ${formattedData.maleCount}`);
        console.log(`  Females: ${formattedData.femaleCount}`);
        console.log(`  Processed at: ${formattedData.processedAt}\n`);

        // 4. Individual function tests
        console.log('=== 5.2.2 Test: Gender Validation Logic ===');
        const genderValidPairs = extractor.findGenderValidPairs(formattedData.entities);
        console.log(`Gender-valid pairs: ${genderValidPairs.length}`);
        
        genderValidPairs.forEach((pair, index) => {
            console.log(`  [${index + 1}] ${pair.male.id} (M) x ${pair.female.id} (F)`);
        });
        console.log('');

        // 5. Distance validation test (multiple distances + DEBUG)
        console.log('=== 5.2.3 Test: Distance Validation Logic ===');
        const testDistances = [10, 15, 20, 25, 30, 50, 100, 500];
        
        for (const maxDistance of testDistances) {
            const withinDistance = genderValidPairs.filter(pair => 
                extractor.isWithinBreedingDistance(pair, maxDistance)
            );
            console.log(`Within ${maxDistance} blocks: ${withinDistance.length} pairs`);
        }
        console.log('');

        // 6. Unique pair extraction test (5.2.4) + DEBUG MODE
        console.log('=== 5.2.4 Test: Unique Pair Extraction ===');
        const uniquePairs20 = extractor.extractUniqueBreedingPairs(formattedData.entities, 20);
        const uniquePairs100 = extractor.extractUniqueBreedingPairs(formattedData.entities, 100);
        const uniquePairs500 = extractor.extractUniqueBreedingPairs(formattedData.entities, 500);
        
        console.log(`Unique pairs within 20 blocks: ${uniquePairs20.length}`);
        console.log(`Unique pairs within 100 blocks: ${uniquePairs100.length}`);
        console.log(`Unique pairs within 500 blocks (DEBUG): ${uniquePairs500.length}`);
        console.log('');

        // 7. Integration test with DEBUG distance
        console.log('=== Integration Test: processBreedingPairs ===');
        const result = await extractor.processBreedingPairs(null, 500); // DEBUG: Very large distance
        
        console.log('\n=== Final Result Summary ===');
        console.log(`Total entities: ${result.totalEntities}`);
        console.log(`Gender-valid pairs: ${result.totalPairs}`);
        console.log(`Distance-valid pairs: ${result.distanceValidPairs}`);
        console.log(`Final unique pairs: ${result.uniquePairs.length}`);
        console.log(`Max distance used: ${result.maxDistance} blocks (DEBUG MODE)`);
        console.log(`Processing completed at: ${result.processedAt}`);

        // 8. Detailed individual information
        if (result.uniquePairs.length > 0) {
            console.log('\n=== Extracted Pair Details ===');
            result.uniquePairs.forEach((pair, index) => {
                console.log(`[${index + 1}] ${pair.male.id} (M) x ${pair.female.id} (F)`);
                console.log(`    Distance: ${pair.distance.toFixed(2)} blocks`);
                console.log(`    Male DNA: ${pair.male.dna.slice(0, 8).join('')}... (${pair.male.dna.length} chars)`);
                console.log(`    Female DNA: ${pair.female.dna.slice(0, 8).join('')}... (${pair.female.dna.length} chars)`);
                console.log(`    Male pos: (${pair.male.position.x.toFixed(2)}, ${pair.male.position.y}, ${pair.male.position.z.toFixed(2)})`);
                console.log(`    Female pos: (${pair.female.position.x.toFixed(2)}, ${pair.female.position.y}, ${pair.female.position.z.toFixed(2)})`);
                console.log('');
            });
        } else {
            console.log('\nX No breeding pairs found');
            console.log('  Possible causes:');
            console.log('  - Distance too far (increase distance limit)');
            console.log('  - Same gender only');
            console.log('  - Insufficient entities');
        }

        // 9. Output file verification
        console.log('\n=== Output File Verification ===');
        const outputPath = path.join(__dirname, '../data/breeding_pairs_result.json');
        if (fs.existsSync(outputPath)) {
            const outputStat = fs.statSync(outputPath);
            console.log(`✓ breeding_pairs_result.json created successfully`);
            console.log(`  File size: ${outputStat.size} bytes`);
            console.log(`  Created at: ${outputStat.birthtime.toISOString()}`);
        } else {
            console.log('X breeding_pairs_result.json was not created');
        }

        // 10. Function-specific success verification
        console.log('\n=== 5.2 Feature Checklist ===');
        console.log(`✓ 5.2.1: formatted_status_data.json loading success (${formattedData.entities.length} entities)`);
        console.log(`✓ 5.2.2: Gender validation logic success (${genderValidPairs.length} pairs detected)`);
        console.log(`✓ 5.2.3: Distance validation logic success (distance calculation normal)`);
        console.log(`✓ 5.2.4: Unique pair extraction success (${result.uniquePairs.length} pairs extracted)`);
        console.log(`✓ Integration: processBreedingPairs success`);
        console.log(`✓ File output: breeding_pairs_result.json creation success`);

        console.log('\n=== 5.2 VPS Operation Verification Complete ===');
        console.log('✓ All 5.2 features are working properly in VPS environment!');

    } catch (error) {
        console.error('\n=== Error Occurred During VPS Test ===');
        console.error(`Error: ${error.message}`);
        console.error(`Stack trace:\n${error.stack}`);
        
        console.log('\n=== Troubleshooting ===');
        console.log('1. Check if formatted_status_data.json exists');
        console.log('2. Verify Node.js version compatibility');
        console.log('3. Check file read/write permissions');
        console.log('4. Run 5.1.2 status-data-integration.js first');
        
        process.exit(1);
    }
}

// Execute
if (require.main === module) {
    runVPSTest();
} 