import { PermanentOAuthClient } from '@permanentorg/node-sdk';
import { deleteAuthorToken, getAuthorToken, setAuthorToken } from './database';
import { pluginSettings } from './settings';
import type { AccessToken } from 'simple-oauth2';

import type {
  AuthorToken,
  AuthorTokenLive,
  AuthorTokenMissing,
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

const refreshToken = async (
  author: string,
  expiredToken: AccessToken,
): Promise<AuthorTokenMissing | AuthorTokenLive> => {
  try {
    await setAuthorToken(author, {
      status: 'refreshing',
      token: expiredToken.token,
    });
    const refreshedToken = await expiredToken.refresh();
    setAuthorToken(author, {
      token: refreshedToken.token,
      status: 'valid',
    });
    return {
      status: 'live',
      token: refreshedToken,
    };
  } catch (err: unknown) {
    console.log('Error while refreshing token for author', author, err);
    deleteAuthorToken(author);
    return {
      status: 'missing',
    };
  }
};

const getOrRefreshToken = async (
  author: string,
): Promise<AuthorTokenMissing | AuthorTokenLive> => {
  try {
    const authorToken = await getAuthorToken(author);
    if (authorToken.status === 'missing') {
      return authorToken;
    }

    /* Ignore refreshing tokens; sometimes we're just gonna do some extra work.
     * This complexity is caused by ueberdb2 reducing everything to a key-value
     * store: ideally refreshing would start a database transaction, lock the
     * row with the token for updating, refresh the token, and store the
     * refreshed token or delete the expired refresh token; the "refreshing"
     * state should never be persisted in the database. Instead, we have to
     * roll our own transactions.
     */

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

    return refreshToken(author, token);
  } catch (error: unknown) {
    console.log('Error trying to determine if user is logged in to Permanent', typeof error, error);
    return {
      status: 'missing',
    };
  }
};

// quickly get a token, and queue a refresh in the background if needed
const getToken = async (
  author: string,
): Promise<AuthorTokenMissing | AuthorTokenLive | AuthorTokenRefreshing> => {
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
    setImmediate(() => {
      refreshToken(author, token);
    });
    return {
      status: 'refreshing',
      token: authorToken.token,
    };
  } catch (error: unknown) {
    console.log('Error trying to determine if user is logged in to Permanent', typeof error, error);
    return {
      status: 'missing',
    };
  }
};

export { authorTokenIsLive, client, getToken, getOrRefreshToken };
