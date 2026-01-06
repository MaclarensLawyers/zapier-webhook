/**
 * ACTIONSTEP PROXY SCRIPT
 * 
 * Inject this script into your Actionstep custom field to enable
 * communication between the embedded iframe and Actionstep's API.
 * 
 * INSTRUCTIONS:
 * 1. Go to Actionstep > Setup > Data Collections
 * 2. Create or edit a custom field
 * 3. Paste this entire script into the JavaScript section
 * 4. Update IFRAME_ORIGIN below to match your GitHub Pages URL
 */

(function() {
    'use strict';
    
    // ============================================
    // CONFIGURATION - UPDATE THIS!
    // ============================================
    const IFRAME_ORIGIN = 'https://YOUR-USERNAME.github.io'; // Change to your GitHub Pages URL
    const IFRAME_URL = 'https://YOUR-USERNAME.github.io/YOUR-REPO-NAME'; // Full URL to your site
    
    // ============================================
    // DO NOT MODIFY BELOW THIS LINE
    // ============================================
    
    console.log('🚀 Actionstep Proxy Script loaded');
    
    let iframe = null;
    
    // Create and inject iframe
    function createIframe() {
        // Check if iframe already exists
        if (document.getElementById('actionstep-enhanced-iframe')) {
            console.log('⚠️ Iframe already exists');
            return;
        }
        
        // Find a good place to inject the iframe
        const container = document.querySelector('.action-form') || 
                         document.querySelector('.main-content') || 
                         document.body;
        
        // Create container div
        const iframeContainer = document.createElement('div');
        iframeContainer.id = 'actionstep-enhanced-container';
        iframeContainer.style.cssText = `
            width: 100%;
            min-height: 600px;
            margin: 20px 0;
            border: 1px solid #ddd;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;
        
        // Create iframe
        iframe = document.createElement('iframe');
        iframe.id = 'actionstep-enhanced-iframe';
        iframe.src = IFRAME_URL;
        iframe.style.cssText = `
            width: 100%;
            height: 600px;
            border: none;
        `;
        
        iframeContainer.appendChild(iframe);
        container.insertBefore(iframeContainer, container.firstChild);
        
        console.log('✅ Iframe injected');
    }
    
    // Handle API requests from iframe
    async function handleApiRequest(requestId, endpoint, options) {
        try {
            console.log('📡 API Request:', endpoint);
            
            // Construct full URL
            const baseUrl = window.location.origin;
            const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}/${endpoint}`;
            
            // Make request - browser automatically includes httpOnly cookies
            const response = await fetch(url, {
                ...options,
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...(options.headers || {})
                }
            });
            
            // Check if response is ok
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            // Parse response
            const data = await response.json();
            
            console.log('✅ API Response received');
            
            // Send success response back to iframe
            iframe.contentWindow.postMessage({
                type: 'API_RESPONSE',
                requestId,
                data
            }, IFRAME_ORIGIN);
            
        } catch (error) {
            console.error('❌ API Error:', error);
            
            // Send error response back to iframe
            iframe.contentWindow.postMessage({
                type: 'API_RESPONSE',
                requestId,
                error: error.message
            }, IFRAME_ORIGIN);
        }
    }
    
    // Listen for messages from iframe
    window.addEventListener('message', function(event) {
        // Security check: only accept messages from our iframe origin
        if (event.origin !== IFRAME_ORIGIN) {
            console.warn('⚠️ Rejected message from unknown origin:', event.origin);
            return;
        }
        
        const { type, requestId, endpoint, options } = event.data;
        
        if (type === 'IFRAME_READY') {
            console.log('📨 Iframe ready, sending connection confirmation');
            
            // Send confirmation back to iframe
            event.source.postMessage({
                type: 'CONNECTION_READY'
            }, event.origin);
            
        } else if (type === 'API_REQUEST') {
            console.log('📨 Received API request:', requestId);
            handleApiRequest(requestId, endpoint, options);
        }
    });
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', createIframe);
    } else {
        createIframe();
    }
    
    console.log('✅ Actionstep Proxy Script initialized');
    console.log('🔍 Waiting for iframe messages from:', IFRAME_ORIGIN);
    
})();
