import { http, HttpResponse, HttpHandler } from 'msw';
import { DEFAULT_PLATFORM_URL_DEV } from '../../../src/utils/api';
import { Status } from '../../../src/utils/api.types';

// Common response structures
const commonResponses = {
  success: { data: 'test data' },
  error: { message: 'API Error' },
  workflow: {
    completed: {
      status: Status.Completed,
      workflow_id: 'test-workflow-id',
      result: {
        merged_text: 'test result',
        original_text: 'test content',
        errors: [],
        final_scores: { acrolinx_score: null, content_score: null },
        initial_scores: { acrolinx_score: null, content_score: null },
        results: [],
      },
    },
    failed: { status: Status.Failed, workflow_id: 'test-workflow-id' },
    running: { status: Status.Running, workflow_id: 'test-workflow-id' },
  },
};

// Type definitions for handlers
type ApiHandlers = {
  demo: {
    rewrite: {
      submit: HttpHandler;
      poll: HttpHandler;
      failed: HttpHandler;
      emptyWorkflowId: HttpHandler;
    };
    check: {
      submit: HttpHandler;
      poll: HttpHandler;
      failed: HttpHandler;
      emptyWorkflowId: HttpHandler;
    };
  };
  internal: {
    constants: {
      success: HttpHandler;
      error: HttpHandler;
    };
    feedback: {
      success: HttpHandler;
      error: HttpHandler;
    };
  };
  style: {
    guides: {
      success: HttpHandler;
      error: HttpHandler;
      getSuccess: HttpHandler;
      getError: HttpHandler;
      createSuccess: HttpHandler;
      createError: HttpHandler;
      updateSuccess: HttpHandler;
      updateError: HttpHandler;
      deleteSuccess: HttpHandler;
      deleteError: HttpHandler;
    };
    checks: {
      success: HttpHandler;
      error: HttpHandler;
      poll: HttpHandler;
    };
    suggestions: {
      success: HttpHandler;
      error: HttpHandler;
      poll: HttpHandler;
    };
    rewrites: {
      success: HttpHandler;
      error: HttpHandler;
      poll: HttpHandler;
    };
  };
  api: {
    success: {
      get: HttpHandler;
      post: HttpHandler;
      put: HttpHandler;
      delete: HttpHandler;
    };
    error: {
      detail: HttpHandler;
      message: HttpHandler;
      noMessage: HttpHandler;
      network: HttpHandler;
    };
    workflow: {
      completed: HttpHandler;
      failed: HttpHandler;
      running: HttpHandler;
      apiError: HttpHandler;
    };
  };
};

// Demo API handlers
const demoHandlers = {
  rewrite: {
    submit: http.post(`${DEFAULT_PLATFORM_URL_DEV}/v1/rewrites/`, () => {
      return HttpResponse.json({
        status: Status.Running,
        workflow_id: 'test-workflow-id',
        message: 'Rewrite workflow started successfully.',
      });
    }),
    poll: http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/rewrites/:workflowId`, () => {
      return HttpResponse.json(commonResponses.workflow.completed);
    }),
    failed: http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/rewrites/:workflowId`, () => {
      return HttpResponse.json({
        status: Status.Failed,
        workflow_id: 'test-workflow-id',
        message: 'Rewrite failed with status: failed',
      });
    }),
    emptyWorkflowId: http.post(`${DEFAULT_PLATFORM_URL_DEV}/v1/rewrites/`, () => {
      return HttpResponse.json({ status: Status.Running });
    }),
  },
  check: {
    submit: http.post(`${DEFAULT_PLATFORM_URL_DEV}/v1/checks/`, () => {
      return HttpResponse.json({
        status: Status.Running,
        workflow_id: 'test-workflow-id',
        message: 'Check workflow started successfully.',
      });
    }),
    poll: http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/checks/:workflowId`, () => {
      return HttpResponse.json(commonResponses.workflow.completed);
    }),
    failed: http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/checks/:workflowId`, () => {
      return HttpResponse.json({
        status: Status.Failed,
        workflow_id: 'test-workflow-id',
        message: 'Check failed with status: failed',
      });
    }),
    emptyWorkflowId: http.post(`${DEFAULT_PLATFORM_URL_DEV}/v1/checks/`, () => {
      return HttpResponse.json({ status: Status.Running });
    }),
  },
};

