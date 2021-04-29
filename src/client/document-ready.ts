import type JQuery from 'jquery';
import type { } from 'types-wm';

const padUrl = () => (
  window.location.href.replace(window.location.search, '')
);

const monetizationPending = () => {
  $('#ep_permanent_exporter-monetization-missing').hide();
  $('#ep_permanent_exporter-monetization-loading').show();
  $('#ep_permanent_exporter-monetization-started').hide();
};

const monetizationStart = () => {
  $('#ep_permanent_exporter-monetization-missing').hide();
  $('#ep_permanent_exporter-monetization-loading').hide();
  $('#ep_permanent_exporter-monetization-started').show();
};

const initializeMonetization = () => {
  if (!document.monetization) {
    return;
  }
  monetizationPending();
  if (document.monetization.state === 'started') {
    monetizationStart();
  } else {
    document.monetization.addEventListener('monetizationstart', monetizationStart);
  }
};

const documentReady = (hookName: string) => {
  // eslint-disable-next-line no-console
  console.log('ep_permanent_exporter hook called:', hookName);
  if (!document.monetization) {
    return;
  }
  initializeMonetization();

  $('#ep_permanent_exporter-export-form').submit((event: JQuery.SubmitEvent) => {
    event.preventDefault();

    // eslint-disable-next-line no-console
    console.log('ep_permanent_exporter form submitted:', event);

    $.ajax({
      method: 'PUT',
      url: `${padUrl()}/permanent`,
      contentType: 'application/json',
      data: JSON.stringify({
        export: $('#ep_permanent_exporter-export').is(':checked'),
        cookie: $('#ep_permanent_exporter-cookie').val(),
      }),
      dataType: 'json',
      // eslint-disable-next-line no-console
      complete: (jqXHR, textStatus) => console.log('ajax complete', jqXHR, textStatus),
    });
  });
};

export { documentReady };
