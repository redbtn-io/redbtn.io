export type ContactPayload = {
  send: string;
  name: string | FormDataEntryValue | null;
  email: string | FormDataEntryValue | null;
  message: string | FormDataEntryValue | null;
  source?: string;
  cc?: string;
};

export async function sendContact(payload: ContactPayload): Promise<Response> {
  return fetch("https://contact-ldgqw3kyla-uc.a.run.app", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}