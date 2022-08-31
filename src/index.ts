import * as dotenv from "dotenv";
dotenv.config();
import express, { Request } from "express";
import ytdl from "ytdl-core";
import cp from "child_process";
import ffmpeg from "ffmpeg-static";
import cors from "cors";
import contentDisposition from "content-disposition";
import { IQuery } from "./types/interfaces";
import { getVideoInfo } from "./utils/ytdlFunctions";
const app = express();
app.use(
  cors({
    origin: "*",
  })
);
app.get("/", (req, res) => {
  res.send("Hello World");
});
app.get("/getinfo", async (req, res) => {
  console.log("/getinfo");
  const url: string = (req.query.url as string) || "";
  const videoInfo = await getVideoInfo(url);
  if (videoInfo) {
    res.send(videoInfo);
  } else {
    res.status(400).send({
      error: 1,
      message: "Could not get video details at the moment",
    });
  }
});
app.get("/download", (req: Request<{}, {}, {}, IQuery>, res) => {
  console.log("/download");
  const { url, title } = req.query;
  const videoItag = parseInt(req.query.videoItag || "0");
  const audioItag = parseInt(req.query.audioItag);
  console.log("videoTag", videoItag);
  try {
    if (videoItag) {
      res.setHeader("Content-Type", "video/webm");
      res.setHeader("Content-Disposition", contentDisposition(title + ".webm"));

      const audio = ytdl(url, { filter: "audioonly", quality: audioItag });
      const video = ytdl(url, { filter: "videoonly", quality: videoItag });
      let ffmpegProcess: any = cp.spawn(
        ffmpeg,
        [
          "-loglevel",
          "8",
          "-hide_banner",
          "-i",
          "pipe:3",
          "-i",
          "pipe:4",
          "-map",
          "0:a",
          "-map",
          "1:v",
          "-c",
          "copy",
          "-f",
          "matroska",
          "pipe:5",
        ],
        {
          windowsHide: true,
          stdio: ["inherit", "inherit", "inherit", "pipe", "pipe", "pipe"],
        }
      );

      audio.pipe(ffmpegProcess.stdio[3]);
      video.pipe(ffmpegProcess.stdio[4]);
      ffmpegProcess.stdio[5].pipe(res);

      ffmpegProcess.on("close", () => {
        console.log("File Sent Complete");
      });
      res.on("close", () => {
        ffmpegProcess.kill();
        audio.destroy();
        video.destroy();
      });
      res.on("error", (err) => {
        console.log("Error while downloading", err);
        ffmpegProcess.kill();
        audio.destroy();
        video.destroy();
        res.end();
      });
    } else {
      res.setHeader("Content-Type", "audio/mp3");
      res.setHeader("Content-Disposition", contentDisposition(title + ".mp3"));
      const audio = ytdl(url, { filter: "audioonly", quality: audioItag });
      audio.pipe(res);
      audio.on("end", () => {
        console.log("Audio File Sent Complete");
      });

      res.on("close", () => {
        audio.destroy();
      });
      res.on("error", (err) => {
        console.log("Error while downloading audio", err);
        audio.destroy();
        res.end();
      });
    }
  } catch (err) {
    console.log("error", err);
    res.send({ error: err });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`⚡️[server]: Server is running  https://localhost:${port}`);
});
