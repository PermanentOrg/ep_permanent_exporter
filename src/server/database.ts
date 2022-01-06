import {
  findKeys,
  get,
  remove,
  set,
} from 'ep_etherpad-lite/node/db/DB';

interface AuthorTokenStatus {
    token: object|null;
    status: 'pending'|'valid'|null;
}

interface SyncConfigDisabled {
  sync: false;
}

interface SyncConfigPending {
  sync: 'pending';
  credentials: {
    type: 'token';
    token: string; // serialized JSON
  };
}

export interface SyncConfigEnabled {
  sync: true;
  credentials: {
    type: 'token';
    token: string; // serialized JSON
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
): Promise<object|null> => (
    await get(`permanent:${authorId}`)
);

const setAuthorToken = async(
    authorId: string,
    token: object,
): Promise<null> => (
    await set(`permanent:${authorId}`, token)
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
  deleteSyncConfig,
  getSyncConfig,
  getSyncConfigs,
  setSyncConfig,
};
