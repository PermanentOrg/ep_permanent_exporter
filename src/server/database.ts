import { get, set } from 'ep_etherpad-lite/node/db/DB';

interface SyncConfigDisabled {
  sync: false;
  credentials?: 'invalid';
}

interface SyncConfigPending {
  sync: 'pending';
  credentials: {
    type: 'cookies';
    session: string;
    mfa: string;
  };
}

interface SyncConfigEnabled {
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

export type SyncConfig = SyncConfigDisabled | SyncConfigPending | SyncConfigEnabled;

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

const setSyncConfig = async (
  padId: string,
  authorId: string,
  config: SyncConfig,
): Promise<SyncConfig> => (
  set(`permanent:${padId}:${authorId}`, config)
);

export { getSyncConfig, setSyncConfig };