import {
  styleBatchCheckRequests,
  styleBatchSuggestions,
  styleBatchRewrites,
  styleBatchOperation,
  type StyleAnalysisReq,
  type BatchResponse,
  type BatchProgress,
} from '../src/api/style/style.api';
import { Config, PlatformType, Environment } from '../src/utils/api.types';

// Example configuration
const config: Config = {
  apiKey: 'your-api-key-here',
  platform: { type: PlatformType.Environment, value: Environment.Dev },
};

// Example style analysis requests
const styleRequests: StyleAnalysisReq[] = [
  {
    content: 'This is the first document for style analysis. It contains multiple sentences.',
    style_guide: 'ap',
    dialect: 'american_english',
    tone: 'formal',
    documentName: 'document-1.txt',
  },
  {
    content: 'Second document with different content and style requirements.',
    style_guide: 'chicago',
    dialect: 'american_english',
    tone: 'informal',
    documentName: 'document-2.txt',
  },
  {
    content: 'Third document using British English and formal tone.',
    style_guide: 'microsoft',
    dialect: 'british_english',
    tone: 'formal',
    documentName: 'document-3.txt',
  },
];

// Example 1: Basic batch style checking
async function basicBatchCheck() {
  console.log('Starting basic batch style check...');

  const batchResponse = styleBatchCheckRequests(styleRequests, config);

  // Monitor progress
  console.log(`Initial progress: ${batchResponse.progress.completed}/${batchResponse.progress.total} completed`);

  // Wait for completion
  const result = await batchResponse.promise;

  console.log(`Final result: ${result.completed} completed, ${result.failed} failed`);

  // Process results
  result.results.forEach((batchResult, index) => {
    if (batchResult.status === 'completed') {
      console.log(`Document ${index + 1}: Score ${batchResult.result!.scores.quality.score}`);
    } else {
      console.log(`Document ${index + 1}: Failed - ${batchResult.error!.message}`);
    }
  });
}

// Example 2: Batch processing with custom options
async function batchWithCustomOptions() {
  console.log('Starting batch with custom options...');

  const batchResponse = styleBatchCheckRequests(styleRequests, config, {
    maxConcurrent: 2, // Process 2 requests at a time
    retryAttempts: 3, // Retry failed requests up to 3 times
    retryDelay: 1000, // Wait 1 second between retries
  });

  const result = await batchResponse.promise;
  console.log(`Completed with custom options: ${result.completed} successful`);
}

// Example 3: Batch suggestions with progress monitoring
async function batchSuggestionsWithProgress() {
  console.log('Starting batch suggestions with progress monitoring...');

  const batchResponse = styleBatchSuggestions(styleRequests, config, {
    maxConcurrent: 1, // Process one at a time for easier monitoring
  });

  // Monitor progress in real-time
  const progressInterval = setInterval(() => {
    const progress = batchResponse.progress;
    console.log(`Progress: ${progress.completed}/${progress.total} completed, ${progress.inProgress} in progress`);

    if (progress.completed + progress.failed === progress.total) {
      clearInterval(progressInterval);
    }
  }, 1000);

  const result = await batchResponse.promise;
  clearInterval(progressInterval);

  console.log('Suggestions completed!');
  result.results.forEach((batchResult, index) => {
    if (batchResult.status === 'completed') {
      console.log(`Document ${index + 1}: ${batchResult.result!.issues.length} suggestions found`);
    }
  });
}

