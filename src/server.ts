import { config } from 'dotenv';
import contentDisposition from 'content-disposition';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import staticPlugin from '@fastify/static';
import ytdl from '@distube/ytdl-core';
import path from 'path';
import { pipeline } from 'stream/promises';

async function buildServer() {
  config();
  const fastify = Fastify({ logger: true });

  await fastify.register(cors, { origin: true });
  await fastify.register(staticPlugin, {
    root: path.join(__dirname, '../public'),
    prefix: '/',
    list: false,
  });

  fastify.get(
    '/api/download',
    {
      schema: {
        querystring: {
          type: 'object',
          required: ['url'],
          properties: { url: { type: 'string', format: 'uri' } },
        },
      },
    },
    async (request, reply) => {
      const { url } = request.query as { url: string };

      let info;
      try {
        info = await ytdl.getInfo(url);
      } catch (err) {
        request.log.error(err);
        reply.code(400).send({ error: 'Не удалось получить информацию о видео' });
        return;
      }

      const rawTitle = info.videoDetails.title;
      const fileName = rawTitle
        .normalize('NFKD')
        .replace(/[^\p{L}\p{N}]+/gu, '_')
        .toLowerCase()
        .replace(/^_+|_+$/g, '')
        .replace(/_+/g, '_')
        .concat('.m4a');

      reply
        .header('Content-Type', 'audio/mp4')
        .header('Content-Disposition', contentDisposition(fileName, { type: 'attachment' }));

      try {
        await pipeline(ytdl(url, { quality: 140 }), reply.raw);
      } catch (err) {
        request.log.error(err);
        reply.send(err);
      }
    },
  );

  return fastify;
}

async function start() {
  try {
    const server = await buildServer();
    const PORT = Number(process.env.PORT) || 3000;
    await server.listen({ port: PORT, host: '0.0.0.0' });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

start(); // вызываем -> никакого top‑level await
