import { createFileRoute } from "@tanstack/react-router";
import { addRecipeByUrl } from "#/server/jobs/add-recipe/index";

export const Route = createFileRoute("/api/recipes/fetch")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const body = (await request.json()) as { url?: string };
        const url = body.url;

        if (!url) {
          return new Response("URL is required", { status: 400 });
        }

        try {
          new URL(url);
        } catch {
          return new Response("Invalid URL format", { status: 400 });
        }

        const stream = new ReadableStream({
          async start(controller) {
            const enc = new TextEncoder();
            const send = (data: object) =>
              controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));

            try {
              const { id } = await addRecipeByUrl(url, (event) => send(event));
              send({ type: "done", id });
            } catch (err) {
              send({
                type: "error",
                message: err instanceof Error ? err.message : "Unknown error",
              });
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
          },
        });
      },
    },
  },
});
