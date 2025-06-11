import { http, HttpResponse, HttpHandler } from 'msw';
import { PLATFORM_URL } from '../../../src/utils/api';
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
    submit: http.post(`${PLATFORM_URL}/v1/rewrites/`, () => {
      return HttpResponse.json({
        status: Status.Running,
        workflow_id: 'test-workflow-id',
        message: 'Rewrite workflow started successfully.',
      });
    }),
    poll: http.get(`${PLATFORM_URL}/v1/rewrites/:workflowId`, () => {
      return HttpResponse.json(commonResponses.workflow.completed);
    }),
    failed: http.get(`${PLATFORM_URL}/v1/rewrites/:workflowId`, () => {
      return HttpResponse.json({
        status: Status.Failed,
        workflow_id: 'test-workflow-id',
        message: 'Rewrite failed with status: failed',
      });
    }),
    emptyWorkflowId: http.post(`${PLATFORM_URL}/v1/rewrites/`, () => {
      return HttpResponse.json({ status: Status.Running });
    }),
  },
  check: {
    submit: http.post(`${PLATFORM_URL}/v1/checks/`, () => {
      return HttpResponse.json({
        status: Status.Running,
        workflow_id: 'test-workflow-id',
        message: 'Check workflow started successfully.',
      });
    }),
    poll: http.get(`${PLATFORM_URL}/v1/checks/:workflowId`, () => {
      return HttpResponse.json(commonResponses.workflow.completed);
    }),
    failed: http.get(`${PLATFORM_URL}/v1/checks/:workflowId`, () => {
      return HttpResponse.json({
        status: Status.Failed,
        workflow_id: 'test-workflow-id',
        message: 'Check failed with status: failed',
      });
    }),
    emptyWorkflowId: http.post(`${PLATFORM_URL}/v1/checks/`, () => {
      return HttpResponse.json({ status: Status.Running });
    }),
  },
};

// Internal API handlers
const internalHandlers = {
  constants: {
    success: http.get(`${PLATFORM_URL}/internal/v1/constants`, () => {
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
    error: http.get(`${PLATFORM_URL}/internal/v1/constants`, () => {
      return HttpResponse.json({ message: 'Failed to get admin constants' }, { status: 500 });
    }),
  },
  feedback: {
    success: http.post(`${PLATFORM_URL}/internal/v1/demo-feedback`, () => {
      return HttpResponse.json({ success: true });
    }),
    error: http.post(`${PLATFORM_URL}/internal/v1/demo-feedback`, () => {
      return HttpResponse.json({ message: 'Failed to submit feedback' }, { status: 500 });
    }),
  },
};

// Style API handlers
const styleHandlers = {
  guides: {
    success: http.get(`${PLATFORM_URL}/v1/style-guides`, () => {
      return HttpResponse.json({
        'test-style-guide-id': 'Test Style Guide',
      });
    }),
    error: http.get(`${PLATFORM_URL}/v1/style-guides`, () => {
      return HttpResponse.json({ message: 'Failed to list style guides' }, { status: 500 });
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