// Internal API handlers
const internalHandlers = {
  constants: {
    success: http.get(`${DEFAULT_PLATFORM_URL_DEV}/internal/v1/constants`, () => {
      return HttpResponse.json({
        dialects: ['american_english', 'british_english'],
        tones: ['formal', 'casual'],
        style_guides: {
          'style-1': 'ap',
          'style-2': 'chicago',
        },
        colors: {
          green: { value: 'rgb(120, 253, 134)', min_score: 80 },
          yellow: { value: 'rgb(246, 240, 104)', min_score: 60 },
          red: { value: 'rgb(235, 94, 94)', min_score: 0 },
        },
      });
    }),
    error: http.get(`${DEFAULT_PLATFORM_URL_DEV}/internal/v1/constants`, () => {
      return HttpResponse.json({ message: 'Failed to get admin constants' }, { status: 500 });
    }),
  },
  feedback: {
    success: http.post(`${DEFAULT_PLATFORM_URL_DEV}/internal/v1/demo-feedback`, () => {
      return HttpResponse.json({ success: true });
    }),
    error: http.post(`${DEFAULT_PLATFORM_URL_DEV}/internal/v1/demo-feedback`, () => {
      return HttpResponse.json({ message: 'Failed to submit feedback' }, { status: 500 });
    }),
  },
};

