import axios from 'axios';
import { Permanent } from '@permanentorg/node-sdk';
import FormData from 'form-data';

import { pluginSettings } from './settings';

const { apiKey, baseUrl, padToken } = pluginSettings;

const createClient = async (
  sessionToken: string,
  mfaToken: string,
  archiveId?: number,
  archiveNbr?: string,
): Promise<Permanent> => {
  const permanent = new Permanent({
    apiKey,
    baseUrl,
    mfaToken,
    sessionToken,
    archiveId,
    archiveNbr,
  });
  await permanent.init();
  return permanent;
};

const getOrCreateEtherpadFolder = async (permanent: Permanent) => {
  const appFolder = await permanent.folder.getAppFolder();
  const childFolders = appFolder.ChildFolderVOs || [];
  const etherpadFolder = childFolders.find((f) => f.displayName === 'Etherpad');
  return etherpadFolder || permanent.folder.create('Etherpad', appFolder);
};

const buildForm = (fields: object, data: Buffer) => {
  const formData = new FormData();
  Object.entries(fields)
    .forEach(([key, value]) => formData.append(key, value));
  formData.append('Content-Type', 'text/plain');
  formData.append('file', data);
  return formData;
};

interface PermanentUploadTarget {
  archiveId: number;
  archiveNbr: string;
  folder_linkId: number;
  parentFolderId: number;
  parentFolder_linkId: number;
}

const getSyncTarget = async (
  session: string,
  mfa: string,
): Promise<PermanentUploadTarget> => {
  const permanent = await createClient(session, mfa);
  const etherpadFolder = await getOrCreateEtherpadFolder(permanent);
  return {
    archiveId: permanent.getArchiveId() as number,
    archiveNbr: permanent.getArchiveNbr() as string,
    folder_linkId: etherpadFolder.folder_linkId,
    parentFolderId: etherpadFolder.folderId || 0,
    parentFolder_linkId: etherpadFolder.folder_linkId || 0,
  };
};

const uploadText = async (
  session: string,
  mfa: string,
  target: PermanentUploadTarget,
  displayName: string,
  filename: string,
  description: string,
  text: string,
): Promise<void> => {
  const data = Buffer.from(text);
  const record = {
    ...target,
    displayName,
    description,
    size: data.length,
    uploadFileName: filename,
  };

  const permanent = await createClient(session, mfa, target.archiveId, target.archiveNbr);
  const { destinationUrl, presignedPost } = await permanent.record.getPresignedUrl('text/plain', record, padToken);

  const form = buildForm(presignedPost.fields, data);
  await axios.post(
    presignedPost.url,
    form.getBuffer(),
    {
      headers: form.getHeaders(),
    },
  );

  await permanent.record.registerRecordAndAddStorage(
    record,
    destinationUrl,
    padToken,
  );
};

export { getSyncTarget, uploadText };
