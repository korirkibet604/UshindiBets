// services/userAgents.js
let currentUserAgent = null;
let lastRotationTime = 0;
const ROTATION_INTERVAL = 5 * 60 * 1000; // Rotate every 5 minutes

export const getUserAgents = () => {
    const userAgents = [
        // The one you found from SofaScore
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',


        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        // Chrome Windows (Latest versions)
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',

        // Firefox Windows
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
        'Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',

        // Safari macOS
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',

        // Edge
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',

        // Mobile - iPhone
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
        'Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',

        // Mobile - Android
        'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        'Mozilla/5.0 (Linux; Android 13; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',

        // SofaScore Mobile Apps (Important!)
        'SofaScore/1.0 (com.sofascore.results; build:1; iOS 17.0.0) Alamofire/5.0.0',
        'SofaScore-Android/12.5.1',
        'okhttp/4.9.2',
        'SofaScore/12.5.1 (Linux; Android 13)',
        'SofaScore-iOS/15.2.1',

        // Common API clients
        'python-requests/2.31.0',
        'axios/1.6.0',
        'node-fetch/2.6.7',
        'curl/8.4.0',

        // Legacy browsers (sometimes work better with APIs)
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    ];

    return userAgents;
};

export const getRandomUserAgent = () => {
    const agents = getUserAgents();
    return agents[Math.floor(Math.random() * agents.length)];
};

// Cached version that rotates periodically
export const getCachedUserAgent = () => {
    const now = Date.now();

    if (!currentUserAgent || (now - lastRotationTime) > ROTATION_INTERVAL) {
        currentUserAgent = getRandomUserAgent();
        lastRotationTime = now;
    }

    return currentUserAgent;
};

// Test all user agents sequentially
export const testAllUserAgents = async (testFunction) => {
    const agents = getUserAgents();
    const results = [];

    for (let i = 0; i < agents.length; i++) {
        const userAgent = agents[i];
        try {
            console.log(`Testing User-Agent ${i + 1}/${agents.length}: ${userAgent.substring(0, 50)}...`);
            const result = await testFunction(userAgent);
            results.push({ userAgent, success: true, data: result });
            console.log(`✅ User-Agent ${i + 1} SUCCESS`);
        } catch (error) {
            results.push({ userAgent, success: false, error: error.message });
            console.log(`❌ User-Agent ${i + 1} FAILED: ${error.message}`);
        }

        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return results;
};