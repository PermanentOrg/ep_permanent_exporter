import type JQuery from 'jquery';
import type { } from 'types-wm';

const padUrl = () => (
  window.location.href.replace(window.location.search, '')
);

const monetizationElements = [
  '#ep_permanent_exporter-monetization-missing',
  '#ep_permanent_exporter-monetization-loading',
  '#ep_permanent_exporter-monetization-started',
];

const showOneOfGroup = (group: string[], pattern: string) => {
  group.forEach((element) => $(element).toggle(element.endsWith(pattern)));
};

const initializeMonetization = () => {
  if (!document.monetization) {
    return;
  }

  showOneOfGroup(monetizationElements, 'loading');

  document.monetization.addEventListener('monetizationstart', () => (
    showOneOfGroup(monetizationElements, 'started')
  ));
  if (document.monetization.state === 'started') {
    showOneOfGroup(monetizationElements, 'started');
  }
};

const syncElements = [
  '#ep_permanent_exporter-log-in',
  '#ep_permanent_exporter-log-in-pending',
  '#ep_permanent_exporter-sync-disabled',
  '#ep_permanent_exporter-sync-pending',
  '#ep_permanent_exporter-sync-enabled',
];

const checkPermanentSyncStatus = async () => {
  const { loginStatus } = await $.getJSON('/permanent/status');
  const { sync } = await $.getJSON(`${padUrl()}/permanent`);

  if (loginStatus === 'logged-in') {
    if (sync === true) {
      showOneOfGroup(syncElements, 'sync-enabled');
    } else if (sync === 'pending') {
      showOneOfGroup(syncElements, 'sync-pending');
      setTimeout(checkPermanentSyncStatus, 1000);
    } else {
      showOneOfGroup(syncElements, 'sync-disabled');
    }
  } else if (loginStatus === 'pending') {
    showOneOfGroup(syncElements, 'log-in-pending');
    setTimeout(checkPermanentSyncStatus, 1000);
  } else {
    showOneOfGroup(syncElements, 'log-in');
  }
};

const documentReady = (hookName: string) => {
  // eslint-disable-next-line no-console
  console.log('ep_permanent_exporter hook called:', hookName);
  if (!document.monetization) {
    return;
  }
  initializeMonetization();

  checkPermanentSyncStatus();

  $('#ep_permanent_exporter-export-form-enable').submit((event: JQuery.SubmitEvent) => {
    event.preventDefault();
    showOneOfGroup(syncElements, 'sync-pending');

    $.ajax({
      method: 'POST',
      url: `${padUrl()}/permanent`,
      dataType: 'json',
      complete: () => {
        // it will take some amount of time for the sync to be established,
        // so start polling
        setTimeout(checkPermanentSyncStatus, 1000);
      },
    });
  });
  $('#ep_permanent_exporter-export-form-disable').submit((event: JQuery.SubmitEvent) => {
    event.preventDefault();
    showOneOfGroup(syncElements, 'sync-disabled');

    $.ajax({
      method: 'DELETE',
      url: `${padUrl()}/permanent`,
      dataType: 'json',
    });
  });
};

export { documentReady };
