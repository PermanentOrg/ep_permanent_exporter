import type JQuery from 'jquery';

const padUrl = () => (
  window.location.href.replace(window.location.search, '')
);

const documentReady = (hookName: string) => {
  // eslint-disable-next-line no-console
  console.log('ep_permanent_exporter hook called:', hookName);

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
