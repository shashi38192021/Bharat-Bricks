export const readApiResponse = async (res) => {
  const contentType = res.headers.get("content-type") || "";
  const text = await res.text();

  if (!text) {
    throw new Error(
      `Empty response from server (${res.status} ${res.statusText || "Unknown status"})`
    );
  }

  if (!contentType.includes("application/json")) {
    throw new Error(
      `Expected JSON but received ${contentType || "unknown content type"}`
    );
  }

  return JSON.parse(text);
};
