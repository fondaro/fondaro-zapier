module.exports = {
  type: 'oauth2',
  test: {
    removeMissingValuesFrom: { body: false, params: false },
    url: 'https://api.fondaro.com/zapier/oauth/userinfo',
  },
  oauth2Config: {
    authorizeUrl: {
      url: 'https://www.fondaro.com/zapier/authorize',
      params: {
        client_id: '{{process.env.CLIENT_ID}}',
        state: '{{bundle.inputData.state}}',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        response_type: 'code',
      },
    },
    getAccessToken: {
      body: {
        code: '{{bundle.inputData.code}}',
        client_id: '{{process.env.CLIENT_ID}}',
        client_secret: '{{process.env.CLIENT_SECRET}}',
        grant_type: 'authorization_code',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
      },
      method: 'POST',
      url: 'https://api.fondaro.com/zapier/oauth/token',
    },
    refreshAccessToken: {
      body: {
        refresh_token: '{{bundle.authData.refresh_token}}',
        grant_type: 'refresh_token',
        client_id: '{{process.env.CLIENT_ID}}',
        client_secret: '{{process.env.CLIENT_SECRET}}',
      },
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        accept: 'application/json',
      },
      method: 'POST',
      removeMissingValuesFrom: { body: false, params: false },
      url: 'https://api.fondaro.com/zapier/oauth/token',
    },
    autoRefresh: true,
  },
  connectionLabel:
    '{{bundle.inputData.organizationName}} ({{bundle.inputData.organizationId}})',
};
