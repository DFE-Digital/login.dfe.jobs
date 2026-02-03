[![VSTS Build Status](https://sfa-gov-uk.visualstudio.com/_apis/public/build/definitions/aa44e142-c0ac-4ace-a6b2-0d9a3f35d516/707/badge)](https://sfa-gov-uk.visualstudio.com/DfE%20New%20Secure%20Access/_build/index?definitionId=707&_a=completed)

# login.dfe.jobs

Generic job processing service.

These jobs are invoked by putting a message into Redis. This repo then uses BullMQ to retrieve the messages and trigger these jobs.
If a new type of job is added, you will likely need to also add it to the [login.dfe.jobs-client](https://github.com/DFE-Digital/login.dfe.jobs-client)
as this is what is used to put the messages into Redis in a way that this repo can understand.

## Development

### Limiter feature

It's possible to limit the number of times a job can be invoked in a given timeframe. This is an optional feature
and is generally used when the service the job is calling has some sort of rate limiting/flood detection.

To use this, when setting up the handler for the job, include the `limiter` key in the setup. An example of this is:

```
const getHandler = (config, logger) => ({
  type: "my-request-type",
  limiter: {
    max: 100,
    duration: 300000,
  },
  processor: async (data) => {
    await process(config, logger, data);
  },
});
```

The `max` is the maximum number of times it the job will be invoked over the length of time specified by the `duration`.
The unit of measurement for `duration` is milliseconds.
In this example, the `my-request-type` job won't be invoked more than 100 times over a 5 minute period.

## Testing

### Unit tests

To run the unit tests

```
npm run test
```

### Testing locally

The current easiest way to test this is using the [jobs-client](https://github.com/DFE-Digital/login.dfe.jobs-client).
It's not a perfect solution, as you need to clone another repo to test functionality in this repo.

- Ensure you have https://github.com/DFE-Digital/login.dfe.jobs-client cloned. Also ensure you've installed its packages with `npm i`
- Start up a local redis container
- Start the jobs service
- Go to the `tools` folder in `login.dfe.jobs-client`
- Run one of the scripts in the folder, e.g., `node sendInvitation.js`

This also means that if you create a new job, it would be prudent to create a new script in this folder for easier testing in future.
