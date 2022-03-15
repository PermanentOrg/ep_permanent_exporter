import axios from 'axios';
import { Permanent, PermanentOAuthClient } from '@permanentorg/node-sdk';
import FormData from 'form-data';

import { pluginSettings } from './settings';

const {
  authHost, baseUrl, clientId, clientSecret, padToken,
} = pluginSettings;

const client = new PermanentOAuthClient(
  clientId,
  clientSecret,
  baseUrl,
  authHost,
);

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
  accessToken: string,
): Promise<PermanentUploadTarget> => {
  const fullToken = client.loadToken(accessToken);
  if (fullToken.expired()) {
    console.log('DEBUG: token expired');
    console.log(`Old token: ${fullToken.token.access_token}`);
    fullToken.refresh();
    console.log('DEBUG: we refreshed it');
    console.log(`New token: ${fullToken.token.access_token}`);
    console.log(fullToken.expired());
  }
  const permanent = new Permanent({
    accessToken: fullToken,
    baseUrl,
  });
  await permanent.init();
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
  accessToken: string,
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

  const fullToken = client.loadToken(JSON.parse(accessToken));
  let newToken = fullToken;
  if (fullToken.expired()) {
    console.log('DEBUG: token expired');
    console.log(`Old token: ${fullToken.token.access_token}`);
    newToken = await fullToken.refresh();
    console.log('DEBUG: we refreshed it');
    console.log(`New token: ${newToken.token.access_token}`);
    console.log(newToken.expired());
  }
  const permanent = new Permanent({
    accessToken: newToken,
    baseUrl,
  });
  await permanent.session.useArchive(target.archiveNbr);
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

export { client, getSyncTarget, uploadText };
