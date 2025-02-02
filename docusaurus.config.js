import githubTheme from 'prism-react-renderer/themes/github';
import draculaTheme from 'prism-react-renderer/themes/dracula';

const config = {
  title: 'BTC Cycle',
  tagline: 'LSTM Model built to predict bitcoin bottom and top',
  favicon: 'img/Logo-Eclipse.jpg',

  // 🌍 Update with your GitHub Pages URL
  url: 'https://benjifaccin.github.io', // Your GitHub Pages URL
  baseUrl: '/eclipse/', // Your repository name

  organizationName: 'BenjiFaccin', // Your GitHub username
  projectName: 'eclipse', // Your repository name
  deploymentBranch: "gh-pages", // Define the deployment branch

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: require.resolve('./sidebars.js'),
          editUrl: 'https://github.com/BenjiFaccin/eclipse/edit/main/',
        },
        blog: false,
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      },
    ],
  ],

  themeConfig: {
    image: 'img/docusaurus-social-card.jpg',
    navbar: {
      title: 'Home',
      logo: {
        alt: 'My Site Logo',
        src: 'img/Logo-Eclipse.jpg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Read docs',
        },
        {
          href: 'https://www.linkedin.com/in/benjamin-faccin/',
          label: 'LinkedIn',
          position: 'right',
        },
      ],
    },
    prism: {
      theme: githubTheme,
      darkTheme: draculaTheme,
    },
  },
};

export default config;