// Example 4: Batch rewrites with cancellation
async function batchRewritesWithCancellation() {
  console.log('Starting batch rewrites (will be cancelled)...');

  const batchResponse = styleBatchRewrites(styleRequests, config);

  // Cancel after 2 seconds
  setTimeout(() => {
    console.log('Cancelling batch operation...');
    batchResponse.cancel();
  }, 2000);

  try {
    const result = await batchResponse.promise;
    console.log('Batch completed successfully');
  } catch (error) {
    console.log('Batch was cancelled:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// Example 5: Generic batch operation
async function genericBatchOperation() {
  console.log('Starting generic batch operation...');

  // Type-safe batch operation
  const batchResponse = styleBatchOperation(
    styleRequests,
    config,
    { maxConcurrent: 3 },
    'check', // or 'suggestions' or 'rewrite'
  );

  const result = await batchResponse.promise;
  console.log(`Generic operation completed: ${result.completed} successful`);
}

// Example 6: Error handling and recovery
async function batchWithErrorHandling() {
  console.log('Starting batch with error handling...');

  const requestsWithPotentialErrors = [
    ...styleRequests,
    {
      content: '', // Empty content might cause issues
      style_guide: 'ap',
      dialect: 'american_english',
      tone: 'formal',
    },
    {
      content: 'Valid content',
      style_guide: 'invalid_style_guide', // Invalid style guide
      dialect: 'american_english',
      tone: 'formal',
    },
  ];

  const batchResponse = styleBatchCheckRequests(requestsWithPotentialErrors, config);
  const result = await batchResponse.promise;

  console.log(`Error handling result: ${result.completed} successful, ${result.failed} failed`);

  // Process successful results
  const successfulResults = result.results.filter((r) => r.status === 'completed');
  console.log(`Successfully processed ${successfulResults.length} documents`);

  // Process failed results
  const failedResults = result.results.filter((r) => r.status === 'failed');
  failedResults.forEach((failedResult, index) => {
    console.log(`Failed document ${index + 1}: ${failedResult.error!.message}`);
  });
}

// Example 7: Large batch processing
async function largeBatchProcessing() {
  console.log('Starting large batch processing...');

  // Create a larger batch
  const largeBatch: StyleAnalysisReq[] = Array(50)
    .fill(null)
    .map((_, index) => ({
      content: `Document ${index + 1}: This is test content for batch processing. It contains multiple sentences for analysis.`,
      style_guide: 'ap',
      dialect: 'american_english',
      tone: 'formal',
      documentName: `large-batch-doc-${index + 1}.txt`,
    }));

  const startTime = Date.now();
  const batchResponse = styleBatchCheckRequests(largeBatch, config, {
    maxConcurrent: 10, // Process 10 at a time
  });

  const result = await batchResponse.promise;
  const endTime = Date.now();

  console.log(`Large batch completed in ${endTime - startTime}ms`);
  console.log(`Results: ${result.completed} successful, ${result.failed} failed`);
  console.log(`Average time per document: ${(endTime - startTime) / result.total}ms`);
}

// Example 8: Real-time progress tracking
async function realTimeProgressTracking() {
  console.log('Starting real-time progress tracking...');

  const batchResponse = styleBatchCheckRequests(styleRequests, config);

  // Create a progress tracker
  let lastProgress = { completed: 0, failed: 0, inProgress: 0 };

  const progressTracker = setInterval(() => {
    const currentProgress = batchResponse.progress;

    // Only log if there's a change
    if (
      currentProgress.completed !== lastProgress.completed ||
      currentProgress.failed !== lastProgress.failed ||
      currentProgress.inProgress !== lastProgress.inProgress
    ) {
      console.log(
        `Progress Update: ${currentProgress.completed} completed, ${currentProgress.failed} failed, ${currentProgress.inProgress} in progress`,
      );
      lastProgress = { ...currentProgress };
    }

    // Stop tracking when complete
    if (currentProgress.completed + currentProgress.failed === currentProgress.total) {
      clearInterval(progressTracker);
    }
  }, 500);

  const result = await batchResponse.promise;
  clearInterval(progressTracker);

  console.log('Real-time tracking completed!');
  return result;
}

// Main execution function
async function runExamples() {
  console.log('=== Batch Processing Examples ===\n');

  try {
    await basicBatchCheck();
    console.log('\n---\n');

    await batchWithCustomOptions();
    console.log('\n---\n');

    await batchSuggestionsWithProgress();
    console.log('\n---\n');

    await batchRewritesWithCancellation();
    console.log('\n---\n');

    await genericBatchOperation();
    console.log('\n---\n');

    await batchWithErrorHandling();
    console.log('\n---\n');

    await realTimeProgressTracking();
    console.log('\n---\n');

    // Uncomment to run large batch (takes longer)
    // await largeBatchProcessing();
  } catch (error) {
    console.error('Example execution failed:', error);
  }
}

// Export for use in other modules
export {
  basicBatchCheck,
  batchWithCustomOptions,
  batchSuggestionsWithProgress,
  batchRewritesWithCancellation,
  genericBatchOperation,
  batchWithErrorHandling,
  largeBatchProcessing,
  realTimeProgressTracking,
  runExamples,
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().catch(console.error);
}
