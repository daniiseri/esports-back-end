import express from 'express';
import { PrismaClient } from '@prisma/client';
import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes';
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string';
import cors from 'cors';

const app = express(); 
app.use(express.json());
const prisma = new PrismaClient();

//{origin: url}
app.use(cors());

app.get('/games', async (request, response) => {
  const games = await prisma.game.findMany({
    include: {
      _count:{
        select: {
          ads: true,
        }
      }
    }
  })
  return response.json(games);
})

app.post('/games/:id/ads', async (request, response) => {
  const gameId = request.params.id;
  const body = request.body;

  const ad = await prisma.ad.create({
    data:{
      gameId,
      name: body.name,
      discord: body.discord,
      yearsPlaying: body.yearsPlaying,
      weekDay: body.weekDay.join(','),
      hourStart: convertHourStringToMinutes(body.hourStart),
      hourEnd: convertHourStringToMinutes(body.hourEnd),
      useVoiceChannel: body.useVoiceChannel,
    }
  })

  return response.status(201).json(ad);
})

app.get('/games/:id/ads', async (request, response)=>{
  const gameId = request.params.id;

  const ads = await prisma.ad.findMany({
    select: {
      id: true,
      name: true,
      weekDay: true,
      useVoiceChannel: true,
      yearsPlaying: true,
      hourEnd: true,
      hourStart: true,
    },
    where: {
      gameId
    },
    orderBy: {
      createAt: 'desc',
    }
  })

  return response.send(ads.map(ad => {
    return{ 
      ...ad,
      weekDay: ad.weekDay.split(','),
      hourStart: convertMinutesToHourString(ad.hourStart),
      hourEnd: convertMinutesToHourString(ad.hourEnd),
    }
  }));
});

app.get('/ads/:id/discord', async (request, response)=>{
  const adId = request.params.id;

  const ad = await prisma.ad.findUniqueOrThrow({
    select: {
      discord: true,
    },
    where: {
      id: adId
    }
  })

  return response.json({discord: ad.discord});
})

app.listen(3333, ()=>{
  console.log(`servidor rodando em http://localhost:3333`);
});