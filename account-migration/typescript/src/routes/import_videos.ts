import { Action, io, ctx } from '@interval/sdk';
import { Video } from '@prisma/client';
import {
  findUsers,
  generateThumbnail,
  getCollisionSafeSlug,
  prisma,
} from '../util';

export default new Action(async () => {
  const user = await io.search('Select an account', {
    onSearch: query => {
      return findUsers(query);
    },
    renderResult: u => ({
      label: `${u.firstName} ${u.lastName}`,
      description: u.email,
    }),
  });

  const videosFile = await io.input.file('Select a file', {
    allowedExtensions: ['.json'],
  });

  const videos = await videosFile.json();

  await io.display.table('Videos to import', {
    data: videos,
    helpText: 'Press Continue to run the import.',
  });

  const confirmed = await io.confirm(`Import ${videos.length} videos?`);
  if (!confirmed) return 'Action canceled, no videos imported';

  ctx.loading.start({
    label: 'Uploading videos...',
    itemsInQueue: videos.length,
  });

  const importedVideos: Video[] = [];

  for (let i = 0; i < videos.length; i++) {
    // use our app's internal methods to create the missing inputs
    const thumbnailUrl = await generateThumbnail(videos[i].url);
    const slug = await getCollisionSafeSlug(videos[i].name);

    const createdAt = new Date(videos[i].createdAt * 1000);

    const video = await prisma.video.create({
      data: {
        title: videos[i].name,
        url: videos[i].url,
        thumbnailUrl,
        slug,
        createdAt,
        user: { connect: { id: user.id } },
      },
    });

    importedVideos.push(video);
    ctx.loading.completeOne();
  }

  return `Imported ${importedVideos.length} videos for ${user.email}`;
});
