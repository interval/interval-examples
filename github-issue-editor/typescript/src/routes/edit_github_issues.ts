import { Action, io, ctx } from '@interval/sdk';
import fetch from 'node-fetch';

async function githubAPI(method, url, body = null) {
  const auth = Buffer.from(
    `${process.env.GITHUB_USER}:${process.env.GITHUB_KEY}`
  ).toString('base64');
  const options = {
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/vnd.github.v3+json',
    },
  };

  if (body) {
    options['body'] = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  return await res.json();
}

export default new Action(async () => {
  const repos = await githubAPI(
    'GET',
    'https://api.github.com/user/repos?affiliation=owner'
  );
  const selectedRepos = await io.select.table(
    'Select a repo to edit issues for',
    {
      data: repos,
      columns: [
        'full_name',
        'created_at',
        { label: 'owner', renderCell: (row: any) => row.owner.login },
      ],
      maxSelections: 1,
    }
  );

  const repo = selectedRepos[0];
  const issues = await githubAPI(
    'GET',
    `https://api.github.com/repos/${repo.full_name}/issues`
  );
  const selectedIssues = await io.select.table('Select issues to edit', {
    data: issues,
    columns: [
      'title',
      'created_at',
      { label: 'user', renderCell: (row: any) => row.user.login },
      'url',
    ],
  });

  const operation = await io.select.single(
    'How do you want to edit the issues?',
    {
      options: [
        'Close' as const,
        'Set assignees' as const,
        'Set labels' as const,
      ],
    }
  );

  let body = {};
  switch (operation) {
    case 'Close':
      body['state'] = 'closed';
      break;
    case 'Set assignees':
      const contributors = await githubAPI(
        'GET',
        `https://api.github.com/repos/${repo.full_name}/contributors`
      );
      const selectedContributors = await io.select.multiple(
        'Select users to assign',
        {
          options: contributors.map(contributor => contributor.login),
        }
      );
      body['assignees'] = selectedContributors.map(contributor => contributor);

      break;
    case 'Set labels':
      const labels = await githubAPI(
        'GET',
        `https://api.github.com/repos/${repo.full_name}/labels`
      );
      const selectedLabels = await io.select.multiple(
        'Select labels to assign',
        {
          options: labels.map(label => label.name),
        }
      );
      body['labels'] = selectedLabels.map(label => label);
      break;
  }

  ctx.loading.start({
    label: `Editing issues for ${repo.full_name}`,
    itemsInQueue: selectedIssues.length,
  });

  for (const issue of selectedIssues) {
    const res = await githubAPI(
      'PATCH',
      `https://api.github.com/repos/${repo.full_name}/issues/${issue.number}`,
      body
    );
    ctx.log(res);
    ctx.loading.completeOne();
  }

  return 'Done!';
});
