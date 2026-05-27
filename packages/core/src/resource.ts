export function extractUriParams(
  template: string,
  uri: string
): Record<string, string> | null {
  const paramNames: string[] = [];
  const escaped = template.replace(/[.+?^${}()|[\]\\]/g, (ch) =>
    ch === "{" || ch === "}" ? ch : `\\${ch}`
  );
  const pattern = escaped.replace(/\{([^}]+)\}/g, (_, name: string) => {
    paramNames.push(name);
    return "([^/]+)";
  });
  const match = new RegExp(`^${pattern}$`).exec(uri);
  if (!match) return null;
  return Object.fromEntries(paramNames.map((name, i) => [name, match[i + 1] ?? ""]));
}

export function matchesUriTemplate(template: string, uri: string): boolean {
  return extractUriParams(template, uri) !== null;
}
