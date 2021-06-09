import {
  findKeys,
  get,
  remove,
  set,
} from 'ep_etherpad-lite/node/db/DB';

interface SyncConfigDisabled {
  sync: false;
}

interface SyncConfigPending {
  sync: 'pending';
  credentials: {
    type: 'cookies';
    session: string;
    mfa: string;
  };
}

interface SyncConfigInvalid {
  sync: 'invalid';
  credentials: {
    type: 'cookies';
    session: string;
    mfa: string;
  };
}

export interface SyncConfigEnabled {
  sync: true;
  credentials: {
    type: 'cookies';
    session: string;
    mfa: string;
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
  | SyncConfigInvalid | SyncConfigEnabled;

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
