import { CLIENT_ID, REDIRECT_URI, SCOPES } from '../api/spotify.js';
import { generateCodeVerifier, generateCodeChallenge } from '../utils/auth.js';

if (typeof chrome !== 'undefined' && chrome.runtime) {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.type === 'auth') {
            handleAuth(sendResponse);
            return true;
        }
        
        if (request.type === 'refresh_token') {
            handleTokenRefresh(sendResponse);
            return true;
        }
    });
}


async function handleAuth(sendResponse) {
    try {
        const codeVerifier = generateCodeVerifier();
        await chrome.storage.local.set({ codeVerifier });
        const codeChallenge = await generateCodeChallenge(codeVerifier);

        const authURL = `https://accounts.spotify.com/authorize?` +
            `client_id=${CLIENT_ID}` +
            `&response_type=code` +
            `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
            `&scope=${encodeURIComponent(SCOPES)}` +
            `&code_challenge_method=S256` +
            `&code_challenge=${codeChallenge}`;
        
        chrome.identity.launchWebAuthFlow({ 
            url: authURL, 
            interactive: true 
        }, async (redirectUrl) => {
            if (chrome.runtime.lastError || !redirectUrl) {
                sendResponse({ 
                    error: true, 
                    message: chrome.runtime.lastError?.message || 'Authentication failed' 
                });
                return;
            }

            try {
                const urlParams = new URL(redirectUrl).searchParams;
                const authCode = urlParams.get('code');
                
                if (!authCode) {
                    sendResponse({ 
                        error: true, 
                        message: 'No authorization code received' 
                    });
                    return;
                }
                
                const { codeVerifier } = await chrome.storage.local.get('codeVerifier');
                
                const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/x-www-form-urlencoded' 
                    },
                    body: new URLSearchParams({
                        client_id: CLIENT_ID,
                        grant_type: 'authorization_code',
                        code: authCode,
                        redirect_uri: REDIRECT_URI,
                        code_verifier: codeVerifier
                    })
                });

                const tokenData = await tokenResponse.json();

                if (tokenData.access_token && tokenData.refresh_token) {
                    await chrome.storage.local.set({
                        accessToken: tokenData.access_token,
                        refreshToken: tokenData.refresh_token,
                        expiresAt: Date.now() + tokenData.expires_in * 1000
                    });
                    
                    sendResponse({ 
                        success: true,
                        accessToken: tokenData.access_token 
                    });
                } else {
                    sendResponse({ 
                        error: true, 
                        message: 'Invalid token response from Spotify' 
                    });
                }
            } catch (err) {
                sendResponse({ 
                    error: true, 
                    message: 'Token exchange failed: ' + err.message 
                });
            }
        });
    } catch (err) {
        sendResponse({ 
            error: true, 
            message: 'Authentication error: ' + err.message 
        });
    }
}

async function handleTokenRefresh(sendResponse) {
    try {
        const { refreshToken } = await chrome.storage.local.get(['refreshToken']);
        
        if (!refreshToken) {
            sendResponse({ 
                error: true, 
                message: 'No refresh token available' 
            });
            return;
        }

        const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/x-www-form-urlencoded' 
            },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                grant_type: 'refresh_token',
                refresh_token: refreshToken
            })
        });

        const tokenData = await tokenResponse.json();
        
        if (tokenData.access_token) {
            await chrome.storage.local.set({
                accessToken: tokenData.access_token,
                expiresAt: Date.now() + tokenData.expires_in * 1000
            });
            
            sendResponse({ 
                success: true,
                accessToken: tokenData.access_token 
            });
        } else {
            sendResponse({ 
                error: true, 
                message: 'Failed to refresh token' 
            });
        }
    } catch (err) {
        sendResponse({ 
            error: true, 
            message: 'Token refresh error: ' + err.message 
        });
    }
}