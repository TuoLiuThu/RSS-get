export interface Podcast {
  id: string;
  name: string;
  rssUrl: string;
  websiteUrl?: string;
  imageUrl?: string;
}

export interface Episode {
  title: string;
  link: string;
  pubDate: string;
  content: string; // Description or transcript snippet
  podcastName: string;
  status: 'success' | 'error';
}

export interface SummaryResult {
  originalTitle: string;
  translatedTitle: string;
  originalLink: string;
  summaryEnglish: string;
  summaryChinese: string;
  keyPoints: string[]; // Chinese
  podcastName: string;
  status?: 'success' | 'error';
}

export interface UserSettings {
  targetEmail: string;
  deliveryTime: string; // "00:00"
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  SETTINGS = 'SETTINGS',
  PREVIEW = 'PREVIEW'
}

export const DEFAULT_PODCASTS: Podcast[] = [
  {
    id: '1',
    name: 'Acquired',
    // Using Transistor feed
    rssUrl: 'https://feeds.transistor.fm/acquired',
    imageUrl: 'https://picsum.photos/seed/acquired/200/200'
  },
  {
    id: '2',
    name: 'Dwarkesh Podcast',
    // Direct Podbean feed
    rssUrl: 'https://feed.podbean.com/dwarkeshpatel/feed.xml', 
    imageUrl: 'https://picsum.photos/seed/dwarkesh/200/200'
  },
  {
    id: '3',
    name: 'Lex Fridman Podcast',
    rssUrl: 'https://lexfridman.com/feed/podcast/',
    imageUrl: 'https://picsum.photos/seed/lex/200/200'
  },
  {
    id: '4',
    name: 'Invest Like the Best',
    rssUrl: 'https://investlikethebest.libsyn.com/rss',
    imageUrl: 'https://picsum.photos/seed/invest/200/200'
  },
  {
    id: '5',
    name: 'Latent Space',
    // Switched to Substack API direct link which works better with proxies
    rssUrl: 'https://api.substack.com/feed/podcast/1075630.rss',
    imageUrl: 'https://picsum.photos/seed/latent/200/200'
  },
  {
    id: '6',
    name: 'No Priors',
    rssUrl: 'https://feeds.megaphone.fm/nopriors',
    imageUrl: 'https://picsum.photos/seed/nopriors/200/200'
  },
  {
    id: '7',
    name: 'Machine Learning Street Talk',
    rssUrl: 'https://feeds.buzzsprout.com/1761821.rss',
    imageUrl: 'https://picsum.photos/seed/mlst/200/200'
  }
];