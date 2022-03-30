import { PermanentOAuthClient } from '@permanentorg/node-sdk';
import { deleteAuthorToken, getAuthorToken, setAuthorToken } from './database';
import { pluginSettings } from './settings';
import type { AccessToken } from 'simple-oauth2';

import type {
  AuthorToken,
  AuthorTokenLive,
  AuthorTokenRefreshing,
  AuthorTokenValid,
} from './database';

const {
  authHost, baseUrl, clientId, clientSecret,
} = pluginSettings;

const client = new PermanentOAuthClient(
  clientId,
  clientSecret,
  baseUrl,
  authHost,
);

const authorTokenIsLive = (token: AuthorToken): token is AuthorTokenLive => (
  token.status === 'live'
);

const authorTokenIsValid = (token: AuthorToken): token is AuthorTokenValid => (
  token.status === 'valid'
);

const getOrRefreshToken = async (author: string): Promise<AuthorToken> => {
  try {
    const authorToken = await getAuthorToken(author);
    if (!authorTokenIsValid(authorToken)) {
      return authorToken;
    }

    const token = client.loadToken(JSON.stringify(authorToken.token));
    if (!token.expired()) {
      return {
        status: 'live',
        token,
      }
    }
    if (!('refresh_token' in token.token)) {
      // token has expired and it is not a refresh token
      await deleteAuthorToken(author);
      return {
        status: 'missing',
      };
    }

    // the token has expired, but we haven't tried to refresh it yet
    const refreshingAuthorToken: AuthorTokenRefreshing = {
      status: 'refreshing',
      token: authorToken.token,
    };
    await setAuthorToken(author, refreshingAuthorToken);
    setImmediate(() => {
      console.log('getOrRefreshToken refreshing token');
      token.refresh()
        .then((refreshedToken: AccessToken) => {
          console.log('getOrRefreshToken token refreshed', refreshedToken);
          setAuthorToken(author, {
            token: refreshedToken.token,
            status: 'valid',
          });
        })
        .catch((err: unknown) => {
          console.log('Error while refreshing token for author', author, err);
          return deleteAuthorToken(author);
        });
    });
    return refreshingAuthorToken;
  } catch (error: unknown) {
    console.log('Error trying to determine if user is logged in to Permanent', typeof error, error);
    return {
      status: 'missing',
    };
  }
};

export { authorTokenIsLive, client, getOrRefreshToken };
