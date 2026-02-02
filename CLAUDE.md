# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a GitHub Pages-hosted web application that integrates Actionstep (legal practice management software) with Zapier webhooks. The application is designed to be embedded as an iframe within Actionstep custom fields to facilitate data collection and automation workflows.

## Architecture

### Dual Communication System

The project implements a bidirectional postMessage communication architecture:

1. **Actionstep API Proxy Pattern** (actionstep-proxy.js + actionstep-client.js)
   - `actionstep-proxy.js` is injected into Actionstep's custom fields and acts as a proxy
   - It creates an iframe embedding the GitHub Pages site and handles cross-origin API requests
   - `actionstep-client.js` runs within the iframe and communicates with the proxy via postMessage
   - This circumvents CORS restrictions by making API calls from within the Actionstep domain
   - The client uses a request/response pattern with unique request IDs and promise-based async handling

2. **Parent Form Integration Pattern** (index.html)
   - The main form (index.html) is embedded as an iframe within another parent form
   - Uses postMessage to check if parent form exists (`CHECK_FORM_EXISTS` / `FORM_EXISTS_RESPONSE`)
   - Requests dynamic form data from parent before Zapier submission (`REQUEST_FORM_DATA` / `FORM_DATA_RESPONSE`)
   - Triggers parent form submission on successful Zapier webhook response (`TRIGGER_PARENT_SUBMIT`)
   - Form fields are populated via URL query parameters (action_id, user_email, premises, tenant, client)

### File Structure

- **index.html**: Primary form with Zapier webhook integration. Embedded as iframe in parent forms. Handles lease entry workflow (new/update).
- **test.html**: Simplified version of index.html without parent form checks (v0.4 vs v0.3)
- **api.html**: Demo/test page for Actionstep API integration using actionstep-client.js
- **actionstep-client.js**: Client-side library for making authenticated API requests through the proxy
- **actionstep-proxy.js**: Proxy script to be injected into Actionstep that handles cross-origin API requests
- **js-auth-jotform.html**: JotForm authentication demo (appears unused in main workflow)

## Configuration Requirements

### For actionstep-proxy.js
Before deploying to Actionstep, update these constants:
```javascript
const IFRAME_ORIGIN = 'https://YOUR-USERNAME.github.io';
const IFRAME_URL = 'https://YOUR-USERNAME.github.io/YOUR-REPO-NAME';
```

### For actionstep-client.js
The parent origin is hardcoded:
```javascript
this.parentOrigin = 'https://ap-southeast-2.actionstep.com';
```

### Zapier Webhook
The webhook URL in index.html and test.html:
```html
<form action="https://hooks.zapier.com/hooks/catch/23018023/ukayq6y/" method="POST">
```

## Security Considerations

- Both proxy and client implement origin checking to prevent unauthorized postMessage communication
- API requests automatically include httpOnly cookies via `credentials: 'include'`
- Messages from unknown origins are rejected with console warnings
- 30-second timeout on all API requests

## Deployment

This is a static site hosted on GitHub Pages. To deploy:
1. Push changes to the main branch
2. GitHub Pages automatically serves from the root directory
3. Update actionstep-proxy.js configuration with the correct GitHub Pages URL
4. Inject the updated actionstep-proxy.js into Actionstep custom fields

## API Integration

The actionstep-client.js provides convenience methods:
- `getMatters(params)`: Fetch actions/matters with pagination and sorting
- `getContacts(params)`: Fetch participants/contacts with pagination
- `getMatterById(matterId)`: Fetch specific matter details
- `apiRequest(endpoint, options)`: Generic API request method

All API calls return promises and handle authentication automatically through the parent domain's cookies.
