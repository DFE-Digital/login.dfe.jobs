# login.dfe.jobs

[![Build Status](https://dfe-ssp.visualstudio.com/S141-Dfe-Signin/_apis/build/status%2FBackend%20tier%2Flogin.dfe.jobs?repoName=DFE-Digital%2Flogin.dfe.jobs&branchName=main)](https://dfe-ssp.visualstudio.com/S141-Dfe-Signin/_build/latest?definitionId=1866&repoName=DFE-Digital%2Flogin.dfe.jobs&branchName=main)

Job processing service for the DfE Sign-in platform.

## Overview

This service manages the asynchronous processing of jobs (small, self-contained pieces of work) within the DfE Sign-in platform using a queue-based architecture. It enables other services in the platform to offload time-consuming or resource-intensive tasks, ensuring responsive user experiences and reliable background processing.

### What is a Job?

A job represents a discrete unit of work that can be processed asynchronously, such as:

- Sending notification emails
- Synchronising user data with external legacy services (GIAS, COLLECT, S2S) by invoking third-party APIs with retry logic (wsOrganisation, wsUser & wsRole)
- Performing batch updates
- Data migrations or transformations

### What Jobs are supported?

| Type                                        | Location                            | Notes                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **External legacy service integrations**    | .\src\handlers\serviceNotifications | Handlers for organisation, users and role synchronisation with GIAS, COLLECT and School 2 School (S2S)                                                                                                                                                                                                  |
| **Email notifications**                     | .\src\handlers\notifications        | Email based notifications for invitations, service/sub-service access requests, user service removals, organisation approver status change, pre-Entra user account self-service and support escalation (e.g. overdue requests) using [GovNotify](https://www.notifications.service.gov.uk/ "GovNotify") |
| **New user invitations via DSi Public API** | .\src\handlers\publicAPI\invite     | Handlers to invite users via the public API                                                                                                                                                                                                                                                             |

**NOTE:** A full detailed list of supported jobs can be found in the .\src\handlers folder.

## Architecture Overview

### System Purpose

The `login.dfe.jobs` service is the asynchronous job processing engine for the DfE Sign-in platform. It manages background tasks including sending notifications, processing invitations, and synchronizing data with external services. Jobs are queued in Redis using BullMQ and processed by dedicated workers based on job type.

### Core Components

**MonitorBull (Job Queue Manager)**: The central orchestrator that creates and manages BullMQ Workers. Each worker corresponds to a specific job type and continuously polls its dedicated Redis queue for new jobs. MonitorBull handles rate limiting, job routing, graceful shutdown, and error recovery.

**Job Handler Registry**: A collection of specialized handlers organized into three categories:

- **Notifications Handlers**: User-facing communications including access requests, profile changes, password resets, registrations, service additions/removals, and support tickets
- **Public API Handlers**: Public invitation flows including invitation requests, completion workflows, and relying party notifications
- **Service Notifications Handlers**: Service-to-service communications for organisation updates, role changes, and user synchronization with external applications

**BullMQ/Redis Integration**: Jobs are stored in type-specific Redis queues. Each job type gets its own queue (e.g., `notifications_v1`, `userupdated_v1`, `roleupdated_v1`). BullMQ Workers poll these queues and retrieve jobs for processing.

### Job Processing Workflow

Jobs flow through the system in the following sequence:

1. **Enqueueing**: DfE Sign-in platform services (Interactions, Profile, Services, Access) enqueue jobs using the `login.dfe.jobs-client` library, which formats messages and sends them to Redis
2. **Queue Storage**: Job data is written to a type-specific Redis queue managed by BullMQ
3. **Worker Polling**: The MonitorBull-managed worker for that job type retrieves the message from Redis
4. **Rate Limiting**: If configured, the rate limiter checks whether the job can proceed based on the defined policy (max invocations per time window)
5. **Job Routing**: MonitorBull routes the job to the appropriate registered processor based on job type
6. **Handler Execution**: The specific handler processes the job data, which may involve sending emails via GOV.UK Notify, calling external APIs, updating databases, or enqueueing follow-up jobs
7. **Completion**: Successful jobs are marked complete and removed from Redis after a TTL period (1 hour or 50 jobs). Failed jobs are retried with exponential backoff. Jobs exceeding max retries are moved to a failed queue for inspection (retained for 12 hours)

### External Integrations

**GOV.UK Notify**: Used for sending emails and SMS messages using predefined templates. Handles user notifications for registrations, password resets, access requests, and service changes.

**External Service Applications**: The service makes webhook calls to relying parties and external service applications to notify them of user, role, and organisation changes.

**Databases**: Jobs may interact with SQL databases for persistent storage, audit logging, and retrieving configuration data.

### Error Handling and Resilience

The service implements robust error handling with automatic retries using exponential backoff for transient failures. Jobs that fail repeatedly are moved to a failed queue where they can be inspected and manually retried if needed. All errors are logged with structured context including job ID, handler type, and full stack traces. The service supports graceful shutdown, ensuring in-flight jobs complete before the service stops.

### Monitoring and Operations

The service exposes a health check endpoint at `/healthcheck` for monitoring service availability. It integrates with Azure Application Insights for telemetry, error tracking, and performance monitoring. All job processing events are logged with structured JSON including correlation IDs for request tracing. BullMQ provides built-in metrics for job success/failure rates and processing times.

### Configuration

The service is configured via environment variables including Redis connection strings, GOV.UK Notify API credentials, etc.

### Job Lifecycle States

Jobs transition through several states during their lifecycle. A successful job moves from `waiting` to `active` to `completed` and is then removed from the queue. A failed job moves from `waiting` to `active` to `failed`, where it may be retried (returning to `active`) or, after exceeding max retry attempts, becomes permanently failed and is retained for 12 hours before removal.

This service is essential to the DfE Sign-in platform's reliability and user experience, ensuring that time-consuming operations don't block user interactions and that important notifications are reliably delivered even in the face of transient failures.

### How It Works

1. **Job Submission**: Other DfE Sign-in services enqueue jobs by publishing messages to Redis using the [login.dfe.jobs-client](https://github.com/DFE-Digital/login.dfe.jobs-client) library. This client formats messages in a standardized way that this service can process.

2. **Message Retrieval**: This service uses [BullMQ](https://docs.bullmq.io/), a robust Redis-based queue library, to poll for and retrieve job messages from Redis.

3. **Job Processing**: When a message is retrieved, BullMQ routes it to the appropriate job handler based on the job type. Each handler contains the business logic specific to that job type.

4. **Completion**: Once processed, the job is marked as complete and removed from the queue.

### Job Types

Each job type is identified by a unique `type` string. When adding a new job type:

- Define a handler in this repository with the processing logic
- Add corresponding enqueueing logic to [login.dfe.jobs-client](https://github.com/DFE-Digital/login.dfe.jobs-client)
- Ensure both repositories use the same `type` identifier

## Error Handling

### Retry Mechanism

BullMQ provides built-in retry functionality for failed jobs:

- **Automatic Retries**: Jobs that fail due to transient errors (network issues, temporary service unavailability) are automatically retried
- **Exponential Backoff**: Retry delays increase exponentially to avoid overwhelming struggling services
- **Max Attempts**: Jobs are retried a configurable number of times before being marked as permanently failed

### Failed Job Management

- **Dead Letter Queue**: Jobs that exceed max retry attempts are moved to a failed jobs queue for inspection
- **Logging**: All failures are logged with full context (job data, error messages, stack traces) for debugging

## Progress Reporting

### Job States

Jobs transition through the following states:

- **Waiting**: Queued and awaiting processing
- **Active**: Currently being processed
- **Completed**: Successfully finished
- **Failed**: Processing failed after retries
- **Delayed**: Scheduled for future processing (if using delayed jobs)

### Monitoring

- **Logs**: Structured logging provides visibility into job processing, including start times, durations, and outcomes
- **BullMQ Dashboard**: (If enabled) provides a web UI for monitoring queue health, job states, and performance metrics
- **Metrics**: Job counts, processing times, and failure rates can be exposed for integration with monitoring platforms

## Development

In this example, my-request-type jobs will execute at most 100 times per 5-minute window. Additional jobs will wait in the queue until the time window resets.

### Adding a New Job Type

In this example we're going to add a new `notifications` type of job, but the same steps are taken when doing
`public-api` or `serviceNotifications` jobs

1. **Create a handler** in this repository:

```javascript
// src/handlers/notifications/myNewJob.js
const getHandler = (config, logger) => ({
  type: "my-new-job",
  processor: async (data) => {
    logger.info(`Processing job with data: ${JSON.stringify(data)}`);
    // Your business logic here
  },
});
module.exports = getHandler;
```

2. **Register the handler** in the main application setup

```javascript
// src/handlers/notifications/index.js
const myNewJob = require("./myNewJob");

const register = (config, logger) => {
  const myNewHandler = myNewJob.register(config, logger);

  return [...myNewHander];
};
```

3. **Add function to [login.dfe.jobs-client](https://github.com/DFE-Digital/login.dfe.jobs-client)** to allow applications to invoke this job type

```javascript
// lib/NotificationClient.js
async sendMyNewJob(
  userEmail,
) {
  await send(
    "my-new-job",
    {
      userEmail,
    },
    this.connectionString,
  );
}
```

### Rate Limiting with the Limiter Feature

Some external services have rate limits or flood detection. To prevent overwhelming these services, you can limit how frequently a job type executes.

When defining a job handler, include the optional `limiter` configuration:

```javascript
const getHandler = (config, logger) => ({
  type: "my-request-type",
  limiter: {
    max: 100, // Maximum invocations
    duration: 300000, // Time window in milliseconds (5 minutes)
  },
  processor: async (data) => {
    await process(config, logger, data);
  },
});
```

## Testing

### Unit Tests

Run the unit test suite:

```bash
npm run test
```

### Testing changes locally

The current easiest way to test this is using the jobs-client. It's not a perfect solution, as you need to clone another repo to test functionality in this repo.

- Ensure you have https://github.com/DFE-Digital/login.dfe.jobs-client cloned. Also ensure you've installed its packages with `npm i`
- Either start up a local redis container or point the jobs service at the DEV instance of Redis
- Start the `jobs` service
- Go to the `tools` folder in `login.dfe.jobs-client`
- Run one of the scripts in the folder, e.g., `node sendInvitation.js`

This also means that if you create a new job, it would be prudent to create a new script in this folder for easier testing in future.

If you want to use a local version of redis, this can be easily started with the following command:

```bash
docker run -p 6379:6379 redis-stack-server:latest
```
