import {
  findKeys,
  get,
  remove,
  set,
} from 'ep_etherpad-lite/node/db/DB';

import type { AccessToken } from 'simple-oauth2';

interface AuthorTokenMissing {
  status: 'missing';
}

// this is necessary to prevent (or at least reduce?) race conditions
export interface AuthorTokenRefreshing {
  token: object;
  status: 'refreshing';
}

export interface AuthorTokenValid {
  token: object;
  status: 'valid';
}

export interface AuthorTokenLive {
  token: AccessToken;
  status: 'live';
}

export type AuthorToken = AuthorTokenMissing | AuthorTokenRefreshing
  | AuthorTokenValid | AuthorTokenLive;

interface SyncConfigDisabled {
  sync: false;
}

interface SyncConfigPending {
  sync: 'pending';
  credentials: {
    type: 'author';
    author: string;
  };
}

export interface SyncConfigEnabled {
  sync: true;
  credentials: {
    type: 'author';
    author: string;
  };
  target: {
    archiveId: number;
    archiveNbr: string;
    folder_linkId: number;
    parentFolderId: number;
    parentFolder_linkId: number;
  };
}

export type SyncConfig = SyncConfigDisabled | SyncConfigPending
 | SyncConfigEnabled;

const getAuthorToken = async (
  authorId: string,
): Promise<AuthorTokenMissing | AuthorTokenRefreshing | AuthorTokenValid> => (
  await get(`permanent:${authorId}`) || {
    status: 'missing',
  }
);

const setAuthorToken = async (
  authorId: string,
  authorToken: AuthorTokenMissing | AuthorTokenRefreshing | AuthorTokenValid,
): Promise<null> => (
  await set(`permanent:${authorId}`, authorToken)
);

const deleteAuthorToken = async (
  authorId: string,
): Promise<SyncConfig> => (
  remove(`permanent:${authorId}`)
);

const getSyncConfig = async (
  padId: string,
  authorId: string,
): Promise<SyncConfig> => {
  const value = await get(`permanent:${padId}:${authorId}`);
  if (value === null) {
    return { sync: false };
  }
  return value as SyncConfig;
};

const getSyncConfigs = async (padId: string): Promise<SyncConfig[]> => {
  const keys = await findKeys(`permanent:${padId}:*`, null) as string[];
  return Promise.all(keys.map((key) => get(key)));
};

const setSyncConfig = async (
  padId: string,
  authorId: string,
  config: SyncConfig,
): Promise<SyncConfig> => (
  set(`permanent:${padId}:${authorId}`, config)
);

const deleteSyncConfig = async (
  padId: string,
  authorId: string,
): Promise<SyncConfig> => (
  remove(`permanent:${padId}:${authorId}`)
);

export {
  deleteAuthorToken,
  deleteSyncConfig,
  getAuthorToken,
  getSyncConfig,
  getSyncConfigs,
  setAuthorToken,
  setSyncConfig,
};
