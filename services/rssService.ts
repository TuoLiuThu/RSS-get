import { Episode, Podcast } from '../types';

interface ProxyConfig {
  url: string;
  isJson: boolean; // Expects JSON wrapper { contents: string }
  isRaw: boolean;  // Expects raw XML text
}

const PROXIES: ProxyConfig[] = [
  // JSON mode is safest for CORS
  { url: 'https://api.allorigins.win/get?url=', isJson: true, isRaw: false },
  // Raw mode on allorigins sometimes handles redirects better
  { url: 'https://api.allorigins.win/raw?url=', isJson: false, isRaw: true },
  // Fallbacks
  { url: 'https://corsproxy.io/?', isJson: false, isRaw: true },
  { url: 'https://api.codetabs.com/v1/proxy?quest=', isJson: false, isRaw: true }
];

const fetchWithTimeout = async (url: string, timeout = 25000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

/**
 * Fallback Parser: Uses Regex to extract data from raw text.
 * useful when XML is malformed (Dwarkesh) or has complex namespaces (MLST).
 */
const parseWithRegex = (text: string): { title: string, link: string, content: string, pubDate: string } | null => {
  try {
    // 1. Find the first <item> or <entry> block
    // We limit the search to the first 500k chars to avoid hanging on massive files
    const limitText = text.substring(0, 500000);
    
    // Normalize newlines
    const normalized = limitText.replace(/\r\n/g, '\n');

    // Regex to find content between <item>...</item> OR <entry>...</entry>
    // [\s\S] matches newlines
    const itemMatch = normalized.match(/<item[\s>]([\s\S]*?)<\/item>/i) || normalized.match(/<entry[\s>]([\s\S]*?)<\/entry>/i);

    if (!itemMatch) return null;

    const itemBody = itemMatch[1];

    // Extract Title
    const titleMatch = itemBody.match(/<title.*?>(.*?)<\/title>/i);
    let title = titleMatch ? titleMatch[1] : 'No Title';
    title = title.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();

    // Extract Link
    // RSS: <link>...</link>
    // Atom: <link href="..." />
    let link = '';
    const linkTagMatch = itemBody.match(/<link[^>]*>(.*?)<\/link>/i);
    const linkHrefMatch = itemBody.match(/<link[^>]*href=["'](.*?)["']/i);
    
    if (linkTagMatch && linkTagMatch[1]) link = linkTagMatch[1];
    else if (linkHrefMatch && linkHrefMatch[1]) link = linkHrefMatch[1];
    link = link.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();

    // Extract Date
    const dateMatch = itemBody.match(/<(pubDate|published).*?>(.*?)<\/\1>/i);
    const pubDate = dateMatch ? dateMatch[2] : new Date().toISOString();

    // Extract Content (Priority: content:encoded -> description -> summary)
    // content:encoded often lives in CDATA
    const encodedMatch = itemBody.match(/<content:encoded[^>]*>([\s\S]*?)<\/content:encoded>/i);
    const descMatch = itemBody.match(/<description[^>]*>([\s\S]*?)<\/description>/i);
    const summaryMatch = itemBody.match(/<summary[^>]*>([\s\S]*?)<\/summary>/i);

    let rawContent = '';
    if (encodedMatch) rawContent = encodedMatch[1];
    else if (descMatch) rawContent = descMatch[1];
    else if (summaryMatch) rawContent = summaryMatch[1];

    // Clean Content
    // 1. Remove CDATA wrappers
    rawContent = rawContent.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1');
    // 2. Remove HTML tags
    let cleanContent = rawContent.replace(/<[^>]*>?/gm, ' ');
    // 3. Normalize whitespace
    cleanContent = cleanContent.replace(/\s+/g, ' ').trim();

    return {
      title,
      link,
      pubDate,
      content: cleanContent.substring(0, 15000) // Cap for AI
    };

  } catch (e) {
    console.warn("Regex parsing failed:", e);
    return null;
  }
};

const fetchFeedContent = async (url: string): Promise<string> => {
  let lastError;
  const cacheBuster = `&_t=${Date.now()}`; // Prevent caching

  for (const proxy of PROXIES) {
    try {
      const targetUrl = `${proxy.url}${encodeURIComponent(url)}${cacheBuster}`;
      const response = await fetchWithTimeout(targetUrl);
      
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      
      let text = '';
      if (proxy.isJson) {
        const data = await response.json();
        if (data.contents) {
            text = data.contents;
        } else if (data.status?.http_code) {
             throw new Error(`Proxy Error: Target returned ${data.status.http_code}`);
        } else {
             text = JSON.stringify(data); // Fallback
        }
      } else {
        text = await response.text();
      }

      if (!text || typeof text !== 'string') throw new Error('Empty response');

      const trimmed = text.trim();
      
      // Validation: Detect "Error Pages"
      // If it's short (< 300 chars) and doesn't contain "xml", "rss", "feed" -> It's likely a proxy error page
      if (trimmed.length < 300) {
        if (!trimmed.toLowerCase().includes('xml') && !trimmed.toLowerCase().includes('rss') && !trimmed.toLowerCase().includes('feed')) {
           throw new Error(`Content too short/invalid (Length: ${trimmed.length}). Likely a proxy error.`);
        }
      }

      return text;
    } catch (error) {
    //   console.warn(`Proxy ${proxy.url} failed for ${url}:`, error);
      lastError = error;
    }
  }
  
  throw lastError || new Error('All proxies exhausted.');
};

export const fetchLatestEpisodes = async (podcasts: Podcast[]): Promise<Episode[]> => {
  const episodes: Episode[] = [];

  const promises = podcasts.map(async (podcast) => {
    try {
      const text = await fetchFeedContent(podcast.rssUrl);
      
      // Strategy 1: Standard DOM Parser
      const parser = new DOMParser();
      let title, link, pubDate, content;
      let parseSuccess = false;

      try {
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        const parseError = xmlDoc.querySelector('parsererror');
        
        if (!parseError) {
          // Try to find Item/Entry
          let item = xmlDoc.querySelector('item');
          if (!item) item = xmlDoc.querySelector('entry'); // Atom
          
          if (item) {
             title = item.querySelector('title')?.textContent || 'No Title';
             link = item.querySelector('link')?.textContent || item.querySelector('link')?.getAttribute('href') || '';
             pubDate = item.querySelector('pubDate')?.textContent || item.querySelector('published')?.textContent || '';
             
             // Content
             const encoded = item.getElementsByTagName('content:encoded')[0] || item.getElementsByTagNameNS('*', 'encoded')[0];
             const desc = item.querySelector('description');
             const summary = item.querySelector('summary');
             
             let rawC = '';
             if (encoded && encoded.textContent) rawC = encoded.textContent;
             else if (desc && desc.textContent) rawC = desc.textContent;
             else if (summary && summary.textContent) rawC = summary.textContent;

             content = rawC.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim().substring(0, 15000);
             parseSuccess = true;
          }
        }
      } catch (e) {
        // DOM Parser failed, proceed to fallback
      }

      // Strategy 2: Regex Fallback (The "Dirty" Parser)
      // Used if DOMParser threw error OR found no items (parseSuccess === false)
      if (!parseSuccess) {
        // console.log(`DOM Parse failed for ${podcast.name}, using Regex Fallback...`);
        const regexResult = parseWithRegex(text);
        if (regexResult) {
          title = regexResult.title;
          link = regexResult.link;
          pubDate = regexResult.pubDate;
          content = regexResult.content;
          parseSuccess = true;
        } else {
             throw new Error("Both XML and Regex parsing failed to find episodes.");
        }
      }

      episodes.push({
        title: title || 'Unknown Title',
        link: link || '',
        pubDate: pubDate || '',
        content: content || 'No content found.',
        podcastName: podcast.name,
        status: 'success'
      });

    } catch (error: any) {
      console.error(`RSS Fail [${podcast.name}]:`, error);
      episodes.push({
        title: 'Fetch Failed',
        link: podcast.rssUrl,
        pubDate: new Date().toISOString(),
        content: `Error: ${error.message}`,
        podcastName: podcast.name,
        status: 'error'
      });
    }
  });

  await Promise.all(promises);
  return episodes;
};