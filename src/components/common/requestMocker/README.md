How to use mocking

###

1. Add `?dev` to URL
2. Select profiles from the right hand side menu.
3. Click apply and reload to use them.
4. Use the **Clear and close** button to reset mocked responses.

To share a scenario, link to a page with the scenario's name in `?dev`, e.g.
`/2nd-pillar-rejoin?dev=SECOND_PILLAR_REJOIN_RATE_AND_FUND`. Opening it mocks exactly that
scenario for the browser tab and drops the name from the address. The scenario survives a login
in the same tab, but not one that comes back in another tab or browser, such as Smart-ID on a phone.

How to add mocked request

####

1. Create new profile under `profiles/` similar to `user.ts`
2. Export profiles map from that file similar to `user.ts`
3. Add new profile to `types.ts` and to `mockModeProfiles` in `profiles/index.ts`
4. Use profile by adding mock decorator to getter, and provide profile mock name as key from previous step:

````
 return mockRequestInMockMode(getWithAuthentication(getEndpoint('/v1/me'), undefined), 'user');
```
````