// Style API handlers
const styleHandlers = {
  guides: {
    success: http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides`, () => {
      return HttpResponse.json([
        {
          id: 'test-style-guide-id',
          name: 'Test Style Guide',
          created_at: '2025-06-20T11:46:30.537Z',
          created_by: 'test-user',
          status: 'running',
          updated_at: '2025-06-20T11:46:30.537Z',
          updated_by: 'test-user',
        },
      ]);
    }),
    error: http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides`, () => {
      return HttpResponse.json({ message: 'Failed to list style guides' }, { status: 500 });
    }),
    getSuccess: http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides/:styleGuideId`, () => {
      return HttpResponse.json({
        id: 'test-style-guide-id',
        name: 'Test Style Guide',
        created_at: '2025-06-20T11:46:30.537Z',
        created_by: 'test-user',
        status: 'running',
        updated_at: '2025-06-20T11:46:30.537Z',
        updated_by: 'test-user',
      });
    }),
    getError: http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides/:styleGuideId`, () => {
      return HttpResponse.json({ message: 'Style guide not found' }, { status: 404 });
    }),
    createSuccess: http.post(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides`, async ({ request }) => {
      // Verify that the request contains FormData with file_upload and name
      const formData = await request.formData();
      const file = formData.get('file_upload') as File;
      const name = formData.get('name') as string;

      if (!file || !name) {
        return HttpResponse.json({ message: 'Missing required fields: file_upload and name' }, { status: 400 });
      }

      return HttpResponse.json({
        id: 'new-style-guide-id',
        name: name,
        created_at: '2025-06-20T11:46:30.537Z',
        created_by: 'test-user',
        status: 'running',
        updated_at: '2025-06-20T11:46:30.537Z',
        updated_by: 'test-user',
      });
    }),
    createError: http.post(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides`, () => {
      return HttpResponse.json({ message: 'Failed to create style guide' }, { status: 400 });
    }),
    updateSuccess: http.put(
      `${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides/:styleGuideId`,
      async ({ request, params }) => {
        // Verify that the request contains JSON with name
        const body = (await request.json()) as { name?: string };

        if (!body?.name) {
          return HttpResponse.json({ message: 'Missing required field: name' }, { status: 400 });
        }

        return HttpResponse.json({
          id: params.styleGuideId,
          name: body.name,
          created_at: '2025-06-20T11:46:30.537Z',
          created_by: 'test-user',
          status: 'running',
          updated_at: '2025-06-20T12:00:00.000Z',
          updated_by: 'test-user',
        });
      },
    ),
    updateError: http.put(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides/:styleGuideId`, () => {
      return HttpResponse.json({ message: 'Failed to update style guide' }, { status: 400 });
    }),
    deleteSuccess: http.delete(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides/:styleGuideId`, () => {
      return new HttpResponse(null, { status: 204 });
    }),
    deleteError: http.delete(`${DEFAULT_PLATFORM_URL_DEV}/v1/style-guides/:styleGuideId`, () => {
      return HttpResponse.json({ message: 'Failed to delete style guide' }, { status: 404 });
    }),
  },
  checks: {
    success: http.post(`${DEFAULT_PLATFORM_URL_DEV}/v1/style/checks`, () => {
      return HttpResponse.json({
        status: Status.Running,
        workflow_id: 'test-workflow-id',
        message: 'Style check workflow started successfully.',
      });
    }),
    error: http.post(`${DEFAULT_PLATFORM_URL_DEV}/v1/style/checks`, () => {
      return HttpResponse.json({ message: 'Could not validate credentials' }, { status: 401 });
    }),
    poll: http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/style/checks/:workflowId`, () => {
      return HttpResponse.json({
        status: Status.Completed,
        style_guide_id: 'test-style-guide-id',
        scores: {
          quality: {
            score: 80,
          },
          clarity: {
            score: 75,
            word_count: 75,
            sentence_count: 5,
            average_sentence_length: 15,
            flesch_reading_ease: 80,
            vocabulary_complexity: 85,
          },
          grammar: {
            score: 90,
            issues: 1,
          },
          style_guide: {
            score: 85,
            issues: 0,
          },
          tone: {
            score: 70,
            informality: 30,
            liveliness: 60,
          },
        },
        issues: [
          {
            original: 'This is a test sentence.',
            char_index: 0,
            subcategory: 'passive_voice',
            category: 'grammar',
          },
        ],
        check_options: {
          style_guide: {
            style_guide_type: 'ap',
            style_guide_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          },
          dialect: 'american_english',
          tone: 'academic',
        },
      });
    }),
  },
  suggestions: {
    success: http.post(`${DEFAULT_PLATFORM_URL_DEV}/v1/style/suggestions`, () => {
      return HttpResponse.json({
        status: Status.Running,
        workflow_id: 'test-workflow-id',
        message: 'Style suggestions workflow started successfully.',
      });
    }),
    error: http.post(`${DEFAULT_PLATFORM_URL_DEV}/v1/style/suggestions`, () => {
      return HttpResponse.json({ message: 'Could not validate credentials' }, { status: 401 });
    }),
    poll: http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/style/suggestions/:workflowId`, () => {
      return HttpResponse.json({
        status: Status.Completed,
        style_guide_id: 'test-style-guide-id',
        scores: {
          quality: {
            score: 80,
          },
          clarity: {
            score: 75,
            word_count: 75,
            sentence_count: 5,
            average_sentence_length: 15,
            flesch_reading_ease: 80,
            vocabulary_complexity: 85,
          },
          grammar: {
            score: 90,
            issues: 1,
          },
          style_guide: {
            score: 85,
            issues: 0,
          },
          tone: {
            score: 70,
            informality: 30,
            liveliness: 60,
          },
        },
        issues: [
          {
            original: 'This is a test sentence.',
            char_index: 0,
            subcategory: 'passive_voice',
            category: 'grammar',
            suggestion: 'This sentence should be rewritten.',
          },
        ],
        check_options: {
          style_guide: {
            style_guide_type: 'ap',
            style_guide_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          },
          dialect: 'american_english',
          tone: 'academic',
        },
      });
    }),
  },
  rewrites: {
    success: http.post(`${DEFAULT_PLATFORM_URL_DEV}/v1/style/rewrites`, () => {
      return HttpResponse.json({
        status: Status.Running,
        workflow_id: 'test-workflow-id',
        message: 'Style rewrite workflow started successfully.',
      });
    }),
    error: http.post(`${DEFAULT_PLATFORM_URL_DEV}/v1/style/rewrites`, () => {
      return HttpResponse.json({ message: 'Could not validate credentials' }, { status: 401 });
    }),
    poll: http.get(`${DEFAULT_PLATFORM_URL_DEV}/v1/style/rewrites/:workflowId`, () => {
      return HttpResponse.json({
        status: Status.Completed,
        style_guide_id: 'test-style-guide-id',
        scores: {
          quality: {
            score: 80,
          },
          clarity: {
            score: 75,
            word_count: 75,
            sentence_count: 5,
            average_sentence_length: 15,
            flesch_reading_ease: 80,
            vocabulary_complexity: 85,
          },
          grammar: {
            score: 90,
            issues: 1,
          },
          style_guide: {
            score: 85,
            issues: 0,
          },
          tone: {
            score: 70,
            informality: 30,
            liveliness: 60,
          },
        },
        issues: [
          {
            original: 'This is a test sentence.',
            char_index: 0,
            subcategory: 'passive_voice',
            category: 'grammar',
            suggestion: 'This sentence should be rewritten.',
          },
        ],
        check_options: {
          style_guide: {
            style_guide_type: 'ap',
            style_guide_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
          },
          dialect: 'american_english',
          tone: 'academic',
        },
        rewrite: 'This is an improved test sentence.',
        rewrite_scores: {
          quality: {
            score: 85,
          },
          clarity: {
            score: 80,
            word_count: 75,
            sentence_count: 5,
            average_sentence_length: 15,
            flesch_reading_ease: 85,
            vocabulary_complexity: 90,
          },
          grammar: {
            score: 95,
            issues: 0,
          },
          style_guide: {
            score: 90,
            issues: 0,
          },
          tone: {
            score: 75,
            informality: 25,
            liveliness: 65,
          },
        },
      });
    }),
  },
};

