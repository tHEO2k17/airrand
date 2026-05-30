function parseSseChunk(chunk: string): Array<{ event: string; data: string }> {
  const events: Array<{ event: string; data: string }> = [];
  const blocks = chunk.split("\n\n");

  for (const block of blocks) {
    if (!block.trim()) {
      continue;
    }

    let event = "message";
    const dataLines: string[] = [];

    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).trimStart());
      }
    }

    if (dataLines.length > 0) {
      events.push({ event, data: dataLines.join("\n") });
    }
  }

  return events;
}

export async function consumeSseStream(options: {
  url: string;
  signal?: AbortSignal;
  onEvent: (event: string, data: string) => void;
  onOpen?: () => void;
}): Promise<void> {
  const response = await fetch(options.url, {
    method: "GET",
    signal: options.signal,
  });

  if (!response.ok || !response.body) {
    throw new Error(`SSE connection failed (${response.status})`);
  }

  options.onOpen?.();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lastDelimiter = buffer.lastIndexOf("\n\n");
    if (lastDelimiter === -1) {
      continue;
    }

    const chunk = buffer.slice(0, lastDelimiter + 2);
    buffer = buffer.slice(lastDelimiter + 2);

    for (const parsed of parseSseChunk(chunk)) {
      options.onEvent(parsed.event, parsed.data);
    }
  }
}
