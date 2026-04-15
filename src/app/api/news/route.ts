import { NextRequest, NextResponse } from 'next/server';

const CATEGORY_QUERIES: Record<string, string> = {
  all: 'medical OR health OR medicine',
  health: 'health care OR public health OR WHO',
  medicine: 'pharmaceutical OR drug OR medication OR FDA',
  cancer: 'cancer OR oncology OR tumor',
  surgery: 'surgery OR surgical OR operation',
  'mental health': 'mental health OR psychology OR depression OR anxiety',
  vaccine: 'vaccine OR vaccination OR immunization',
  technology: 'medical technology OR AI medicine OR digital health OR medtech',
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category') ?? 'all';

  const apiKey = process.env.NEWS_API_KEY;
  if (!apiKey) {
    // Return mock articles when no API key is configured
    return NextResponse.json({ articles: getMockArticles() });
  }

  try {
    const query = CATEGORY_QUERIES[category] ?? CATEGORY_QUERIES['all'];
    const url = category === 'all'
      ? `https://newsapi.org/v2/top-headlines?category=health&pageSize=15&language=en&apiKey=${apiKey}`
      : `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&sortBy=publishedAt&pageSize=15&language=en&apiKey=${apiKey}`;

    const res = await fetch(url, { next: { revalidate: 1800 } }); // cache 30 min
    if (!res.ok) {
      return NextResponse.json({ articles: getMockArticles() });
    }
    const data = await res.json() as { articles?: unknown[] };
    return NextResponse.json({ articles: data.articles ?? [] });
  } catch {
    return NextResponse.json({ articles: getMockArticles() });
  }
}

function getMockArticles() {
  return [
    {
      source: { id: null, name: 'WHO' },
      author: 'World Health Organization',
      title: 'WHO releases new guidelines on antimicrobial resistance',
      description: 'The World Health Organization has published updated guidelines to combat growing antimicrobial resistance globally, urging countries to take immediate action.',
      url: 'https://www.who.int',
      urlToImage: null,
      publishedAt: new Date().toISOString(),
      content: '',
    },
    {
      source: { id: null, name: 'The Lancet' },
      author: 'Editorial Team',
      title: 'AI-powered diagnostics show promise in early cancer detection',
      description: 'A new study published in The Lancet shows that AI models can detect early-stage cancers with accuracy comparable to experienced radiologists.',
      url: 'https://www.thelancet.com',
      urlToImage: null,
      publishedAt: new Date(Date.now() - 3600000).toISOString(),
      content: '',
    },
    {
      source: { id: null, name: 'NEJM' },
      author: 'Research Division',
      title: 'New mRNA vaccine platform shows broad efficacy against influenza strains',
      description: 'Researchers at Harvard Medical School have developed an mRNA-based influenza vaccine that provides cross-protection against multiple strains.',
      url: 'https://www.nejm.org',
      urlToImage: null,
      publishedAt: new Date(Date.now() - 7200000).toISOString(),
      content: '',
    },
    {
      source: { id: null, name: 'BMJ' },
      author: 'Clinical Research',
      title: 'Telemedicine adoption accelerates in Central Asia post-pandemic',
      description: 'A comprehensive review of telemedicine adoption across Central Asian countries reveals significant growth in digital health consultations since 2020.',
      url: 'https://www.bmj.com',
      urlToImage: null,
      publishedAt: new Date(Date.now() - 10800000).toISOString(),
      content: '',
    },
    {
      source: { id: null, name: 'Medscape' },
      author: 'Medical Staff',
      title: 'Electronic health records improve patient outcomes in outpatient settings',
      description: 'A multi-center study across 200 clinics demonstrates that structured EHR adoption leads to measurable improvements in follow-up care and reduced medication errors.',
      url: 'https://www.medscape.com',
      urlToImage: null,
      publishedAt: new Date(Date.now() - 14400000).toISOString(),
      content: '',
    },
    {
      source: { id: null, name: 'PubMed Central' },
      author: 'Research Team',
      title: 'Mental health crisis among healthcare workers demands systemic response',
      description: 'A global survey of over 50,000 healthcare workers reveals alarming rates of burnout, anxiety, and depression, calling for institutional support programs.',
      url: 'https://www.ncbi.nlm.nih.gov/pmc/',
      urlToImage: null,
      publishedAt: new Date(Date.now() - 18000000).toISOString(),
      content: '',
    },
  ];
}
