# whatsappforwp-endpoint

The public address of the shared WhatsApp-for-WP8 service, in a file the phone
reads by itself.

`bore.pub` gives the tunnel a new random port every time it restarts, so the
address cannot be compiled into the app: it would be stale within a day. The
app fetches this repository's `endpoint.json` at startup and connects there.
Nothing here is a secret: the address is discoverable anyway, and access is
decided by the per-user token, not by knowing the host and the port.

## The file

```json
{
  "updatedAt": "2026-09-30T12:00:00.000Z",
  "host": "bore.pub",
  "port": 41234,
  "tls": false,
  "fingerprint": ""
}
```

- `tls` says whether the tunnel terminates TLS.
- `fingerprint` is the SHA-256 of the certificate, in the form the phone pins.
  Empty while TLS is off.

`endpoint.md` is the same information for people.

## Publishing the current address

Three ways, from the machine that keeps the tunnel open:

```bash
# From bore's own output
node publish.js --output "Listening on bore.pub:41234"

# Or explicitly
node publish.js --host bore.pub --port 41234

# Same, and push it, so the phone sees it immediately
node publish.js --host bore.pub --port 41234 --commit
```

The GitHub Action can do it too: run the `endpoint` workflow with the host and
port as inputs (Actions -> endpoint -> Run workflow). Use that when the tunnel
lives on a machine you are not at.

## What this repository is not

It is not the service. It only says where the service is right now.
