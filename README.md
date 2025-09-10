[![VSTS Build Status](https://sfa-gov-uk.visualstudio.com/_apis/public/build/definitions/aa44e142-c0ac-4ace-a6b2-0d9a3f35d516/707/badge)](https://sfa-gov-uk.visualstudio.com/DfE%20New%20Secure%20Access/_build/index?definitionId=707&_a=completed)

# login.dfe.jobs

Generic job processing service

## Testing

To run the unit tests

```
npm run test
```

## Testing locally

The current easiest way to test this is using the jobs-client. It's not a perfect solution, as you need to clone another repo to test functionality in this repo.

- Ensure you have https://github.com/DFE-Digital/login.dfe.jobs-client cloned. Also ensure you've installed its packages with `npm i`
- Start up a local redis container
- Start the jobs service
- Go to the `tools` folder in `login.dfe.jobs-client`
- Run one of the scripts in the folder, e.g., `node sendInvitation.js`

This also means that if you create a new job, it would be prudent to create a new script in this folder for easier testing in future.
