import ytdl from "ytdl-core";
export const getVideoDetails = (info: ytdl.videoInfo) => {
  return {
    title: info.videoDetails.title,
    length: info.videoDetails.lengthSeconds,
    thumbnailImage: info.videoDetails.thumbnails[0].url,
  };
};
const getVideoFormats = (info: ytdl.videoInfo) => {
  return info.formats
    .filter(
      (format) =>
        !format.hasAudio && format.hasVideo && format.videoCodec === "vp9"
    )
    .map((format) => ({
      quality: format.qualityLabel,
      itag: format.itag,
      size: format.contentLength,
    }));
};
const getAudioFormat = (info: ytdl.videoInfo) => {
  const audio = info.formats.filter(
    (format) => !format.hasVideo && format.hasAudio
  );
  return {
    quality: "Audio Only",
    itag: audio[audio.length - 1].itag,
    size: audio[audio.length - 1].contentLength,
  };
};

export const getVideoInfo = async (url: string) => {
  try {
    const info = await ytdl.getInfo(url);
    const videoDetails = getVideoDetails(info);
    const videoFormats = getVideoFormats(info);
    const audioFormat = getAudioFormat(info);
    return {
      videoDetails,
      videoFormats,
      audioFormat,
    };
  } catch (err) {
    console.log(err);
    return;
  }
};
