export function patchXmlHttpRequestWithCredentials(otelBaseUrl: string, withCredentials?: boolean) {
  const origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function (
    method: string,
    url: string | URL,
    async: boolean = true,
    username?: string | null,
    password?: string | null,
  ) {
    origOpen.call(this, method, url, async, username, password);
    if (!withCredentials) return;
    const urlString = typeof url === 'string' ? url : url.toString();
    if (urlString.includes(otelBaseUrl)) {
      this.withCredentials = withCredentials;
    }
  };
}
