export const SOURCE_HOSTS = {
  'Arkansas News':['news.uark.edu'], 'The New York Times':['nytimes.com'], 'IEEE Spectrum':['spectrum.ieee.org'],
  'AP News':['apnews.com'], 'Business Insider':['businessinsider.com'], 'Investing.com':['investing.com'],
  'BBC News': ['bbc.com', 'bbc.co.uk'], NPR: ['npr.org'], 'Ars Technica': ['arstechnica.com'],
  'The Verge': ['theverge.com'], 'Science News': ['sciencenews.org'], ScienceDaily: ['sciencedaily.com'],
  'MIT News': ['news.mit.edu'], 'Higher Ed Dive': ['highereddive.com'], NASA: ['nasa.gov'],
  Nature: ['nature.com'], Science: ['science.org', 'sciencemag.org'],
  'TechSpot':['techspot.com'], 'Digital Trends':['digitaltrends.com'], 'The Next Web':['thenextweb.com'],
  'Android Authority':['androidauthority.com'], 'Engadget':['engadget.com'], 'Reuters':['reuters.com'],
  'The Guardian': ['theguardian.com'], 'Live Science': ['livescience.com'],
  ScienceAlert: ['sciencealert.com'], 'Phys.org': ['phys.org'],
};
export function publisherForUrl(value) {
  let url;try{url=new URL(value);}catch{return null;}
  if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
  return Object.entries(SOURCE_HOSTS).find(([,hosts])=>hosts.some(h=>url.hostname===h||url.hostname.endsWith('.'+h)))?.[0] || null;
}