// API utility handlers
const apiUtilityHandlers = {
  success: {
    get: http.get('*/test-endpoint', () => {
      return HttpResponse.json(commonResponses.success);
    }),
    post: http.post('*/test-endpoint', () => {
      return HttpResponse.json(commonResponses.success);
    }),
    put: http.put('*/test-endpoint', () => {
      return HttpResponse.json(commonResponses.success);
    }),
    delete: http.delete('*/test-endpoint', () => {
      return HttpResponse.json(commonResponses.success);
    }),
  },
  error: {
    detail: http.get('*/error-detail', () => {
      return HttpResponse.json({ detail: 'API Error' }, { status: 400 });
    }),
    message: http.get('*/error-message', () => {
      return HttpResponse.json({ message: 'API Error' }, { status: 400 });
    }),
    noMessage: http.get('*/error-nomsg', () => {
      return HttpResponse.json({}, { status: 400 });
    }),
    network: http.get('*/network-error', () => {
      return HttpResponse.error();
    }),
  },
  workflow: {
    completed: http.get('*/test-endpoint/:workflowId', () => {
      return HttpResponse.json({
        status: Status.Completed,
        workflow_id: 'test-workflow-id',
        result: {
          merged_text: 'test result',
          original_text: 'test content',
          errors: [],
          final_scores: { acrolinx_score: null, content_score: null },
          initial_scores: { acrolinx_score: null, content_score: null },
          results: [],
        },
      });
    }),
    failed: http.get('*/test-endpoint/:workflowId', () => {
      return HttpResponse.json({ status: Status.Failed, workflow_id: 'test-workflow-id' });
    }),
    running: http.get('*/test-endpoint/:workflowId', () => {
      return HttpResponse.json({ status: Status.Running, workflow_id: 'test-workflow-id' });
    }),
    apiError: http.get('*/test-endpoint/:workflowId', () => {
      return HttpResponse.json({ message: 'API Error' }, { status: 400 });
    }),
  },
};

// Export all handlers with type
export const apiHandlers: ApiHandlers = {
  demo: demoHandlers,
  internal: internalHandlers,
  style: styleHandlers,
  api: apiUtilityHandlers,
};
